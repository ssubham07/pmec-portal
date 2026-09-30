import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  roll_no: '',
  name: '',
  department: '',
  semester: '',
  email: '',
  phone: '',
  password: '',
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [idCard, setIdCard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingNotice, setPendingNotice] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!idCard) {
      setError('Please upload your College ID Card (PDF / JPG / PNG).');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('roll_no', form.roll_no);
      formData.append('name', form.name);
      formData.append('department', form.department);
      formData.append('semester', Number(form.semester));
      formData.append('email', form.email);
      formData.append('phone', form.phone || '');
      formData.append('password', form.password);
      formData.append('id_card', idCard);

      const { data } = await api.post('/auth/student/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.pendingVerification) {
        setPendingNotice(
          data.message ||
            'Registration submitted. Because you registered with a personal email, your account is pending verification by the Institute before you can log in.'
        );
      } else {
        login(data.token, data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  if (pendingNotice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md border border-slate-200 text-center">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ⏳
          </div>
          <h2 className="text-xl font-bold text-[#0f2a52] mb-2">Registration Pending Verification</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            {pendingNotice}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 text-left mb-6">
            <strong>Note:</strong> Students using an official <code className="bg-white px-1 rounded">@pmec.ac.in</code> email are activated instantly. Personal email registrations are reviewed by the Examination Cell or Academic Dean.
          </div>
          <Link
            to="/login?role=student"
            className="block w-full bg-[#0f2a52] hover:bg-[#1a3a69] text-white rounded-lg py-2.5 text-sm font-semibold shadow transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-xl font-extrabold text-[#0f2a52]">Create Student Account</h1>
          <p className="text-xs text-slate-500 mt-1">Register to submit and track PMEC service requests.</p>
        </div>

        {error && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div className="col-span-1">
            <label className="block font-semibold text-slate-700 mb-1">Roll No. *</label>
            <input
              placeholder="e.g. 2021CSE001"
              required
              value={form.roll_no}
              onChange={(e) => update('roll_no', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <div className="col-span-1">
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              placeholder="Full Name"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <div className="col-span-1">
            <label className="block font-semibold text-slate-700 mb-1">Department *</label>
            <input
              placeholder="e.g. CSE, ECE, ME"
              required
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <div className="col-span-1">
            <label className="block font-semibold text-slate-700 mb-1">Semester (1-12) *</label>
            <input
              placeholder="Semester"
              type="number"
              min="1"
              max="12"
              required
              value={form.semester}
              onChange={(e) => update('semester', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <div className="col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              placeholder="student@pmec.ac.in (or personal email)"
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Official @pmec.ac.in emails activate instantly. Personal emails require institute verification.
            </span>
          </div>

          <div className="col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              placeholder="e.g. 9800000001"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <div className="col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              College ID Card (PDF / JPG / PNG, Max 5MB) *
            </label>
            <input
              type="file"
              required
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={(e) => setIdCard(e.target.files[0] || null)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Required for all students. Verified by the Institute for academic validation.
            </span>
          </div>

          <div className="col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Password *</label>
            <input
              placeholder="••••••••••••"
              type="password"
              required
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="col-span-2 bg-[#0f2a52] hover:bg-[#1a3a69] text-white rounded-lg py-2.5 text-sm font-bold shadow transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0f2a52] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
