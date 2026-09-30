/**
 * Seeds 2 admins and 3 students with known passwords (for demo/testing only).
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const admins = [
    { name: 'Dr. Ashok Mishra', role: 'exam_cell', department: 'Examination Cell', email: 'ashok.examcell@pmec.edu' },
    { name: 'Ms. Sunita Rao', role: 'hod', department: 'Computer Science & Engineering', email: 'sunita.hod.cse@pmec.edu' },
    { name: 'Prof. Ramesh Chandra Jena', role: 'dsw', department: 'Dean Student Welfare (DSW)', email: 'dsw@pmec.ac.in' },
  ];

  for (const a of admins) {
    await pool.query(
      `INSERT INTO admins (name, role, department, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [a.name, a.role, a.department, a.email, passwordHash]
    );
  }

  const students = [
    { roll_no: '2021CSE001', name: 'Ravi Kumar Sahoo', department: 'CSE', semester: 6, email: 'ravi.sahoo@student.pmec.edu', phone: '9800000001' },
    { roll_no: '2021ECE014', name: 'Priya Patnaik', department: 'ECE', semester: 6, email: 'priya.patnaik@student.pmec.edu', phone: '9800000002' },
    { roll_no: '2022ME021', name: 'Suman Behera', department: 'Mechanical', semester: 4, email: 'suman.behera@student.pmec.edu', phone: '9800000003' },
  ];

  for (const s of students) {
    await pool.query(
      `INSERT INTO students (roll_no, name, department, semester, email, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [s.roll_no, s.name, s.department, s.semester, s.email, s.phone, passwordHash]
    );
  }

  console.log('Seed complete.');
  console.log('All seeded users share the password: Password@123');
  console.log('Admins:', admins.map((a) => a.email).join(', '));
  console.log('Students:', students.map((s) => s.email).join(', '));

  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
