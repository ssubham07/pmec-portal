const path = require('path');
const db = require('../config/db');
const Request = require('../models/Request');
const ApprovalLog = require('../models/ApprovalLog');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const { sendMail } = require('../utils/mailer');
const { generateCertificateNumber } = require('../utils/certNumber');
const { generateCertificatePdf, generateApprovalMemoPdf } = require('../utils/pdfGenerator');

const CERTIFICATE_TYPES = ['bonafide_certificate', 'scholarship_verification'];

const ACTION_TO_STATUS = {
  approve: 'approved',
  reject: 'rejected',
  forward: 'forwarded',
  review: 'under_review',
};

async function listQueue(req, res) {
  const { status, type, department } = req.query;
  const requests = await Request.listForAdmin({ status, type, department });
  res.json(requests);
}

// -------- e-signature management --------
// Admin uploads/draws a signature once (stored as an image file); every
// subsequent approval automatically stamps this signature onto the
// generated PDF, and a snapshot of the path is written to approval_logs
// so history remains accurate even if the signature is later replaced.
async function uploadSignature(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No signature image received.' });
  const relativeUrl = `/uploads/signatures/${req.file.filename}`;
  const admin = await Admin.updateSignature(req.user.id, relativeUrl);
  res.json({ message: 'Signature saved.', admin });
}

// Accepts a base64 PNG data URL from a <canvas> "draw your signature" pad.
async function saveDrawnSignature(req, res) {
  const { dataUrl } = req.body;
  if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
    return res.status(400).json({ error: 'Expected a base64 PNG data URL.' });
  }
  const fs = require('fs');
  const dir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads', 'signatures');
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `admin-${req.user.id}-${Date.now()}.png`;
  const filePath = path.join(dir, fileName);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));

  const relativeUrl = `/uploads/signatures/${fileName}`;
  const admin = await Admin.updateSignature(req.user.id, relativeUrl);
  res.json({ message: 'Signature saved.', admin });
}

// -------- approve / reject / forward --------
async function actOnRequest(req, res) {
  try {
    const { action, comment } = req.body; // action: 'approve' | 'reject' | 'forward' | 'review'
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'A comment is required for every approval action.' });
    }
    if (!ACTION_TO_STATUS[action]) {
      return res.status(400).json({ error: 'Invalid action. Must be approve, reject, forward or review.' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found.' });

    const admin = await Admin.findById(req.user.id);

    // Approvals must be e-signed: block approval if the admin has no signature on file yet.
    if (action === 'approve' && !admin.signature_url) {
      return res.status(400).json({
        error: 'You must set up your e-signature before approving requests. Go to Settings > E-Signature.',
      });
    }

    const newStatus = ACTION_TO_STATUS[action];
    const updated = await Request.updateStatus(request.id, newStatus, comment);

    const signatureAbsPath = admin.signature_url
      ? path.join(__dirname, '..', admin.signature_url.replace(/^\//, ''))
      : null;

    await ApprovalLog.create({
      request_id: request.id,
      admin_id: req.user.id,
      action: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'forward' ? 'forwarded' : 'reviewed',
      comment,
      signature_url: action === 'approve' ? admin.signature_url : null,
    });

    let certificate = null;

    if (action === 'approve') {
      if (CERTIFICATE_TYPES.includes(request.type)) {
        const seq = await db.query("SELECT nextval('certificate_seq') AS n");
        const certificateNo = generateCertificateNumber(request.type, seq.rows[0].n);
        const { relativeUrl } = await generateCertificatePdf({
          certificateNo,
          request,
          admin,
          signatureAbsPath,
        });
        certificate = await Certificate.create({
          request_id: request.id,
          certificate_no: certificateNo,
          pdf_url: relativeUrl,
          signed_by: admin.id,
        });
      } else {
        // Non-certificate types still get a signed approval memo on file.
        const memo = await generateApprovalMemoPdf({ request, admin, comment, signatureAbsPath });
        certificate = await Certificate.create({
          request_id: request.id,
          certificate_no: `PMEC/MEMO/${new Date().getFullYear()}/${request.id}`,
          pdf_url: memo.relativeUrl,
          signed_by: admin.id,
        });
      }
    }

    const message = `Your ${request.type.replace(/_/g, ' ')} request (#${request.id}) has been ${newStatus.replace('_', ' ')}. Remarks: ${comment}`;
    await Notification.create({ student_id: request.student_id, request_id: request.id, message });
    sendMail({ to: request.student_email, subject: `Request ${newStatus.toUpperCase()} - PMEC Service Portal`, text: message });

    res.json({ request: updated, certificate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update request.' });
  }
}

async function getAuditLog(req, res) {
  const timeline = await ApprovalLog.listByRequest(req.params.id);
  res.json(timeline);
}

// -------- Student Verification Queue --------
async function listPendingStudents(req, res) {
  try {
    const students = await Student.listPending();
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list pending students.' });
  }
}

async function verifyStudent(req, res) {
  try {
    const student = await Student.verify(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const message = `Dear ${student.name}, your account on the PMEC Student Service Request Portal has been verified and activated by the Institute. You may now log in with your email.`;
    await Notification.create({ student_id: student.id, request_id: null, message });
    sendMail({
      to: student.email,
      subject: 'Account Verified - PMEC Student Service Request Portal',
      text: message,
    });

    res.json({ message: 'Student successfully verified and activated.', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify student.' });
  }
}

async function rejectStudent(req, res) {
  try {
    const student = await Student.reject(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const message = `Dear ${student.name}, your account registration on the PMEC Student Service Request Portal was reviewed and rejected by the Institute.`;
    await Notification.create({ student_id: student.id, request_id: null, message });
    sendMail({
      to: student.email,
      subject: 'Account Registration Rejected - PMEC Portal',
      text: message,
    });

    res.json({ message: 'Student verification rejected.', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject student.' });
  }
}

module.exports = {
  listQueue,
  actOnRequest,
  getAuditLog,
  uploadSignature,
  saveDrawnSignature,
  listPendingStudents,
  verifyStudent,
  rejectStudent,
  CERTIFICATE_TYPES,
};
