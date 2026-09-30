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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingNotice, setPendingNotice] = useState(null);

  // OTP Verification Step State
  const [otpStep, setOtpStep] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.roll_no.trim() || !form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        roll_no: form.roll_no.trim(),
        name: form.name.trim(),
        department: form.department.trim(),
        semester: Number(form.semester),
        email: form.email.trim().toLowerCase(),
        phone: form.phone ? form.phone.trim() : '',
        password: form.password,
      };

      const { data } = await api.post('/auth/student/register', payload);

      if (data.otpRequired) {
        setStudentId(data.studentId);
        setOtpMessage(data.message || `A 6-digit verification code has been dispatched to ${form.email}.`);
        if (data.otpDevCode) {
          setDevOtp(data.otpDevCode);
          setOtp(data.otpDevCode);
        }
        setOtpStep(true);
      } else if (data.pendingVerification) {
        setPendingNotice(
          data.message ||
            'Registration submitted. Because you registered with a personal email, your account is pending verification by the Institute before you can log in.'
        );
      } else {
        login(data.token, data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setOtpError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setOtpError('Please enter the full 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/student/verify-otp', {
        studentId,
        email: form.email,
        roll_no: form.roll_no,
        otp: otp.trim(),
      });

      if (data.pendingVerification) {
        setPendingNotice(
          data.message ||
            'Email verified successfully! Because you registered with a personal email, your account is pending verification by the Institute before you can log in.'
        );
      } else {
        login(data.token, data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid or expired OTP code. Please check and try again.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    setOtpError('');
    setResendNotice('');
    setResending(true);
    try {
      const { data } = await api.post('/auth/student/resend-otp', {
        studentId,
        email: form.email,
        roll_no: form.roll_no,
      });
      if (data.otpDevCode) {
        setDevOtp(data.otpDevCode);
        setOtp(data.otpDevCode);
      }
      setResendNotice(data.message || 'A fresh 6-digit verification code has been dispatched.');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to resend OTP. Please wait before trying again.');
    } finally {
      setResending(false);
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
            <strong>Note:</strong> Students using an official <code className="bg-white px-1 rounded">@pmec.ac.in</code> email (e.g. <code>2301109307_cse@pmec.ac.in</code>) are activated instantly upon OTP verification. Personal email registrations are reviewed by the Examination Cell or Academic Dean.
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
          <Link to="/" className="inline-block mb-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#f5b400] flex items-center justify-center shadow">
              <svg className="w-7 h-7 text-[#0a1e3d]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-xl font-extrabold text-[#0f2a52]">
            {otpStep ? 'Verify Registration OTP' : 'Create Student Account'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {otpStep
              ? 'Complete email verification to activate your account'
              : 'Register to submit and track PMEC service requests.'}
          </p>
        </div>

        {otpStep ? (
          <div>
            <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-4 mb-5 text-xs">
              <div className="font-bold mb-1.5 flex items-center gap-1.5 text-blue-950 text-sm">
                <span>📱✉️</span> Two-Channel OTP Verification (Email & Mobile SMS)
              </div>
              <p className="leading-relaxed">{otpMessage}</p>
              <div className="mt-2 space-y-1 text-slate-700 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-blue-200">
                <p><strong>Email Address:</strong> {form.email}</p>
                <p><strong>Mobile (SMS):</strong> {form.phone}</p>
                <p><strong>College Reg No:</strong> {form.roll_no}</p>
              </div>
            </div>

            {otpError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 leading-relaxed">
                {otpError}
              </div>
            )}

            {resendNotice && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 leading-relaxed">
                {resendNotice}
              </div>
            )}

            {devOtp && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 mb-4 text-emerald-900 text-xs flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-950">
                    <span>🔑</span> Your 6-Digit OTP Code:
                  </span>
                  <span className="text-base font-mono font-extrabold tracking-widest bg-white border border-emerald-300 px-2.5 py-0.5 rounded text-emerald-700 shadow-inner">
                    {devOtp}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1 border-t border-emerald-200">
                  <span>Dispatched to your Email & Mobile Number</span>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtp)}
                    className="font-bold underline hover:text-emerald-950"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Enter 6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="------"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-mono tracking-[0.4em] border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
                />
                <p className="text-[11px] text-slate-400 text-center mt-1">
                  Code expires in 5 minutes (5 wrong attempts limit)
                </p>
              </div>

              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                className="w-full bg-[#0f2a52] hover:bg-[#1a3a69] text-white rounded-lg py-2.5 text-sm font-bold shadow transition disabled:opacity-50"
              >
                {otpLoading ? 'Verifying OTP...' : 'Verify OTP & Complete Registration'}
              </button>
            </form>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setOtp('');
                  setOtpError('');
                  setResendNotice('');
                }}
                className="text-slate-500 hover:text-slate-800"
              >
                ← Back to Edit Details
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-[#0f2a52] font-semibold hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-1">
                <label className="block font-semibold text-slate-700 mb-1">
                  College Registration Number *
                </label>
                <input
                  placeholder="e.g. 2301109307"
                  required
                  value={form.roll_no}
                  onChange={(e) => update('roll_no', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
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
                <label className="block font-semibold text-slate-700 mb-1">College Email Address *</label>
                <input
                  placeholder="e.g. 2301109307_cse@pmec.ac.in"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Format: <code>2301109307_cse@pmec.ac.in</code>. Official emails activate immediately upon OTP verification.
                </span>
              </div>

              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number (for SMS OTP) *</label>
                <input
                  placeholder="e.g. 9800000005"
                  required
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  A 6-digit registration OTP code will be sent to both your email and mobile number.
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
                {loading ? 'Creating account...' : 'Create Account & Send OTP'}
              </button>
            </form>

            <p className="text-xs text-center text-slate-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0f2a52] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
