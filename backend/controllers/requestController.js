const Request = require('../models/Request');
const RequestDocument = require('../models/RequestDocument');
const ApprovalLog = require('../models/ApprovalLog');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const { sendMail } = require('../utils/mailer');

// Declares which extra "details" fields each request type expects, so the
// same generic form on the frontend can adapt itself, and so the backend
// can sanity-check that the required fields were actually sent.
const REQUIRED_DETAIL_FIELDS = {
  semester_registration: ['semester_to_register'],
  internal_mark_correction: ['subject_code', 'subject_name'],
  back_paper: ['subject_code', 'semester'],
  revaluation: ['subject_code', 'semester'],
  exam_grievance: ['subject_code', 'description'],
  bonafide_certificate: ['purpose'],
  scholarship_verification: ['scheme_name'],
};

const VALID_TYPES = Object.keys(REQUIRED_DETAIL_FIELDS);

async function createRequest(req, res) {
  try {
    const { type, details } = req.body;
    const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details || {};

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid request type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const missing = REQUIRED_DETAIL_FIELDS[type].filter((f) => !parsedDetails[f]);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required field(s) for ${type}: ${missing.join(', ')}` });
    }

    const request = await Request.create({ student_id: req.user.id, type, details: parsedDetails });

    // Attach any uploaded supporting documents (multer populates req.files)
    if (req.files && req.files.length) {
      for (const file of req.files) {
        await RequestDocument.create({
          request_id: request.id,
          file_url: `/uploads/documents/${file.filename}`,
          doc_type: req.body.doc_type || 'supporting_document',
        });
      }
    }

    await ApprovalLog.create({ request_id: request.id, admin_id: null, action: 'submitted', comment: 'Request submitted by student.' });

    await Notification.create({
      student_id: req.user.id,
      request_id: request.id,
      message: `Your ${type.replace(/_/g, ' ')} request has been submitted and is awaiting review.`,
    });
    sendMail({
      to: req.user.email,
      subject: 'Request Submitted - PMEC Service Portal',
      text: `Your ${type.replace(/_/g, ' ')} request (#${request.id}) has been submitted successfully and is awaiting review.`,
    });

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request.' });
  }
}

async function listMyRequests(req, res) {
  const requests = await Request.listByStudent(req.user.id);
  res.json(requests);
}

async function getRequestDetail(req, res) {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });

  // Students may only view their own requests; admins may view any.
  if (req.user.role === 'student' && request.student_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have access to this request.' });
  }

  const [documents, timeline, certificate] = await Promise.all([
    RequestDocument.listByRequest(request.id),
    ApprovalLog.listByRequest(request.id),
    Certificate.findByRequest(request.id),
  ]);

  res.json({ ...request, documents, timeline, certificate: certificate || null });
}

async function downloadCertificate(req, res) {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  if (req.user.role === 'student' && request.student_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have access to this certificate.' });
  }
  if (request.status !== 'approved') {
    return res.status(400).json({ error: 'Certificate is only available once the request is approved.' });
  }

  const certificate = await Certificate.findByRequest(request.id);
  if (!certificate) return res.status(404).json({ error: 'No certificate has been generated for this request.' });

  const path = require('path');
  const filePath = path.join(__dirname, '..', certificate.pdf_url.replace(/^\//, ''));
  res.download(filePath, `${certificate.certificate_no.replace(/\//g, '-')}.pdf`);
}

async function getNotifications(req, res) {
  try {
    const notifications = await Notification.listByStudent(req.user.id);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

module.exports = {
  createRequest,
  listMyRequests,
  getRequestDetail,
  downloadCertificate,
  getNotifications,
  VALID_TYPES,
  REQUIRED_DETAIL_FIELDS,
};
