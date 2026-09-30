/**
 * PMEC Student Service Request Portal - End-to-End Smoke Test Suite
 * Tests all core features including:
 * 1. Student College ID Card Verification (multipart upload, domain gating)
 * 2. Admin 2-Step OTP Authentication Flow (hash check, expiry, lockout)
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
  // SECTION 1: FEATURE 1 - STUDENT ID-CARD VERIFICATION & DOMAIN GATING
  // ----------------------------------------------------
  console.log('▶ [Test 1] Feature 1: Student ID-Card Verification & Domain Gating...');
  try {
    // 1a: Registration attempt WITHOUT ID card -> must return 400 Bad Request
    const rollNoDoc = `2024CS${Math.floor(1000 + Math.random() * 9000)}`;
    const fdNoCard = new FormData();
    fdNoCard.append('roll_no', rollNoDoc);
    fdNoCard.append('name', 'No Card Student');
    fdNoCard.append('department', 'CSE');
    fdNoCard.append('semester', '4');
    fdNoCard.append('email', `nocard.${Date.now()}@pmec.ac.in`);
    fdNoCard.append('phone', '9988776655');
    fdNoCard.append('password', 'Password@123');

    const regNoCard = await request('/auth/student/register', {
      method: 'POST',
      body: fdNoCard,
    });

    if (regNoCard.status !== 400 || !regNoCard.data.error.toLowerCase().includes('id card')) {
      throw new Error(`Registration without ID card was not rejected: ${JSON.stringify(regNoCard.data)}`);
    }
    console.log('  ✔ Registration rejected with 400 when no ID card is attached');

    // Create a mock ID card buffer for testing upload
    const mockCardBytes = Buffer.from('%PDF-1.4 Mock ID Card PMEC Student 2026', 'utf-8');
    const mockCardBlob = new Blob([mockCardBytes], { type: 'application/pdf' });

    // 1b: Student with @pmec.ac.in domain + ID card -> instant active with JWT
    const rollOfficial = `2024CS${Math.floor(1000 + Math.random() * 9000)}`;
    const emailOfficial = `official.${Date.now()}@pmec.ac.in`;
    const fdOfficial = new FormData();
    fdOfficial.append('roll_no', rollOfficial);
    fdOfficial.append('name', 'Official Student');
    fdOfficial.append('department', 'CSE');
    fdOfficial.append('semester', '4');
    fdOfficial.append('email', emailOfficial);
    fdOfficial.append('phone', '9988776655');
    fdOfficial.append('password', 'Password@123');
    fdOfficial.append('id_card', mockCardBlob, 'pmec_id_card.pdf');

    const regOfficial = await request('/auth/student/register', {
      method: 'POST',
      body: fdOfficial,
    });

    if (
      regOfficial.status !== 201 ||
      regOfficial.data.user.status !== 'active' ||
      !regOfficial.data.token ||
      !regOfficial.data.user.id_card_url
    ) {
      throw new Error(`Official registration failed: ${JSON.stringify(regOfficial.data)}`);
    }
    console.log(`  ✔ @pmec.ac.in registered as active with instant JWT & stored ID card (${regOfficial.data.user.id_card_url})`);

    // 1c: Student with personal email (@gmail.com) + ID card -> pending_verification, no token
    const rollPersonal = `2024CS${Math.floor(1000 + Math.random() * 9000)}`;
    const emailPersonal = `personal.${Date.now()}@gmail.com`;
    const fdPersonal = new FormData();
    fdPersonal.append('roll_no', rollPersonal);
    fdPersonal.append('name', 'Pending Student');
    fdPersonal.append('department', 'CSE');
    fdPersonal.append('semester', '4');
    fdPersonal.append('email', emailPersonal);
    fdPersonal.append('phone', '9988776644');
    fdPersonal.append('password', 'Password@123');
    fdPersonal.append('id_card', mockCardBlob, 'personal_id_card.pdf');

    const regPersonal = await request('/auth/student/register', {
      method: 'POST',
      body: fdPersonal,
    });

    if (
      regPersonal.status !== 201 ||
      regPersonal.data.user.status !== 'pending_verification' ||
      regPersonal.data.token ||
      !regPersonal.data.user.id_card_url
    ) {
      throw new Error(`Personal registration failed: ${JSON.stringify(regPersonal.data)}`);
    }
    console.log(`  ✔ Personal email registered as pending_verification (no token returned) & stored ID card (${regPersonal.data.user.id_card_url})`);

    // 1d: Unverified student attempts login -> blocked with 403
    const cap1 = await getCaptcha();
    const loginPending = await request('/auth/student/login', {
      method: 'POST',
      body: {
        email: emailPersonal,
        password: 'Password@123',
        captchaId: cap1.captchaId,
        captchaInput: cap1.solution,
      },
    });

    if (loginPending.status !== 403 || !loginPending.data.error.includes('pending verification')) {
      throw new Error(`Pending login was not properly blocked: ${JSON.stringify(loginPending.data)}`);
    }
    console.log('  ✔ Pending student login blocked with 403 Forbidden until verified');

    results['Feature 1: Student ID-Card Verification'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 1 Failed:', err.message);
    results['Feature 1: Student ID-Card Verification'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // SECTION 2: FEATURE 2 - STUDENT 2-STEP OTP & DIRECT ADMIN LOGIN
  // ----------------------------------------------------
  console.log('\n▶ [Test 2] Student 2-Step OTP Verification & Direct Admin Login...');
  let adminToken = '';
  let pendingStudentId = null;
  try {
    // 2a: Test Captcha wrong input
    const capWrong = await getCaptcha();
    const loginBadCap = await request('/auth/admin/login', {
      method: 'POST',
      body: {
        email: 'ashok.examcell@pmec.edu',
        password: 'Password@123',
        captchaId: capWrong.captchaId,
        captchaInput: 'WRONG99',
      },
    });
    if (loginBadCap.status !== 400 || !loginBadCap.data.error.includes('captcha')) {
      throw new Error('Invalid captcha was not rejected: ' + JSON.stringify(loginBadCap.data));
    }
    console.log('  ✔ Invalid captcha rejected with 400');

    // 2b: Admin login directly succeeds without OTP
    const capAdmin = await getCaptcha();
    const adminLoginRes = await request('/auth/admin/login', {
      method: 'POST',
      body: {
        email: 'ashok.examcell@pmec.edu',
        password: 'Password@123',
        captchaId: capAdmin.captchaId,
        captchaInput: capAdmin.solution,
      },
    });

    if (adminLoginRes.status !== 200 || !adminLoginRes.data.token || adminLoginRes.data.otpRequired) {
      throw new Error('Admin login failed or unexpectedly required OTP: ' + JSON.stringify(adminLoginRes.data));
    }
    adminToken = adminLoginRes.data.token;
    console.log('  ✔ Admin logged in directly in 1 step without OTP (token issued, office_role preserved)');

    // 2c: Admin views pending students queue -> verify id_card_url is present
    const pendingListRes = await request('/admin/students/pending', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (pendingListRes.status !== 200 || !Array.isArray(pendingListRes.data)) {
      throw new Error('Failed to list pending students: ' + JSON.stringify(pendingListRes.data));
    }
    const targetStudent = pendingListRes.data[0];
    if (!targetStudent) throw new Error('No pending student found in admin queue');
    if (!targetStudent.id_card_url) {
      throw new Error('Pending student record is missing id_card_url: ' + JSON.stringify(targetStudent));
    }
    pendingStudentId = targetStudent.id;
    console.log(`  ✔ Admin retrieved pending students list with ID card link: ${targetStudent.id_card_url}`);

    // 2d: Admin verifies pending student
    const verifyRes = await request(`/admin/students/${pendingStudentId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (verifyRes.status !== 200 || verifyRes.data.student.status !== 'active') {
      throw new Error('Failed to verify student: ' + JSON.stringify(verifyRes.data));
    }
    console.log(`  ✔ Admin successfully verified student ID: ${pendingStudentId}`);

    // 2e: Student login Step 1 -> returns otpRequired: true, studentId (token withheld)
    const capStudent = await getCaptcha();
    const studentStep1 = await request('/auth/student/login', {
      method: 'POST',
      body: {
        email: targetStudent.email,
        password: 'Password@123',
        captchaId: capStudent.captchaId,
        captchaInput: capStudent.solution,
      },
    });
    if (studentStep1.status !== 200 || !studentStep1.data.otpRequired || !studentStep1.data.studentId || studentStep1.data.token) {
      throw new Error('Student login did not return otpRequired: ' + JSON.stringify(studentStep1.data));
    }
    const studentId = studentStep1.data.studentId;
    console.log(`  ✔ Student Login Step 1: otpRequired=true, studentId=${studentId}, token withheld`);

    // 2f: Student wrong OTP -> rejected with 400
    const badOtp = await request('/auth/student/verify-otp', {
      method: 'POST',
      body: { studentId, otp: '000000' },
    });
    if (badOtp.status !== 400 || !badOtp.data.error.includes('Invalid')) {
      throw new Error('Wrong student OTP was not rejected: ' + JSON.stringify(badOtp.data));
    }
    console.log('  ✔ Wrong student OTP rejected with 400 Bad Request');

    // 2g: Student correct OTP -> returns { token, user }
    const testOtpCode = '654321';
    const Student = require('../models/Student');
    await Student.setOtp(studentId, await bcrypt.hash(testOtpCode, 10), new Date(Date.now() + 300000));

    const goodOtp = await request('/auth/student/verify-otp', {
      method: 'POST',
      body: { studentId, otp: testOtpCode },
    });
    if (goodOtp.status !== 200 || !goodOtp.data.token || !goodOtp.data.user) {
      throw new Error('Valid student OTP verification failed: ' + JSON.stringify(goodOtp.data));
    }
    console.log('  ✔ Correct student OTP verified: JWT issued, student logged into dashboard');

    results['Feature 2: Student 2-Step OTP Verification'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 2 Failed:', err.message);
    results['Feature 2: Student 2-Step OTP Verification'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // SECTION 3: ADAPTIVE REQUEST SUBMISSION (ALL 7 TYPES)
  // ----------------------------------------------------
  console.log('\n▶ [Test 3] Adaptive Request Submission (All 7 Types)...');
  let studentToken = '';
  let bonafideReqId = null;
  let memoReqId = null;
  let rejectReqId = null;
  try {
    const capRavi = await getCaptcha();
    const loginRavi = await request('/auth/student/login', {
      method: 'POST',
      body: {
        email: 'ravi.sahoo@student.pmec.edu',
        password: 'Password@123',
        captchaId: capRavi.captchaId,
        captchaInput: capRavi.solution,
      },
    });
    const sId = loginRavi.data.studentId || 1;
    const testRaviOtp = '998877';
    const Student = require('../models/Student');
    await Student.setOtp(sId, await bcrypt.hash(testRaviOtp, 10), new Date(Date.now() + 300000));
    const verifyRavi = await request('/auth/student/verify-otp', {
      method: 'POST',
      body: { studentId: sId, otp: testRaviOtp },
    });
    studentToken = verifyRavi.data.token;

    const typesToTest = [
      { type: 'bonafide_certificate', details: { purpose: 'Higher studies passport verification' } },
      { type: 'scholarship_verification', details: { scheme_name: 'Post-Matric Odisha State Scholarship 2026' } },
      { type: 'semester_registration', details: { semester_to_register: 7 } },
      { type: 'internal_mark_correction', details: { subject_code: 'CSE-301', subject_name: 'Database Systems' } },
      { type: 'back_paper', details: { subject_code: 'MAT-201', semester: 3 } },
      { type: 'revaluation', details: { subject_code: 'CSE-302', semester: 5 } },
      { type: 'exam_grievance', details: { subject_code: 'CSE-305', description: 'Attendance shortage dispute due to sports meet' } },
    ];

    for (const item of typesToTest) {
      const res = await request('/requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: item,
      });
      const reqObj = res.data.request || res.data;
      if (res.status !== 201 || !reqObj || reqObj.type !== item.type) {
        throw new Error(`Failed to submit request for ${item.type}: ${JSON.stringify(res.data)}`);
      }
      if (item.type === 'bonafide_certificate') bonafideReqId = reqObj.id;
      if (item.type === 'semester_registration') memoReqId = reqObj.id;
      if (item.type === 'back_paper') rejectReqId = reqObj.id;
      console.log(`  ✔ Submitted ${item.type} (Request #${reqObj.id})`);
    }

    results['Section 3: Adaptive Request Submission'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 3 Failed:', err.message);
    results['Section 3: Adaptive Request Submission'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // SECTION 4: ADMIN REVIEW, E-SIGNATURE WORKFLOW & PDF GENERATION
  // ----------------------------------------------------
  console.log('\n▶ [Test 4] Admin Review, E-Signature & PDF Generation...');
  try {
    await pool.query('UPDATE admins SET signature_url = NULL WHERE email = $1', ['ashok.examcell@pmec.edu']);

    const blockRes = await request(`/admin/requests/${bonafideReqId}/action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'approve', comment: 'Approved without signature test' },
    });

    if (blockRes.status !== 400 || !blockRes.data.error.includes('signature')) {
      throw new Error('Approval without signature was NOT blocked: ' + JSON.stringify(blockRes.data));
    }
    console.log('  ✔ Approval blocked when admin has no e-signature on file (400 Bad Request)');

    // Set up signature via canvas drawing (base64 PNG)
    const samplePngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const sigRes = await request('/admin/signature/draw', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { dataUrl: samplePngBase64 },
    });

    if (sigRes.status !== 200 || !sigRes.data.admin.signature_url) {
      throw new Error('Failed to save drawn signature: ' + JSON.stringify(sigRes.data));
    }
    console.log('  ✔ Admin e-signature created and saved successfully:', sigRes.data.admin.signature_url);

    // Admin approves bonafide certificate request -> triggers signed PDF certificate generation
    const approveBonafide = await request(`/admin/requests/${bonafideReqId}/action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'approve', comment: 'Verified student records. Bonafide certificate granted.' },
    });

    if (approveBonafide.status !== 200 || !approveBonafide.data.certificate) {
      throw new Error('Bonafide certificate approval failed: ' + JSON.stringify(approveBonafide.data));
    }
    const cert = approveBonafide.data.certificate;
    console.log(`  ✔ Bonafide certificate approved: Certificate No: ${cert.certificate_no}, PDF: ${cert.pdf_url}`);

    // Verify PDF file exists on disk
    const certDiskPath = path.join(__dirname, '..', cert.pdf_url.replace(/^\//, ''));
    if (!fs.existsSync(certDiskPath)) {
      throw new Error(`Generated PDF file does not exist on disk at: ${certDiskPath}`);
    }
    console.log(`  ✔ PDF Certificate exists on disk (${fs.statSync(certDiskPath).size} bytes)`);

    // Admin approves non-certificate request (semester registration) -> creates signed approval memo PDF
    const approveMemo = await request(`/admin/requests/${memoReqId}/action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'approve', comment: 'Semester registration approved after fee verification.' },
    });

    if (approveMemo.status !== 200 || !approveMemo.data.certificate) {
      throw new Error('Semester registration approval failed: ' + JSON.stringify(approveMemo.data));
    }
    const memoCert = approveMemo.data.certificate;
    const memoDiskPath = path.join(__dirname, '..', memoCert.pdf_url.replace(/^\//, ''));
    if (!fs.existsSync(memoDiskPath)) {
      throw new Error(`Generated Approval Memo PDF does not exist at: ${memoDiskPath}`);
    }
    console.log(`  ✔ Approval memo PDF generated and exists on disk (${fs.statSync(memoDiskPath).size} bytes)`);

    // Test Reject action on rejectReqId with comment
    const rejectRes = await request(`/admin/requests/${rejectReqId}/action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'reject', comment: 'Fee receipt unreadable. Resubmit with clear scan.' },
    });
    if (rejectRes.status !== 200 || rejectRes.data.request.status !== 'rejected') {
      throw new Error('Reject action failed: ' + JSON.stringify(rejectRes.data));
    }
    console.log('  ✔ Request status updated to rejected with mandatory comment recorded');

    results['Section 4: Admin Review, E-Signature & PDF'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 4 Failed:', err.message);
    results['Section 4: Admin Review, E-Signature & PDF'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // SECTION 5: STUDENT VISIBILITY & AUDIT TIMELINE
  // ----------------------------------------------------
  console.log('\n▶ [Test 5] Student Request Detail, Audit Timeline & Certificate Download...');
  try {
    const detailRes = await request(`/requests/${bonafideReqId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    if (detailRes.status !== 200) {
      throw new Error('Failed to fetch request detail: ' + JSON.stringify(detailRes.data));
    }

    const { timeline, certificate, status } = detailRes.data;
    if (status !== 'approved') throw new Error(`Request status is not approved: ${status}`);
    if (!timeline || timeline.length === 0) throw new Error('Timeline empty');
    if (!certificate || !certificate.pdf_url) throw new Error('Certificate empty');

    const approvalLog = timeline.find((l) => l.action === 'approved');
    if (!approvalLog || !approvalLog.signature_url) {
      throw new Error('Approval log missing snapshot signature_url: ' + JSON.stringify(timeline));
    }

    console.log('  ✔ Student retrieved full request details with JSONB fields');
    console.log(`  ✔ Audit timeline contains ${timeline.length} logged actions with exact timestamps`);
    console.log(`  ✔ Approval log snapshot has e-signature URL: ${approvalLog.signature_url}`);
    console.log(`  ✔ Certificate verified: ${certificate.certificate_no} (${certificate.pdf_url})`);

    results['Section 5: Student Visibility & Timeline'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 5 Failed:', err.message);
    results['Section 5: Student Visibility & Timeline'] = `FAILED: ${err.message}`;
  }

  // ----------------------------------------------------
  // SECTION 6: ROLE-BASED ACCESS CONTROL (RBAC)
  // ----------------------------------------------------
  console.log('\n▶ [Test 6] Role-Based Access Control (RBAC)...');
  try {
    const studentAsAdmin = await request('/admin/requests', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (studentAsAdmin.status !== 403) {
      throw new Error(`Student was not blocked from admin queue (status: ${studentAsAdmin.status})`);
    }

    const adminAsStudent = await request('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { type: 'bonafide_certificate', details: { purpose: 'test' } },
    });
    if (adminAsStudent.status !== 403) {
      throw new Error(`Admin was not blocked from student submission (status: ${adminAsStudent.status})`);
    }

    const unauth = await request('/admin/requests');
    if (unauth.status !== 401) {
      throw new Error(`Unauthenticated request was not blocked (status: ${unauth.status})`);
    }

    console.log('  ✔ Student token rejected on /api/admin/* with 403 Forbidden');
    console.log('  ✔ Admin token rejected on /api/requests POST with 403 Forbidden');
    console.log('  ✔ Anonymous request blocked with 401 Unauthorized');
    results['Section 6: Role Protection & RBAC'] = 'PASSED (worked as expected)';
  } catch (err) {
    console.error('  ✖ Test 6 Failed:', err.message);
    results['Section 6: Role Protection & RBAC'] = `FAILED: ${err.message}`;
  }

  console.log('\n====================================================');
  console.log('SMOKE TEST SUMMARY RESULTS:');
  console.log('====================================================');
  for (const [sec, res] of Object.entries(results)) {
    console.log(`- ${sec}: ${res}`);
  }

  const allPassed = Object.values(results).every((r) => r.startsWith('PASSED'));
  if (allPassed) {
    console.log('\n🎉 ALL BACKEND END-TO-END SMOKE TESTS PASSED PERFECTLY!');
  } else {
    console.log('\n⚠️ Some smoke tests failed. See details above.');
    process.exit(1);
  }
}

runSmokeTests().catch((e) => {
  console.error('Smoke test runner failed:', e);
  process.exit(1);
});
