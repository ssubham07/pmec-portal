import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-[#0f2a52] text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-[#f5b400] flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-[#0a1e3d]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight block leading-tight">
              PMEC Service Portal
            </span>
            <span className="text-[10px] text-slate-300 block font-normal leading-tight">
              Parala Maharaja Engineering College
            </span>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-4 text-xs font-medium">
            {user.role === 'student' && (
              <>
                <Link to="/dashboard" className="hover:text-[#f5b400] transition">
                  Dashboard
                </Link>
                <Link to="/requests/new" className="hover:text-[#f5b400] transition">
                  New Request
                </Link>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <Link to="/admin" className="hover:text-[#f5b400] transition">
                  Queue & Verify
                </Link>
                <Link to="/admin/signature" className="hover:text-[#f5b400] transition">
                  E-Signature
                </Link>
              </>
            )}

            <div className="hidden sm:flex items-center gap-2 border-l border-slate-700 pl-3">
              <span className="text-slate-300">{user.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f5b400] text-slate-950 uppercase tracking-wide">
                {user.role === 'admin' ? (user.office_role?.replace('_', ' ') || 'Institute') : 'Student'}
              </span>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs">
            <Link to="/login" className="hover:text-[#f5b400] transition font-medium">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-[#f5b400] text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow hover:bg-[#e0a400] transition"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
