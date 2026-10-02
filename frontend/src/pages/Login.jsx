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
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedInstituteRole, setSelectedInstituteRole] = useState('principal');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get('role');
    if (r === 'admin' || r === 'institute') {
      setRole('admin');
      setEmail('principal@pmec.ac.in');
    } else if (r === 'student') {
      setRole('student');
      setEmail('2301109307_cse@pmec.ac.in');
    } else {
      setEmail('2301109307_cse@pmec.ac.in');
    }
  }, [location.search]);

  async function performLogin(targetRole, targetEmail, targetPass) {
    setError('');
    setLoading(true);
    try {
      const endpoint = targetRole === 'student' ? '/auth/student/login' : '/auth/admin/login';
      const { data } = await api.post(endpoint, {
        email: targetEmail.trim(),
        password: targetPass,
      });

      login(data.token, data.user);
      navigate(targetRole === 'student' ? '/dashboard' : '/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    performLogin(role, email, password);
  }

  function selectInstituteAccount(accType) {
    setSelectedInstituteRole(accType);
    setError('');
    let mail = 'principal@pmec.ac.in';
    if (accType === 'principal') mail = 'principal@pmec.ac.in';
    if (accType === 'dsw') mail = 'dsw@pmec.ac.in';
    if (accType === 'scholarship') mail = 'scholarship@pmec.ac.in';
    if (accType === 'examcell') mail = 'examcell@pmec.ac.in';
    if (accType === 'academic') mail = 'academic@pmec.ac.in';

    setEmail(mail);
    setPassword('Password@123');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-lg border border-slate-200">
        
        {/* Header */}
        <div className="text-center mb-5">
          <Link to="/" className="inline-block mb-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#f5b400] flex items-center justify-center shadow">
              <svg className="w-7 h-7 text-[#0a1e3d]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-[#0f2a52]">
            {role === 'student' ? 'Student Portal Login' : 'Institute Portal Login'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Parala Maharaja Engineering College, Berhampur
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex mb-4 bg-slate-100 rounded-xl p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setEmail('2301109307_cse@pmec.ac.in');
              setPassword('Password@123');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              role === 'student' ? 'bg-[#0f2a52] text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎓</span> Student Login
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('admin');
              selectInstituteAccount('principal');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              role === 'admin' ? 'bg-[#0f2a52] text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🏛️</span> Institute Officers
          </button>
        </div>

        {/* Institute Roles Chips */}
        {role === 'admin' && (
          <div className="mb-4 bg-blue-50/60 border border-blue-100 rounded-xl p-3">
            <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>🏛️</span> Choose Institute Officer Role:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => selectInstituteAccount('principal')}
                className={`py-1.5 px-2 rounded-lg font-medium transition text-left border ${
                  selectedInstituteRole === 'principal'
                    ? 'bg-[#0f2a52] text-white border-[#0f2a52] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                }`}
              >
                👑 Principal
              </button>
              <button
                type="button"
                onClick={() => selectInstituteAccount('dsw')}
                className={`py-1.5 px-2 rounded-lg font-medium transition text-left border ${
                  selectedInstituteRole === 'dsw'
                    ? 'bg-[#0f2a52] text-white border-[#0f2a52] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                }`}
              >
                🎖️ DSW Officer
              </button>
              <button
                type="button"
                onClick={() => selectInstituteAccount('scholarship')}
                className={`py-1.5 px-2 rounded-lg font-medium transition text-left border ${
                  selectedInstituteRole === 'scholarship'
                    ? 'bg-[#0f2a52] text-white border-[#0f2a52] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                }`}
              >
                💰 Scholarship
              </button>
              <button
                type="button"
                onClick={() => selectInstituteAccount('examcell')}
                className={`py-1.5 px-2 rounded-lg font-medium transition text-left border ${
                  selectedInstituteRole === 'examcell'
                    ? 'bg-[#0f2a52] text-white border-[#0f2a52] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                }`}
              >
                📝 Exam Cell
              </button>
              <button
                type="button"
                onClick={() => selectInstituteAccount('academic')}
                className={`py-1.5 px-2 rounded-lg font-medium transition text-left border ${
                  selectedInstituteRole === 'academic'
                    ? 'bg-[#0f2a52] text-white border-[#0f2a52] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                }`}
              >
                📚 Academic Section
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 leading-relaxed flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {role === 'student' ? 'College Email Address / Reg No' : 'Officer Email Address'}
            </label>
            <input
              type="text"
              placeholder={role === 'student' ? '2301109307_cse@pmec.ac.in or 2301109307' : 'e.g. principal@pmec.ac.in'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <span className="text-[11px] text-slate-400">Default: Password@123</span>
            </div>
            <input
              type="password"
              placeholder="••••••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a52]"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f2a52] hover:bg-[#1a3a69] text-white rounded-lg py-2.5 text-sm font-bold shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <span>Sign In as {role === 'student' ? 'Student' : `${selectedInstituteRole.toUpperCase()} Officer`}</span>
              )}
            </button>
          </div>
        </form>

        {/* Quick Demo 1-Click Login Section */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2.5">
            ⚡ 1-Click Instant Demo Login (Zero Typing Needed)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={loading}
              onClick={() => performLogin('student', '2301109307_cse@pmec.ac.in', 'Password@123')}
              className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-semibold transition flex items-center justify-between shadow-sm"
            >
              <span>🎓 Student</span>
              <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded font-mono">2301109307</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => performLogin('admin', 'principal@pmec.ac.in', 'Password@123')}
              className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-900 rounded-xl font-semibold transition flex items-center justify-between shadow-sm"
            >
              <span>👑 Principal</span>
              <span className="text-[10px] bg-indigo-200 px-1.5 py-0.5 rounded font-mono">Full View</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => performLogin('admin', 'dsw@pmec.ac.in', 'Password@123')}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-semibold transition flex items-center justify-between shadow-sm"
            >
              <span>🎖️ DSW Officer</span>
              <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded font-mono">Bonafide/Welfare</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => performLogin('admin', 'scholarship@pmec.ac.in', 'Password@123')}
              className="py-2 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 rounded-xl font-semibold transition flex items-center justify-between shadow-sm"
            >
              <span>💰 Scholarship</span>
              <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded font-mono">Prerana/NSP</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => performLogin('admin', 'examcell@pmec.ac.in', 'Password@123')}
              className="py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 rounded-xl font-semibold transition flex items-center justify-between shadow-sm"
            >
              <span>📝 Exam Cell</span>
              <span className="text-[10px] bg-blue-200 px-1.5 py-0.5 rounded font-mono">Back Paper/Grievance</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => performLogin('admin', 'academic@pmec.ac.in', 'Password@123')}
              className="py-2 px-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-900 rounded-xl font-semibold transition flex items-center justify-between shadow-sm"
            >
              <span>📚 Academic Dean</span>
              <span className="text-[10px] bg-cyan-200 px-1.5 py-0.5 rounded font-mono">Sem Reg/Fees</span>
            </button>
          </div>
        </div>

        {role === 'student' && (
          <p className="text-xs text-center text-slate-500 mt-4">
            New student without an account?{' '}
            <Link to="/register" className="text-[#0f2a52] font-bold hover:underline">
              Create Account with OTP
            </Link>
          </p>
        )}

        <div className="text-center mt-3 pt-2 border-t border-slate-100">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← Back to PMEC Main Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
