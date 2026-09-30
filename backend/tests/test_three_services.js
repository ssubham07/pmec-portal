const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function main() {
  console.log('--- STARTING 3-SERVICE CERTIFICATE VERIFICATION ---');

  // 1. Get student token
  const capRes = await (await fetch('http://localhost:5000/api/auth/captcha')).json();
  const capSol = Buffer.from(capRes.captchaId, 'base64').toString().split(':')[0];
  const sLogin = await fetch('http://localhost:5000/api/auth/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ravi.sahoo@student.pmec.edu',
      password: 'Password@123',
      captchaId: capRes.captchaId,
      captchaInput: capSol,
    }),
  });
  const studentData = await sLogin.json();
  const sToken = studentData.token;
  console.log('Student logged in:', studentData.user?.name);

  // 2. Get DSW admin token
  const dswAdmin = (await pool.query("SELECT id, email, signature_url FROM admins WHERE role = 'dsw' OR email = 'dsw@pmec.ac.in'")).rows[0];
  const testOtp = '112233';
  const exp = new Date(Date.now() + 300000);
  await pool.query('UPDATE admins SET otp_code_hash = $1, otp_expires_at = $2, otp_attempts = 0 WHERE id = $3', [
    await bcrypt.hash(testOtp, 10),
    exp,
    dswAdmin.id,
  ]);

  // Set e-signature for DSW admin if none
  if (!dswAdmin.signature_url) {
    const sigPath = '/uploads/signatures/dsw-signature.png';
    const absSigDir = path.join(__dirname, '..', 'uploads', 'signatures');
    fs.mkdirSync(absSigDir, { recursive: true });
    fs.writeFileSync(
      path.join(absSigDir, 'dsw-signature.png'),
      Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    );
    await pool.query('UPDATE admins SET signature_url = $1 WHERE id = $2', [sigPath, dswAdmin.id]);
  }

  const dswVerify = await fetch('http://localhost:5000/api/auth/admin/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: dswAdmin.id, otp: testOtp }),
  });
  const dswToken = (await dswVerify.json()).token;
  console.log('DSW Admin logged in with e-signature active.');

  // Test 1: Semester Registration with Fee details & Fee receipt document
  const fdSem = new FormData();
  fdSem.append('type', 'semester_registration');
  fdSem.append(
    'details',
    JSON.stringify({
      semester_to_register: 5,
      fee_receipt_no: 'SBIN987654321',
      fee_amount: 17500,
      payment_date: '2026-09-20',
    })
  );
  fdSem.append('documents', new Blob(['%PDF-1.4 Mock Fee Receipt PMEC'], { type: 'application/pdf' }), 'fee_receipt.pdf');
  const semReq = await (
    await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + sToken },
      body: fdSem,
    })
  ).json();
  const semReqId = semReq.request?.id || semReq.id;
  console.log('1. Semester Registration submitted (ID: ' + semReqId + ')');

  // DSW/Office approves semester registration
  const semApprove = await (
    await fetch('http://localhost:5000/api/admin/requests/' + semReqId + '/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + dswToken },
      body: JSON.stringify({
        action: 'approve',
        comment: 'Fee payment verified and reconciled with SB Collect accounts. Registration confirmed.',
      }),
    })
  ).json();
  console.log('   -> Approved! Certificate No:', semApprove.certificate?.certificate_no, 'PDF:', semApprove.certificate?.pdf_url);

  // Test 2: Bonafide Certificate with bonafide ref no & upload
  const fdBnf = new FormData();
  fdBnf.append('type', 'bonafide_certificate');
  fdBnf.append(
    'details',
    JSON.stringify({
      purpose: 'SBI Education Loan Application',
      bonafide_ref_no: 'PMEC-BNF-APP-2026-44',
    })
  );
  fdBnf.append('documents', new Blob(['%PDF-1.4 Mock Bonafide Supporting Doc'], { type: 'application/pdf' }), 'bonafide_app.pdf');
  const bnfReq = await (
    await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + sToken },
      body: fdBnf,
    })
  ).json();
  const bnfReqId = bnfReq.request?.id || bnfReq.id;
  console.log('2. Bonafide Certificate submitted (ID: ' + bnfReqId + ')');

  const bnfApprove = await (
    await fetch('http://localhost:5000/api/admin/requests/' + bnfReqId + '/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + dswToken },
      body: JSON.stringify({ action: 'approve', comment: 'Bonafide credentials and enrollment confirmed by DSW Office.' }),
    })
  ).json();
  console.log('   -> Approved! Certificate No:', bnfApprove.certificate?.certificate_no, 'PDF:', bnfApprove.certificate?.pdf_url);

  // Test 3: Scholarship Verification with application ID & document
  const fdSch = new FormData();
  fdSch.append('type', 'scholarship_verification');
  fdSch.append(
    'details',
    JSON.stringify({
      scheme_name: 'Post-Matric State Scholarship Odisha',
      application_id: 'OD-SCH-2026-8891',
      academic_year: '2025-2026',
    })
  );
  fdSch.append(
    'documents',
    new Blob(['%PDF-1.4 Mock Scholarship Form & Income Cert'], { type: 'application/pdf' }),
    'scholarship_docs.pdf'
  );
  const schReq = await (
    await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + sToken },
      body: fdSch,
    })
  ).json();
  const schReqId = schReq.request?.id || schReq.id;
  console.log('3. Scholarship Verification submitted (ID: ' + schReqId + ')');

  const schApprove = await (
    await fetch('http://localhost:5000/api/admin/requests/' + schReqId + '/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + dswToken },
      body: JSON.stringify({
        action: 'approve',
        comment: 'Scholarship income criteria and academic eligibility verified by DSW.',
      }),
    })
  ).json();
  console.log('   -> Approved! Certificate No:', schApprove.certificate?.certificate_no, 'PDF:', schApprove.certificate?.pdf_url);

  // Verify Student can download all 3 certificates
  for (const [name, id] of [
    ['Semester Registration', semReqId],
    ['Bonafide Certificate', bnfReqId],
    ['Scholarship Verification', schReqId],
  ]) {
    const dlRes = await fetch('http://localhost:5000/api/requests/' + id + '/certificate', {
      headers: { Authorization: 'Bearer ' + sToken },
    });
    const bytes = (await dlRes.arrayBuffer()).byteLength;
    if (dlRes.status !== 200 || bytes < 1000) {
      throw new Error(`Failed to download certificate for ${name} (status ${dlRes.status}, bytes: ${bytes})`);
    }
    console.log(`✔ ${name} E-Certificate Downloadable by Student: HTTP ${dlRes.status} (${bytes} bytes)`);
  }

  console.log('\n🎉 ALL 3 CERTIFICATE FLOWS FULLY VERIFIED & WORKING PERFECTLY!');
  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
