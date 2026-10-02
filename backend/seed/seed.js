/**
 * Seeds comprehensive admin accounts (Principal, DSW, Scholarship, Exam Cell, Academic)
 * and verified students with known passwords.
 * Password for all demo accounts: Password@123 (also accepts Admin@123 / Student@123)
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const passwordHash = await bcrypt.hash('Password@123', 10);
  const defaultSignature = '/uploads/signatures/dsw-signature.png';

  const admins = [
    {
      name: 'Prof. (Dr.) Chittaranjan Tripathy',
      role: 'principal',
      department: 'Office of the Principal',
      email: 'principal@pmec.ac.in',
    },
    {
      name: 'Prof. Ramesh Chandra Jena',
      role: 'dsw',
      department: 'Dean Student Welfare (DSW)',
      email: 'dsw@pmec.ac.in',
    },
    {
      name: 'Dr. S. K. Mahapatra',
      role: 'scholarship',
      department: 'Scholarship & Financial Aid Cell',
      email: 'scholarship@pmec.ac.in',
    },
    {
      name: 'Dr. Ashok Mishra',
      role: 'exam_cell',
      department: 'Examination Cell',
      email: 'examcell@pmec.ac.in',
    },
    {
      name: 'Dr. Ashok Mishra',
      role: 'exam_cell',
      department: 'Examination Cell',
      email: 'ashok.examcell@pmec.edu',
    },
    {
      name: 'Prof. Sunita Rao',
      role: 'academic',
      department: 'Academic Section',
      email: 'academic@pmec.ac.in',
    },
    {
      name: 'Dr. Manas Ranjan Patra',
      role: 'hod',
      department: 'Computer Science & Engineering',
      email: 'hod.cse@pmec.ac.in',
    },
    {
      name: 'Ms. Sunita Rao',
      role: 'hod',
      department: 'Computer Science & Engineering',
      email: 'sunita.hod.cse@pmec.edu',
    },
  ];

  for (const a of admins) {
    await pool.query(
      `INSERT INTO admins (name, role, department, email, password_hash, signature_url, signature_updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           role = EXCLUDED.role,
           department = EXCLUDED.department,
           password_hash = EXCLUDED.password_hash,
           signature_url = COALESCE(admins.signature_url, EXCLUDED.signature_url)`,
      [a.name, a.role, a.department, a.email.toLowerCase(), passwordHash, defaultSignature]
    );
  }

  const students = [
    {
      roll_no: '2301109307',
      name: 'Subham Pradhan',
      department: 'CSE',
      semester: 6,
      email: '2301109307_cse@pmec.ac.in',
      phone: '9800000005',
    },
    {
      roll_no: '2301109308',
      name: 'Ravi Kumar Sahoo',
      department: 'CSE',
      semester: 6,
      email: '2301109308_cse@pmec.ac.in',
      phone: '9800000001',
    },
    {
      roll_no: '2301109309',
      name: 'Priya Patnaik',
      department: 'ECE',
      semester: 6,
      email: '2301109309_ece@pmec.ac.in',
      phone: '9800000002',
    },
  ];

  for (const s of students) {
    await pool.query(
      `INSERT INTO students (roll_no, name, department, semester, email, phone, password_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       ON CONFLICT (roll_no) DO UPDATE
       SET email = EXCLUDED.email,
           name = EXCLUDED.name,
           department = EXCLUDED.department,
           semester = EXCLUDED.semester,
           phone = EXCLUDED.phone,
           password_hash = EXCLUDED.password_hash,
           status = 'active'`,
      [s.roll_no, s.name, s.department, s.semester, s.email.toLowerCase(), s.phone, passwordHash]
    );
  }

  console.log('✅ Seed completed successfully!');
  console.log('Default Password for all accounts: Password@123 (also accepts Admin@123 / Student@123)');
  console.log('Institute Accounts:');
  console.log(' - Principal: principal@pmec.ac.in');
  console.log(' - DSW: dsw@pmec.ac.in');
  console.log(' - Scholarship: scholarship@pmec.ac.in');
  console.log(' - Exam Cell: examcell@pmec.ac.in');
  console.log(' - Academic Section: academic@pmec.ac.in');
  console.log('Students:');
  console.log(' - Reg No 2301109307: 2301109307_cse@pmec.ac.in');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
