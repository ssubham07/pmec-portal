/**
 * Offline & Demo Data Store for PMEC Student Service Portal.
 * Automatically synchronizes with localStorage so changes (submissions, approvals, e-signatures)
 * persist seamlessly across sessions even on Vercel or when backend is offline.
 */

const STORAGE_KEYS = {
  REQUESTS: 'pmec_demo_requests_v3',
  USERS: 'pmec_demo_users_v3',
};

export const INITIAL_USERS = [
  {
    id: 1,
    roll_no: '2301109307',
    name: 'Subham Pradhan',
    department: 'CSE',
    semester: 6,
    email: '2301109307_cse@pmec.ac.in',
    phone: '9800000005',
    status: 'active',
    role: 'student',
  },
  {
    id: 2,
    name: 'Prof. (Dr.) Chittaranjan Tripathy',
    role: 'admin',
    office_role: 'principal',
    department: 'Office of the Principal',
    email: 'principal@pmec.ac.in',
    signature_url: '/uploads/signatures/dsw-signature.png',
  },
  {
    id: 3,
    name: 'Prof. Ramesh Chandra Jena',
    role: 'admin',
    office_role: 'dsw',
    department: 'Dean Student Welfare (DSW)',
    email: 'dsw@pmec.ac.in',
    signature_url: '/uploads/signatures/dsw-signature.png',
  },
  {
    id: 4,
    name: 'Dr. S. K. Mahapatra',
    role: 'admin',
    office_role: 'scholarship',
    department: 'Scholarship & Financial Aid Cell',
    email: 'scholarship@pmec.ac.in',
    signature_url: '/uploads/signatures/dsw-signature.png',
  },
  {
    id: 5,
    name: 'Dr. Ashok Mishra',
    role: 'admin',
    office_role: 'exam_cell',
    department: 'Examination Cell',
    email: 'examcell@pmec.ac.in',
    signature_url: '/uploads/signatures/dsw-signature.png',
  },
  {
    id: 6,
    name: 'Prof. Sunita Rao',
    role: 'admin',
    office_role: 'academic',
    department: 'Academic Section',
    email: 'academic@pmec.ac.in',
    signature_url: '/uploads/signatures/dsw-signature.png',
  },
];

export const INITIAL_REQUESTS = [
  {
    id: 101,
    student_id: 1,
    student_name: 'Subham Pradhan',
    roll_no: '2301109307',
    student_email: '2301109307_cse@pmec.ac.in',
    student_department: 'CSE',
    student_semester: 6,
    type: 'bonafide_certificate',
    status: 'approved',
    details: {
      purpose: 'State Government Scholarship & Hostel Verification',
      bonafide_number: 'PMEC/BNF/2026/000042',
    },
    documents: [
      {
        id: 1,
        file_name: 'Bonafide_Application_Signed.pdf',
        file_path: '/uploads/documents/bonafide_sample.pdf',
        document_type: 'bonafide_document',
      },
    ],
    timeline: [
      { action: 'submitted', comment: 'Request submitted by student.', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
      { action: 'reviewed', comment: 'Bonafide details verified by DSW Office.', actor_name: 'Prof. Ramesh Chandra Jena (DSW)', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { action: 'approved', comment: 'Approved with official digital signature and certificate issued.', actor_name: 'Prof. Ramesh Chandra Jena (DSW)', created_at: new Date(Date.now() - 86400000).toISOString() },
    ],
    certificate: {
      certificate_no: 'PMEC/BNF/2026/000042',
      pdf_url: '/uploads/certificates/certificate-PMEC-BNF-2026-000042.pdf',
      issued_at: new Date(Date.now() - 86400000).toISOString(),
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 102,
    student_id: 1,
    student_name: 'Subham Pradhan',
    roll_no: '2301109307',
    student_email: '2301109307_cse@pmec.ac.in',
    student_department: 'CSE',
    student_semester: 6,
    type: 'semester_registration',
    status: 'under_review',
    details: {
      semester: '6',
      academic_year: '2025-2026',
      fee_reference: 'SBIN20260901238',
      fee_amount: '14500',
      payment_date: '2026-09-15',
    },
    documents: [
      {
        id: 2,
        file_name: 'SBI_Collect_Fee_Receipt.pdf',
        file_path: '/uploads/documents/fee_receipt.pdf',
        document_type: 'fee_receipt',
      },
    ],
    timeline: [
      { action: 'submitted', comment: 'Semester registration submitted with fee verification receipt.', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { action: 'reviewed', comment: 'Fee challan SBIN20260901238 under verification with Accounts Office.', actor_name: 'Prof. Sunita Rao (Academic)', created_at: new Date(Date.now() - 86400000).toISOString() },
    ],
    certificate: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 103,
    student_id: 1,
    student_name: 'Subham Pradhan',
    roll_no: '2301109307',
    student_email: '2301109307_cse@pmec.ac.in',
    student_department: 'CSE',
    student_semester: 6,
    type: 'back_paper',
    status: 'approved',
    details: {
      subject_name: 'Design and Analysis of Algorithms (CS301)',
      semester: '4',
      bank_challan_no: 'CHAL-PNB-883921',
      fee_amount: '1200',
      payment_date: '2026-09-20',
    },
    documents: [
      {
        id: 3,
        file_name: 'Bank_Challan_Deposit_Slip.pdf',
        file_path: '/uploads/documents/challan_slip.pdf',
        document_type: 'challan_receipt',
      },
    ],
    timeline: [
      { action: 'submitted', comment: 'Back paper registration submitted with Bank Challan Reference CHAL-PNB-883921.', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
      { action: 'reviewed', comment: 'Bank Challan verified with finance cell.', actor_name: 'Dr. Ashok Mishra (Exam Cell)', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { action: 'approved', comment: 'Challan cleared and Back Paper Registration Certificate issued.', actor_name: 'Dr. Ashok Mishra (Exam Cell)', created_at: new Date(Date.now() - 86400000).toISOString() },
    ],
    certificate: {
      certificate_no: 'PMEC/BKP/2026/000018',
      pdf_url: '/uploads/certificates/certificate-PMEC-BKP-2026-000018.pdf',
      issued_at: new Date(Date.now() - 86400000).toISOString(),
    },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 104,
    student_id: 1,
    student_name: 'Subham Pradhan',
    roll_no: '2301109307',
    student_email: '2301109307_cse@pmec.ac.in',
    student_department: 'CSE',
    student_semester: 6,
    type: 'scholarship_verification',
    status: 'submitted',
    details: {
      scholarship_name: 'Odisha State Prerana Post-Matric Scholarship',
      application_id: 'PRERANA-2026-99120',
      bonafide_number: 'PMEC/BNF/2026/000042',
    },
    documents: [
      {
        id: 4,
        file_name: 'Scholarship_Application_Form.pdf',
        file_path: '/uploads/documents/scholarship_form.pdf',
        document_type: 'scholarship_doc',
      },
    ],
    timeline: [
      { action: 'submitted', comment: 'Application submitted for DSW and Scholarship Cell verification.', created_at: new Date().toISOString() },
    ],
    certificate: null,
    created_at: new Date().toISOString(),
  },
];

export function getStoredRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
      return INITIAL_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REQUESTS;
  }
}

export function saveStoredRequests(requests) {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  } catch (err) {
    console.error('Failed to save requests to localStorage:', err);
  }
}

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to localStorage:', err);
  }
}
