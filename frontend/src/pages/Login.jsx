import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  // Admin 2-step OTP verification state
  const [otpStep, setOtpStep] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get('role');
    if (r === 'admin' || r === 'institute') {
      setRole('admin');
    } else if (r === 'student') {
      setRole('student');
    }
    fetchCaptcha();
  }, [location.search]);

  async function fetchCaptcha() {
    setLoadingCaptcha(true);
    try {
      const res = await api.get('/auth/captcha');
      setCaptchaId(res.data.captchaId);
      setCaptchaSvg(res.data.svgUrl);
      setCaptchaInput('');
    } catch (e) {
      console.warn('Captcha load failed:', e);
    } finally {
      setLoadingCaptcha(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!captchaInput.trim()) {
      setError('Please enter the captcha characters shown.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === 'student' ? '/auth/student/login' : '/auth/admin/login';
      const { data } = await api.post(endpoint, {
        email,
        password,
        captchaInput,
        captchaId,
      });

      if (role === 'admin' && data.otpRequired) {
        setOtpStep(true);
        setAdminId(data.adminId);
        setOtpMessage(data.message || 'A 6-digit verification code has been emailed to your institutional email.');
        return;
      }

      login(data.token, data.user);
      navigate(role === 'student' ? '/dashboard' : '/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
      // Refresh captcha on failure
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setOtpError('');
    if (!otp.trim() || otp.trim().length !== 6) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/admin/verify-otp', {
        adminId,
        otp: otp.trim(),
      });
      login(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    setOtpError('');
    setResendNotice('');
    setResending(true);
    try {
      const { data } = await api.post('/auth/admin/resend-otp', { adminId });
      setResendNotice(data.message || 'A new 6-digit verification code has been dispatched.');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to resend OTP. Please wait before trying again.');
    } finally {
      setResending(false);
    }
  }

  function fillDemo(type) {
    setError('');
    if (type === 'student') {
      setRole('student');
      setEmail('ravi.sahoo@student.pmec.edu');
      setPassword('Password@123');
    } else {
      setRole('admin');
      setEmail('ashok.examcell@pmec.edu');
      setPassword('Password@123');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
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
            {otpStep ? 'Two-Step Verification' : role === 'student' ? 'Student Portal' : 'Institute Portal'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Parala Maharaja Engineering College</p>
        </div>

        {otpStep ? (
          <div>
            <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-4 mb-5 text-xs">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-blue-950">
                <span>🔐</span> Two-Step Officer Verification
              </div>
              <p>{otpMessage}</p>
              <p className="mt-1.5 text-slate-600 font-mono font-semibold">Account: {email}</p>
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
                <p className="text-[11px] text-slate-400 text-center mt-1">Code expires in 5 minutes (5 wrong attempts limit)</p>
              </div>

              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                className="w-full bg-[#0f2a52] hover:bg-[#1a3a69] text-white rounded-lg py-2.5 text-sm font-bold shadow transition disabled:opacity-50"
              >
                {otpLoading ? 'Verifying OTP...' : 'Verify OTP & Complete Sign In'}
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
                  fetchCaptcha();
                }}
                className="text-slate-500 hover:text-slate-800"
              >
                ← Back to Login
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
            {/* Role Switcher */}
            <div className="flex mb-5 bg-slate-100 rounded-xl p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-lg transition ${
                  role === 'student' ? 'bg-[#0f2a52] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎓 Student Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-lg transition ${
                  role === 'admin' ? 'bg-[#0f2a52] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏛️ Institute Login
              </button>
            </div>

            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 leading-relaxed">
                {error}
              </div>
            )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {role === 'student' ? 'Student Email' : 'Officer Email'}
            </label>
            <input
              type="email"
              placeholder={role === 'student' ? 'e.g. roll@student.pmec.edu' : 'e.g. officer@pmec.edu'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          {/* Captcha Authentication Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Security Captcha *
            </label>
            <div className="flex items-center gap-3">
              <div className="h-11 bg-white border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center p-1">
                {captchaSvg ? (
                  <img src={captchaSvg} alt="Captcha code" className="h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 px-4">Loading...</span>
                )}
              </div>
              <button
                type="button"
                onClick={fetchCaptcha}
                disabled={loadingCaptcha}
                title="Refresh Captcha"
                className="p-2 text-xs font-medium text-[#0f2a52] hover:bg-slate-200 rounded-lg border border-slate-200 transition"
              >
                ↻ Refresh
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter characters shown above"
              required
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0f2a52] hover:bg-[#1a3a69] text-white rounded-lg py-2.5 text-sm font-bold shadow transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : `Sign In as ${role === 'student' ? 'Student' : 'Institute Officer'}`}
          </button>
        </form>

        {/* Quick fill demo shortcuts */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase text-center mb-2">
            ⚡ Quick Demo Logins (Auto-Fills Credentials)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo('student')}
              className="flex-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition"
            >
              🎓 Student Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition"
            >
              🏛️ Institute Demo
            </button>
          </div>
        </div>

        {role === 'student' && (
          <p className="text-xs text-center text-slate-500 mt-4">
            New student?{' '}
            <Link to="/register" className="text-[#0f2a52] font-semibold hover:underline">
              Register here
            </Link>
          </p>
        )}

        <div className="text-center mt-3">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← Back to Public Portal
          </Link>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
