import {
  getStoredRequests,
  saveStoredRequests,
  getStoredUsers,
  saveStoredUsers,
  INITIAL_USERS,
} from './mockData';

export async function handleMockRequest(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').replace(/^\/api/, '').replace(/^https?:\/\/[^/]+(\/api)?/, '');
  const data = typeof config.data === 'string' ? (config.data ? JSON.parse(config.data) : {}) : (config.data || {});

  // Simulate network latency (100ms) for natural feel
  await new Promise((resolve) => setTimeout(resolve, 100));

  // --- 1. STUDENT LOGIN ---
  if (url === '/auth/student/login' && method === 'post') {
    const inputEmail = (data.email || '').trim().toLowerCase();

    const users = getStoredUsers();
    let student = users.find(
      (u) =>
        u.role === 'student' &&
        (u.email.toLowerCase() === inputEmail || u.roll_no === inputEmail || inputEmail.includes(u.roll_no))
    );

    // If not found in seed, create an active demo student account on the fly
    if (!student) {
      student = {
        id: Date.now(),
        roll_no: inputEmail.includes('@') ? inputEmail.split('_')[0] : inputEmail || '2301109307',
        name: 'Demo PMEC Student',
        department: 'CSE',
        semester: 6,
        email: inputEmail.includes('@') ? inputEmail : `${inputEmail}_cse@pmec.ac.in`,
        phone: '9876543210',
        status: 'active',
        role: 'student',
      };
      saveStoredUsers([...users, student]);
    }

    return {
      status: 200,
      data: {
        token: `demo-jwt-student-${student.id}`,
        user: student,
      },
    };
  }

  // --- 2. ADMIN / INSTITUTE OFFICER LOGIN ---
  if (url === '/auth/admin/login' && method === 'post') {
    const inputEmail = (data.email || '').trim().toLowerCase();
    const users = getStoredUsers();

    let admin = users.find((u) => u.role === 'admin' && u.email.toLowerCase() === inputEmail);

    if (!admin) {
      // Check role mapping by email prefix
      let officeRole = 'exam_cell';
      let name = 'PMEC Officer';
      let dept = 'Administration';

      if (inputEmail.includes('principal')) {
        officeRole = 'principal';
        name = 'Prof. (Dr.) Chittaranjan Tripathy (Principal)';
        dept = 'Office of the Principal';
      } else if (inputEmail.includes('dsw')) {
        officeRole = 'dsw';
        name = 'Prof. Ramesh Chandra Jena (DSW)';
        dept = 'Dean Student Welfare (DSW)';
      } else if (inputEmail.includes('scholarship')) {
        officeRole = 'scholarship';
        name = 'Dr. S. K. Mahapatra (Scholarship Officer)';
        dept = 'Scholarship & Financial Aid Cell';
      } else if (inputEmail.includes('academic')) {
        officeRole = 'academic';
        name = 'Prof. Sunita Rao (Academic Section)';
        dept = 'Academic Section';
      } else if (inputEmail.includes('hod')) {
        officeRole = 'hod';
        name = 'HOD CSE';
        dept = 'Computer Science & Engineering';
      }

      admin = {
        id: Date.now(),
        name,
        role: 'admin',
        office_role: officeRole,
        department: dept,
        email: inputEmail,
        signature_url: '/uploads/signatures/dsw-signature.png',
      };
      saveStoredUsers([...users, admin]);
    }

    return {
      status: 200,
      data: {
        token: `demo-jwt-admin-${admin.id}`,
        user: { ...admin, office_role: admin.office_role || admin.role },
      },
    };
  }

  // --- 3. STUDENT REGISTRATION ---
  if (url === '/auth/student/register' && method === 'post') {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    return {
      status: 201,
      data: {
        otpRequired: true,
        studentId: Date.now(),
        email: data.email,
        phone: data.phone,
        otpDevCode: otp,
        message: `Verification code dispatched to ${data.email} and mobile SMS. Code: ${otp}`,
      },
    };
  }

  // --- 4. VERIFY REGISTRATION OTP ---
  if (url === '/auth/student/verify-otp' && method === 'post') {
    const student = {
      id: Date.now(),
      roll_no: data.roll_no || '2301109307',
      name: data.name || 'New Verified Student',
      department: data.department || 'CSE',
      semester: data.semester || 6,
      email: data.email || '2301109307_cse@pmec.ac.in',
      phone: data.phone || '9876543210',
      status: 'active',
      role: 'student',
    };
    return {
      status: 200,
      data: {
        token: `demo-jwt-student-${student.id}`,
        user: student,
      },
    };
  }

  // --- 5. RESEND OTP ---
  if (url === '/auth/student/resend-otp' && method === 'post') {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    return {
      status: 200,
      data: {
        message: 'A fresh 6-digit verification code has been dispatched.',
        otpDevCode: otp,
      },
    };
  }

  // --- 6. AUTH ME ---
  if (url === '/auth/me' && method === 'get') {
    const storedUser = localStorage.getItem('pmec_user');
    if (storedUser) {
      return { status: 200, data: JSON.parse(storedUser) };
    }
    return { status: 200, data: INITIAL_USERS[0] };
  }

  // --- 7. STUDENT: LIST MY REQUESTS ---
  if (url === '/requests/my' && method === 'get') {
    const requests = getStoredRequests();
    return { status: 200, data: requests };
  }

  // --- 8. STUDENT: SUBMIT NEW REQUEST ---
  if (url === '/requests' && method === 'post') {
    const requests = getStoredRequests();
    let bodyData = data;
    // FormData support
    if (config.data instanceof FormData) {
      bodyData = {};
      config.data.forEach((val, key) => {
        bodyData[key] = val;
      });
      if (typeof bodyData.details === 'string') {
        try {
          bodyData.details = JSON.parse(bodyData.details);
        } catch {}
      }
    }

    const newReq = {
      id: Date.now(),
      student_id: 1,
      student_name: 'Subham Pradhan',
      roll_no: '2301109307',
      student_email: '2301109307_cse@pmec.ac.in',
      student_department: 'CSE',
      student_semester: 6,
      type: bodyData.type || 'bonafide_certificate',
      status: 'submitted',
      details: bodyData.details || {},
      documents: [
        {
          id: Date.now(),
          file_name: 'Submitted_Application_Document.pdf',
          file_path: '/uploads/documents/sample_document.pdf',
          document_type: 'application_document',
        },
      ],
      timeline: [
        { action: 'submitted', comment: 'Request submitted successfully.', created_at: new Date().toISOString() },
      ],
      certificate: null,
      created_at: new Date().toISOString(),
    };

    saveStoredRequests([newReq, ...requests]);
    return { status: 201, data: newReq };
  }

  // --- 9. REQUEST DETAIL ---
  if (url.match(/^\/requests\/\d+$/) && method === 'get') {
    const id = parseInt(url.split('/')[2], 10);
    const requests = getStoredRequests();
    const req = requests.find((r) => r.id === id) || requests[0];
    return { status: 200, data: req };
  }

  // --- 10. ADMIN: LIST ALL REQUESTS ---
  if (url.startsWith('/admin/requests') && method === 'get') {
    const requests = getStoredRequests();
    return { status: 200, data: requests };
  }

  // --- 11. ADMIN: APPROVE / REJECT / FORWARD REQUEST ---
  if (url.match(/^\/admin\/requests\/\d+\/action$/) && method === 'post') {
    const id = parseInt(url.split('/')[3], 10);
    const requests = getStoredRequests();
    const idx = requests.findIndex((r) => r.id === id);

    if (idx !== -1) {
      const current = requests[idx];
      const action = data.action;
      const comment = data.comment || 'Reviewed by PMEC Authority';

      let newStatus = 'under_review';
      let cert = current.certificate;

      if (action === 'approve') {
        newStatus = 'approved';
        const prefix = current.type === 'back_paper' ? 'BKP' : current.type === 'semester_registration' ? 'SEM' : 'BNF';
        const certNo = `PMEC/${prefix}/${new Date().getFullYear()}/${String(Math.floor(1000 + Math.random() * 9000))}`;
        cert = {
          certificate_no: certNo,
          pdf_url: `/uploads/certificates/certificate-${certNo.replace(/\//g, '-')}.pdf`,
          issued_at: new Date().toISOString(),
        };
      } else if (action === 'reject') {
        newStatus = 'rejected';
      } else if (action === 'forward') {
        newStatus = 'forwarded';
      }

      const updated = {
        ...current,
        status: newStatus,
        certificate: cert,
        timeline: [
          ...(current.timeline || []),
          {
            action: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'forward' ? 'forwarded' : 'reviewed',
            comment,
            actor_name: 'PMEC Officer',
            created_at: new Date().toISOString(),
          },
        ],
      };

      requests[idx] = updated;
      saveStoredRequests(requests);
      return { status: 200, data: updated };
    }
  }

  // --- 12. SAVE / UPLOAD SIGNATURE ---
  if (url.includes('/admin/signature') && method === 'post') {
    return {
      status: 200,
      data: {
        message: 'Signature saved successfully.',
        admin: {
          signature_url: '/uploads/signatures/dsw-signature.png',
        },
      },
    };
  }

  // Default fallback
  return { status: 200, data: { success: true } };
}
