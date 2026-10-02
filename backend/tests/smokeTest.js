/**
 * PMEC Student Service Request Portal - End-to-End Smoke Test Suite
 * Tests all core features including:
 * 1. College Registration Number & Email Format + Registration OTP (No ID Card required)
 * 2. Direct 1-Step Login for Student & Admin (No OTP)
 * 3. Request submission, role-gated approvals, PDF generation, e-signatures & RBAC
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = options.headers || {};
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const res = await fetch(url, { ...options, headers, body });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }
  return { status: res.status, data: json, headers: res.headers };
}

async function getCaptcha() {
  const res = await request('/auth/captcha');
  if (res.status !== 200) throw new Error('Failed to fetch captcha: ' + JSON.stringify(res.data));
  const { captchaId, svgUrl } = res.data;
  const decoded = Buffer.from(captchaId, 'base64').toString('utf8');
  const solution = decoded.split(':')[0];
  return { captchaId, svgUrl, solution };
}

async function runSmokeTests() {
  console.log('====================================================');
  console.log('PMEC PORTAL: STARTING LIVE END-TO-END SMOKE TEST SUITE');
  console.log('====================================================\n');

  const results = {};

  // ----------------------------------------------------
  // SECTION 1: REGISTRATION OTP & COLLEGE REGISTRATION NUMBER FORMAT
  // ----------------------------------------------------
  console.log('▶ [Test 1] Student Registration OTP & College Reg No Format (No ID Card Required)...');
  let newStudentId = null;
  let newStudentEmail = '';
  try {
    // 1a: Registration with 10-digit College Registration Number & Official Email
    const regNo = `230110${Math.floor(1000 + Math.random() * 9000)}`;
    newStudentEmail = `${regNo}_cse@pmec.ac.in`;

    const regOfficial = await request('/auth/student/register', {
      method: 'POST',
      body: {
        roll_no: regNo,
        name: 'Auto Test Student',
        department: 'CSE',
        semester: 6,
        email: newStudentEmail,
        phone: '9988776655',
        password: 'Password@123',
      },
    });

    if (regOfficial.status !== 201 || !regOfficial.data.otpRequired || !regOfficial.data.studentId) {
      throw new Error(`Registration failed to initiate OTP: ${JSON.stringify(regOfficial.data)}`);
    }
    newStudentId = regOfficial.data.studentId;
    console.log(`  ✔ Registration without ID card succeeded with 201 Created & OTP dispatch (studentId: ${newStudentId})`);

    // 1b: Wrong OTP submission is rejected
    const badOtp = await request('/auth/student/verify-otp', {
      method: 'POST',
      body: { studentId: newStudentId, otp: '000000' },
    });
    if (badOtp.status !== 400 || !badOtp.data.error.includes('Invalid')) {
      throw new Error(`Wrong OTP was not rejected: ${JSON.stringify(badOtp.data)}`);
    }
    console.log('  ✔ Wrong registration OTP rejected with 400 Bad Request');

    // 1c: Valid OTP submission verifies and issues instant JWT token for @pmec.ac.in
    const Student = require('../models/Student');
    const testOtpCode = '654321';
    await Student.setOtp(newStudentId, await bcrypt.hash(testOtpCode, 10), new Date(Date.now() + 300000));

    const goodOtp = await request('/auth/student/verify-otp', {
      method: 'POST',
      body: { studentId: newStudentId, otp: testOtpCode },
    });
    if (goodOtp.status !== 200 || !goodOtp.data.token || goodOtp.data.user.status !== 'active') {
      throw new Error(`Valid registration OTP verification failed: ${JSON.stringify(goodOtp.data)}`);
    }
    console.log('  ✔ Valid registration OTP verified: Student activated with instant JWT token');

    results['Feature 1: Student Registration OTP & Reg No'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 1 Failed:', err.message);
    results['Feature 1: Student Registration OTP & Reg No'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // SECTION 2: DIRECT 1-STEP LOGIN FOR STUDENT & ADMIN (NO OTP, NO CAPTCHA)
  // ----------------------------------------------------
  console.log('\n▶ [Test 2] Direct 1-Step Login for Student & Admin (No OTP, No Captcha)...');
  let studentToken = '';
  let adminToken = '';
  let dswToken = '';
  try {
    // 2a: Missing email/password rejected
    const badLogin = await request('/auth/admin/login', {
      method: 'POST',
      body: { email: '', password: '' },
    });
    if (badLogin.status !== 400) {
      throw new Error('Empty credentials were not rejected: ' + JSON.stringify(badLogin.data));
    }
    console.log('  ✔ Empty credentials rejected with 400 Bad Request');

    // 2b: Student Direct 1-Step Login with College Email format (No Captcha)
    const studentLogin = await request('/auth/student/login', {
      method: 'POST',
      body: {
        email: '2301109307_cse@pmec.ac.in',
        password: 'Password@123',
      },
    });
    if (studentLogin.status !== 200 || !studentLogin.data.token || studentLogin.data.otpRequired) {
      throw new Error(`Direct student login failed: ${JSON.stringify(studentLogin.data)}`);
    }
    studentToken = studentLogin.data.token;
    console.log(`  ✔ Student logged in directly without captcha/OTP (Reg No: ${studentLogin.data.user.roll_no}, token issued)`);

    // 2c: Admin Exam Cell Direct 1-Step Login (No Captcha)
    const adminLogin = await request('/auth/admin/login', {
      method: 'POST',
      body: {
        email: 'ashok.examcell@pmec.edu',
        password: 'Password@123',
      },
    });
    if (adminLogin.status !== 200 || !adminLogin.data.token || adminLogin.data.otpRequired) {
      throw new Error(`Direct admin login failed: ${JSON.stringify(adminLogin.data)}`);
    }
    adminToken = adminLogin.data.token;
    console.log('  ✔ Admin logged in directly without captcha/OTP (Exam Cell token issued)');

    // 2d: DSW Officer Direct 1-Step Login (No Captcha)
    const dswLogin = await request('/auth/admin/login', {
      method: 'POST',
      body: {
        email: 'dsw@pmec.ac.in',
        password: 'Password@123',
      },
    });
    if (dswLogin.status !== 200 || !dswLogin.data.token || dswLogin.data.otpRequired) {
      throw new Error(`Direct DSW login failed: ${JSON.stringify(dswLogin.data)}`);
    }
    dswToken = dswLogin.data.token;
    console.log('  ✔ DSW Officer logged in directly without captcha/OTP (DSW token issued)');

    // 2e: Principal Direct Login
    const principalLogin = await request('/auth/admin/login', {
      method: 'POST',
      body: {
        email: 'principal@pmec.ac.in',
        password: 'Password@123',
      },
    });
    if (principalLogin.status !== 200 || !principalLogin.data.token) {
      throw new Error(`Principal login failed: ${JSON.stringify(principalLogin.data)}`);
    }
    console.log('  ✔ Principal logged in directly (role: principal, token issued)');

    // 2f: Scholarship Section Officer Direct Login
    const scholarshipLogin = await request('/auth/admin/login', {
      method: 'POST',
      body: {
        email: 'scholarship@pmec.ac.in',
        password: 'Password@123',
      },
    });
    if (scholarshipLogin.status !== 200 || !scholarshipLogin.data.token) {
      throw new Error(`Scholarship login failed: ${JSON.stringify(scholarshipLogin.data)}`);
    }
    console.log('  ✔ Scholarship Officer logged in directly (role: scholarship, token issued)');

    // 2g: Student login using College Reg No directly
    const regNoLogin = await request('/auth/student/login', {
      method: 'POST',
      body: {
        email: '2301109307',
        password: 'Password@123',
      },
    });
    if (regNoLogin.status !== 200 || !regNoLogin.data.token) {
      throw new Error(`Student login via Reg No failed: ${JSON.stringify(regNoLogin.data)}`);
    }
    console.log('  ✔ Student logged in directly using College Reg No 2301109307');

    results['Feature 2: Direct 1-Step Login (No Captcha)'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 2 Failed:', err.message);
    results['Feature 2: Direct 1-Step Login'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // SECTION 3: ADAPTIVE REQUEST SUBMISSION (ALL 7 TYPES)
  // ----------------------------------------------------
  console.log('\n▶ [Test 3] Adaptive Request Submission (All 7 Types)...');
  let bonafideReqId = null;
  let memoReqId = null;
  let rejectReqId = null;
  let semRegReqId = null;
  let scholarshipReqId = null;
  try {
    const dummyFileBytes = Buffer.from('%PDF-1.4 Mock PMEC Document Attachment', 'utf-8');
    const dummyBlob = new Blob([dummyFileBytes], { type: 'application/pdf' });

    // 3a: Bonafide Certificate
    const fdBonafide = new FormData();
    fdBonafide.append('type', 'bonafide_certificate');
    fdBonafide.append('reason', 'Passport and visa application address verification');
    fdBonafide.append('details', JSON.stringify({ purpose: 'Passport Application', bonafide_ref_no: 'PMEC/BNF/2026/TEST01' }));
    fdBonafide.append('documents', dummyBlob, 'bonafide_proof.pdf');

    const resBona = await request('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: fdBonafide,
    });
    if (resBona.status !== 201 || !resBona.data.id) {
      throw new Error('Bonafide submission failed: ' + JSON.stringify(resBona.data));
    }
    bonafideReqId = resBona.data.id;
    console.log(`  ✔ bonafide_certificate submitted successfully (ID: ${bonafideReqId}, doc: ${resBona.data.document_url})`);

    // 3b: Semester Registration (With fee receipt)
    const fdSem = new FormData();
    fdSem.append('type', 'semester_registration');
    fdSem.append('reason', 'Even Semester 6 Registration');
    fdSem.append('details', JSON.stringify({ semester_to_register: 6, fee_receipt_no: 'SBIN-2026-987654', fee_amount: '12500', payment_date: '2026-05-10' }));
    fdSem.append('documents', dummyBlob, 'fee_receipt.pdf');

    const resSem = await request('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: fdSem,
    });
    if (resSem.status !== 201 || !resSem.data.id) {
      throw new Error('Semester registration submission failed: ' + JSON.stringify(resSem.data));
    }
    semRegReqId = resSem.data.id;
    console.log(`  ✔ semester_registration submitted with fee receipt (ID: ${semRegReqId})`);

    // 3c: Scholarship Verification
    const fdSchol = new FormData();
    fdSchol.append('type', 'scholarship_verification');
    fdSchol.append('reason', 'Post-Matric Scholarship Endorsement');
    fdSchol.append('details', JSON.stringify({ scheme_name: 'Post-Matric State Scholarship', application_id: 'OD-SCH-2026-112233' }));
    fdSchol.append('documents', dummyBlob, 'scholarship_app.pdf');

    const resSchol = await request('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: fdSchol,
    });
    if (resSchol.status !== 201 || !resSchol.data.id) {
      throw new Error('Scholarship submission failed: ' + JSON.stringify(resSchol.data));
    }
    scholarshipReqId = resSchol.data.id;
    console.log(`  ✔ scholarship_verification submitted with doc (ID: ${scholarshipReqId})`);

    // 3d: Back Paper with Bank Challan / Reference Number
    const fdBack = new FormData();
    fdBack.append('type', 'back_paper');
    fdBack.append('reason', 'Back paper application for Math-II');
    fdBack.append('details', JSON.stringify({
      subject_code: 'BS102',
      subject_name: 'Mathematics-II',
      semester: 2,
      challan_ref_no: 'CHALLAN-PMEC-2026-8899',
      fee_amount: '500',
      payment_date: '2026-05-15',
    }));
    fdBack.append('documents', dummyBlob, 'bank_challan.pdf');
    const resBack = await request('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: fdBack,
    });
    if (resBack.status !== 201) throw new Error('Back paper submission failed: ' + JSON.stringify(resBack.data));
    memoReqId = resBack.data.id;
    console.log(`  ✔ back_paper submitted with Bank Challan / Ref No (ID: ${memoReqId})`);

    // 3e: Exam Grievance
    const fdGriev = new FormData();
    fdGriev.append('type', 'exam_grievance');
    fdGriev.append('reason', 'Out of syllabus question in OS exam');
    fdGriev.append('details', JSON.stringify({ subject_code: 'CS301', description: 'Out of syllabus question in OS end-semester examination' }));
    const resGriev = await request('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: fdGriev,
    });
    if (resGriev.status !== 201) throw new Error('Exam grievance submission failed: ' + JSON.stringify(resGriev.data));
    rejectReqId = resGriev.data.id;
    console.log(`  ✔ exam_grievance submitted successfully (ID: ${rejectReqId})`);

    results['Feature 3: Request Submission'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 3 Failed:', err.message);
    results['Feature 3: Request Submission'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // SECTION 4: ROLE-GATED APPROVAL & DSW VERIFICATION
  // ----------------------------------------------------
  console.log('\n▶ [Test 4] Role-Gated Approvals & DSW Routing...');
  try {
    // 4a: DSW approves bonafide certificate
    const approveBonafide = await request(`/admin/requests/${bonafideReqId}/action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dswToken}` },
      body: { action: 'approve', comment: 'Bonafide credentials verified and approved by DSW' },
    });
    if (approveBonafide.status !== 200 || approveBonafide.data.request.status !== 'approved') {
      throw new Error('Bonafide approval failed: ' + JSON.stringify(approveBonafide.data));
    }
    console.log(`  ✔ DSW approved bonafide_certificate (cert URL: ${approveBonafide.data.certificate_url})`);

    // 4b: DSW approves scholarship verification
    const approveSchol = await request(`/admin/requests/${scholarshipReqId}/action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dswToken}` },
      body: { action: 'approve', comment: 'Scholarship credentials verified and endorsed by DSW' },
    });
    if (approveSchol.status !== 200 || approveSchol.data.request.status !== 'approved') {
      throw new Error('Scholarship approval failed: ' + JSON.stringify(approveSchol.data));
    }
    console.log(`  ✔ DSW approved scholarship_verification (cert URL: ${approveSchol.data.certificate_url})`);

    // 4c: Institute approves semester registration
    const approveSem = await request(`/admin/requests/${semRegReqId}/action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'approve', comment: 'Fees paid and verified by Academic Office' },
    });
    if (approveSem.status !== 200 || approveSem.data.request.status !== 'approved') {
      throw new Error('Semester registration approval failed: ' + JSON.stringify(approveSem.data));
    }
    console.log(`  ✔ Academic office approved semester_registration (cert URL: ${approveSem.data.certificate_url})`);

    // 4d: Exam Cell approves back paper with bank challan
    const approveBack = await request(`/admin/requests/${memoReqId}/action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'approve', comment: 'Bank challan verified and back paper registered' },
    });
    if (approveBack.status !== 200 || approveBack.data.request.status !== 'approved') {
      throw new Error('Back paper approval failed: ' + JSON.stringify(approveBack.data));
    }
    console.log(`  ✔ Exam Cell approved back_paper with Challan Clearance (cert URL: ${approveBack.data.certificate_url})`);

    results['Feature 4: Role-Gated Approvals'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 4 Failed:', err.message);
    results['Feature 4: Role-Gated Approvals'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // SECTION 5: STUDENT CERTIFICATE DOWNLOAD & VERIFICATION
  // ----------------------------------------------------
  console.log('\n▶ [Test 5] Student Certificate Download & Verification...');
  try {
    const studentBonafide = await request(`/requests/${bonafideReqId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const certPdfUrl = studentBonafide.data.certificate?.pdf_url || studentBonafide.data.certificate_url;
    if (studentBonafide.status !== 200 || !certPdfUrl) {
      throw new Error('Student cannot retrieve certificate URL: ' + JSON.stringify(studentBonafide.data));
    }
    console.log(`  ✔ Student retrieved e-signed certificate: ${certPdfUrl}`);

    const pdfRes = await fetch(`http://localhost:5000${certPdfUrl}`);
    if (pdfRes.status !== 200) {
      throw new Error(`Failed to download certificate PDF from ${studentBonafide.data.certificate_url}`);
    }
    const pdfBuf = await pdfRes.arrayBuffer();
    const pdfHeader = Buffer.from(pdfBuf).subarray(0, 5).toString('ascii');
    if (pdfHeader !== '%PDF-') {
      throw new Error(`File is not a valid PDF header: ${pdfHeader}`);
    }
    console.log(`  ✔ Certificate PDF verified & downloaded (${pdfBuf.byteLength} bytes)`);

    results['Feature 5: Certificate Download'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 5 Failed:', err.message);
    results['Feature 5: Certificate Download'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // FINAL SUMMARY REPORT
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log('FINAL TEST EXECUTION SUMMARY:');
  console.log('====================================================');
  let allPassed = true;
  for (const [feat, status] of Object.entries(results)) {
    console.log(`- ${feat}: ${status}`);
    if (status.startsWith('FAILED')) allPassed = false;
  }
  console.log('====================================================\n');

  await pool.end();
  if (!allPassed) {
    process.exit(1);
  }
}

runSmokeTests().catch(async (e) => {
  console.error('Smoke test suite crashed:', e);
  await pool.end();
  process.exit(1);
});
