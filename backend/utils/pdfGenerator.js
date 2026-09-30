const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const CERT_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads', 'certificates');
fs.mkdirSync(CERT_DIR, { recursive: true });

const TYPE_LABELS = {
  semester_registration: 'Semester Registration',
  internal_mark_correction: 'Internal Mark Correction',
  back_paper: 'Back Paper Examination',
  revaluation: 'Revaluation',
  exam_grievance: 'Examination Grievance',
  bonafide_certificate: 'Bonafide Certificate',
  scholarship_verification: 'Scholarship Verification',
};

/**
 * Draws the admin's e-signature image (if present) plus a standard
 * "digitally approved" block at the current cursor position on the page.
 * This is the shared piece that gives every approved document its
 * e-signature, whether it's a formal certificate or a simple approval memo.
 */
function stampSignature(doc, { adminName, adminRole, signatureAbsPath, actionDate }) {
  const startY = doc.y + 20;
  const sigBoxX = doc.page.width - doc.page.margins.right - 220;

  doc.moveTo(sigBoxX, startY).lineTo(sigBoxX + 220, startY).strokeColor('#94a3b8').stroke();

  if (signatureAbsPath && fs.existsSync(signatureAbsPath)) {
    try {
      doc.image(signatureAbsPath, sigBoxX, startY - 55, { width: 160, height: 50, fit: [160, 50] });
    } catch (e) {
      // fall through - if the image can't be read, we still print the text block below
    }
  }

  doc
    .fontSize(10)
    .fillColor('#111827')
    .text(adminName, sigBoxX, startY + 6, { width: 220 })
    .fontSize(9)
    .fillColor('#4b5563')
    .text(adminRole || 'Authorized Signatory', sigBoxX, doc.y, { width: 220 })
    .text(`Digitally signed on ${actionDate.toLocaleString('en-IN')}`, sigBoxX, doc.y, { width: 220 });
}

function drawLetterhead(doc, subtitle) {
  doc
    .fontSize(18)
    .fillColor('#1e3a8a')
    .text('PARALA MAHARAJA ENGINEERING COLLEGE', { align: 'center' })
    .fontSize(10)
    .fillColor('#374151')
    .text('Berhampur, Odisha | Student Service Request Portal', { align: 'center' })
    .moveDown(0.3)
    .fontSize(13)
    .fillColor('#111827')
    .text(subtitle, { align: 'center', underline: true })
    .moveDown(1);
}

/**
 * Generates the formal certificate PDF for bonafide_certificate /
 * scholarship_verification requests, stamped with the approving admin's
 * e-signature.
 */
async function generateCertificatePdf({
  certificateNo,
  request,
  admin,
  signatureAbsPath,
}) {
  const fileName = `certificate-${certificateNo.replace(/\//g, '-')}.pdf`;
  const filePath = path.join(CERT_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  let title = 'VERIFICATION CERTIFICATE';
  if (request.type === 'semester_registration') {
    title = 'SEMESTER REGISTRATION VERIFICATION CERTIFICATE';
  } else if (request.type === 'bonafide_certificate') {
    title = 'BONAFIDE CERTIFICATE';
  } else if (request.type === 'scholarship_verification') {
    title = 'SCHOLARSHIP VERIFICATION CERTIFICATE';
  } else if (request.type === 'back_paper') {
    title = 'BACK PAPER REGISTRATION & CHALLAN CLEARANCE';
  }
  drawLetterhead(doc, title);

  doc.fontSize(10).fillColor('#6b7280').text(`Certificate No: ${certificateNo}`, { align: 'right' });
  doc.text(`Date of Issue: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor('#111827');

  if (request.type === 'semester_registration') {
    const sem = request.details?.semester_to_register || request.student_semester;
    const feeReceipt = request.details?.fee_receipt_no || 'N/A';
    const feeAmount = request.details?.fee_amount ? `INR ${request.details.fee_amount}` : 'Verified';
    const payDate = request.details?.payment_date || new Date().toLocaleDateString('en-IN');

    doc.text(
      `This is to certify that ${request.student_name} (College Reg No: ${request.roll_no}), ` +
        `a regular student of the ${request.student_department} department, has successfully completed ` +
        `the institutional semester registration process for Semester ${sem} at Parala Maharaja Engineering College.`,
      { align: 'justify', lineGap: 4 }
    );
    doc.moveDown(0.8);
    doc.fontSize(10).fillColor('#1e293b').text(
      `Fees Payment Verification & Office Audit:\n` +
        `• Fee Receipt / Transaction No: ${feeReceipt}\n` +
        `• Amount Paid: ${feeAmount}\n` +
        `• Payment / Verification Date: ${payDate}\n` +
        `• Institutional Verification: COMPLETED & APPROVED`,
      { align: 'justify', lineGap: 3 }
    );
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor('#111827').text(
      `This electronic certificate serves as official verification of semester registration and fee clearance for all academic and administrative purposes.`,
      { align: 'justify', lineGap: 4 }
    );
  } else if (request.type === 'back_paper') {
    const subjCode = request.details?.subject_code || 'N/A';
    const subjName = request.details?.subject_name ? ` (${request.details.subject_name})` : '';
    const sem = request.details?.semester || request.student_semester;
    const challanNo = request.details?.challan_ref_no || request.details?.bank_challan_no || 'Verified';
    const feeAmount = request.details?.fee_amount ? `INR ${request.details.fee_amount}` : 'Verified';
    const payDate = request.details?.payment_date || new Date().toLocaleDateString('en-IN');

    doc.text(
      `This is to certify that ${request.student_name} (College Reg No: ${request.roll_no}), ` +
        `a regular student of the ${request.student_department} department, has completed back paper ` +
        `registration for Semester ${sem} examination in Subject ${subjCode}${subjName} at Parala Maharaja Engineering College.`,
      { align: 'justify', lineGap: 4 }
    );
    doc.moveDown(0.8);
    doc.fontSize(10).fillColor('#1e293b').text(
      `Bank Challan & Fee Clearance Audit:\n` +
        `• Bank Challan / Reference No: ${challanNo}\n` +
        `• Subject Code & Name: ${subjCode}${subjName}\n` +
        `• Semester: ${sem}\n` +
        `• Challan Amount Paid: ${feeAmount}\n` +
        `• Payment / Challan Date: ${payDate}\n` +
        `• Examination Office Audit: COMPLETED & VERIFIED`,
      { align: 'justify', lineGap: 3 }
    );
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor('#111827').text(
      `This certificate confirms fee receipt clearance and admission endorsement for the back paper examination.`,
      { align: 'justify', lineGap: 4 }
    );
  } else if (request.type === 'bonafide_certificate') {
    const bonafideRef = request.details?.bonafide_ref_no || certificateNo;
    doc.text(
      `This is to certify that ${request.student_name} (College Reg No: ${request.roll_no}), ` +
        `a bonafide student of the ${request.student_department} department, currently studying in ` +
        `Semester ${request.student_semester} of Parala Maharaja Engineering College, is a regular ` +
        `student of this institution during the academic session ${new Date().getFullYear()}.`,
      { align: 'justify', lineGap: 4 }
    );
    doc.moveDown(0.8);
    doc.fontSize(10).fillColor('#1e293b').text(
      `Bonafide Verification Details:\n` +
        `• Bonafide / Reference No: ${bonafideRef}\n` +
        `• Purpose of Issue: ${request.details?.purpose || 'General Academic Verification'}\n` +
        `• Endorsed By: Office of Dean Student Welfare (DSW)`,
      { align: 'justify', lineGap: 3 }
    );
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor('#111827').text(
      `The institution confirms that student records and bonafide credentials have been verified by the Dean Student Welfare (DSW) section.`,
      { align: 'justify', lineGap: 4 }
    );
  } else {
    const scheme = (request.details && request.details.scheme_name) || 'N/A';
    const appId = request.details?.application_id || 'N/A';
    const acadYear = request.details?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    doc.text(
      `This is to certify that ${request.student_name} (College Reg No: ${request.roll_no}), a bonafide student ` +
        `of the ${request.student_department} department, Semester ${request.student_semester}, has been ` +
        `verified as eligible for the scholarship scheme "${scheme}" as per institutional records.`,
      { align: 'justify', lineGap: 4 }
    );
    doc.moveDown(0.8);
    doc.fontSize(10).fillColor('#1e293b').text(
      `Scholarship Endorsement Details:\n` +
        `• Scholarship Application / Reg. ID: ${appId}\n` +
        `• Academic Year: ${acadYear}\n` +
        `• Endorsed By: Office of Dean Student Welfare (DSW) / Scholarship Section`,
      { align: 'justify', lineGap: 3 }
    );
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor('#111827').text(
      `This e-certificate is issued upon document verification and approval by the designated institutional authority.`,
      { align: 'justify', lineGap: 4 }
    );
  }

  doc.moveDown(3);
  stampSignature(doc, {
    adminName: admin.name,
    adminRole: `${admin.role} - ${admin.department || 'PMEC'}`,
    signatureAbsPath,
    actionDate: new Date(),
  });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { filePath, fileName, relativeUrl: `/uploads/certificates/${fileName}` };
}

/**
 * Generates a simple e-signed "Approval Memo" PDF for request types that
 * don't produce a formal certificate (semester registration, back paper,
 * revaluation, etc.), so every approval still has a signed, downloadable
 * record with the admin's e-signature on it.
 */
async function generateApprovalMemoPdf({ request, admin, comment, signatureAbsPath }) {
  const fileName = `memo-request-${request.id}-${Date.now()}.pdf`;
  const filePath = path.join(CERT_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  drawLetterhead(doc, 'APPROVAL MEMO');

  doc.fontSize(11).fillColor('#111827');
  doc.text(`Request Type: ${TYPE_LABELS[request.type] || request.type}`);
  doc.text(`Request ID: #${request.id}`);
  doc.text(`Student: ${request.student_name} (Reg No: ${request.roll_no})`);
  doc.text(`Department / Semester: ${request.student_department} / Sem ${request.student_semester}`);
  doc.moveDown(0.5);
  doc.text('Status: APPROVED', { continued: false });
  if (comment) {
    doc.moveDown(0.5).text(`Remarks: ${comment}`, { align: 'justify' });
  }

  doc.moveDown(3);
  stampSignature(doc, {
    adminName: admin.name,
    adminRole: `${admin.role} - ${admin.department || 'PMEC'}`,
    signatureAbsPath,
    actionDate: new Date(),
  });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { filePath, fileName, relativeUrl: `/uploads/certificates/${fileName}` };
}

module.exports = { generateCertificatePdf, generateApprovalMemoPdf };
