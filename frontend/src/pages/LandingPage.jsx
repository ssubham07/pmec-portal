import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [odiaLang, setOdiaLang] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // 'small', 'normal', 'large'

  const fontClass =
    fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';

  const services = [
    {
      type: 'semester_registration',
      title: 'Semester Registration',
      description: 'Register for your upcoming semester online.',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
        </svg>
      ),
    },
    {
      type: 'internal_mark_correction',
      title: 'Internal Mark Correction',
      description: 'Request a review of internal assessment marks.',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </svg>
      ),
    },
    {
      type: 'back_paper',
      title: 'Back Paper',
      description: 'Apply for a back paper examination by subject.',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
        </svg>
      ),
    },
    {
      type: 'revaluation',
      title: 'Revaluation',
      description: 'Request revaluation of an answer script.',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      type: 'exam_grievance',
      title: 'Exam Grievance',
      description: 'Raise and track a formal examination grievance.',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" />
        </svg>
      ),
    },
    {
      type: 'bonafide_certificate',
      title: 'Bonafide Certificate',
      description: 'Get an e-signed bonafide certificate as a PDF.',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      type: 'scholarship_verification',
      title: 'Scholarship Verification',
      description: 'Get your scheme documents verified by the institute.',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
        </svg>
      ),
    },
    {
      type: 'track',
      title: 'Track Any Request',
      description: 'Follow every status update on a live timeline.',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
        </svg>
      ),
    },
  ];

  function handleActionClick(targetType) {
    if (!user) {
      navigate('/login?redirect=/requests/new');
      return;
    }
    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }
    if (targetType === 'track') {
      navigate('/dashboard');
    } else {
      navigate('/requests/new');
    }
  }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${fontClass}`}>
      {/* 1. Top Accessibility Bar */}
      <div className="bg-[#08172e] text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-6">
          {/* Language Toggle */}
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide text-white">ODIA</span>
            <button
              onClick={() => setOdiaLang(!odiaLang)}
              className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                odiaLang ? 'bg-[#f5b400]' : 'bg-slate-600'
              }`}
            >
              <div
                className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                  odiaLang ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Font Sizing Buttons */}
          <div className="flex items-center gap-1.5 font-bold">
            <button
              onClick={() => setFontSize('small')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-700 ${
                fontSize === 'small' ? 'text-[#f5b400]' : 'text-slate-300'
              }`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('normal')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-700 ${
                fontSize === 'normal' ? 'text-[#f5b400]' : 'text-slate-300'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-700 ${
                fontSize === 'large' ? 'text-[#f5b400]' : 'text-slate-300'
              }`}
            >
              A+
            </button>
          </div>

          {/* Screen Reader Link */}
          <button className="hover:text-white transition">Screen Reader</button>
        </div>
      </div>

      {/* 2. Main Letterhead Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Logo & Institute Branding */}
          <Link to="/" className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#f5b400] flex items-center justify-center shadow-sm shrink-0 border-2 border-amber-400">
              <svg className="w-7 h-7 text-[#0a1e3d]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#0f2a52] leading-tight tracking-tight">
                PMEC Student Service Request Portal
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Parala Maharaja Engineering College, Berhampur · Govt. of Odisha
              </p>
            </div>
          </Link>

          {/* Nav links & Login Dropdown */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
              <a href="#services" className="hover:text-[#0f2a52] transition">
                Services
              </a>
              <a href="#how-it-works" className="hover:text-[#0f2a52] transition">
                How to Apply
              </a>
              <a href="#contact" className="hover:text-[#0f2a52] transition">
                Contact Us
              </a>
            </nav>

            {user ? (
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                className="bg-[#2d7dd2] hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  className="bg-[#2d7dd2] hover:bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg text-sm shadow flex items-center gap-1.5 transition"
                >
                  <span>Login</span>
                  <span className="text-xs">▼</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in">
                    <Link
                      to="/login?role=student"
                      className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-blue-50 font-medium hover:text-[#0f2a52]"
                    >
                      🎓 Student Login
                    </Link>
                    <Link
                      to="/login?role=admin"
                      className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-blue-50 font-medium hover:text-[#0f2a52]"
                    >
                      🏛️ Institute Login
                    </Link>
                    <hr className="my-1 border-slate-100" />
                    <Link
                      to="/register"
                      className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-blue-50 font-medium hover:text-[#0f2a52]"
                    >
                      📝 Register Account
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="bg-[#0a1e3d] text-white pt-14 pb-20 px-4 sm:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-tight tracking-tight">
              Empowering <span className="text-[#f5b400]">Requests</span>,<br />
              Enabling <span className="text-[#f5b400]">Approvals</span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              One portal for every PMEC student service — semester registration, mark correction,
              back paper, revaluation, exam grievance, bonafide certificate and scholarship
              verification — reviewed and e-signed by the institute.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => handleActionClick('bonafide_certificate')}
                className="bg-[#f5b400] hover:bg-[#e0a400] text-slate-950 font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 text-sm"
              >
                <span>Apply for a Service</span>
                <span>→</span>
              </button>

              <button
                onClick={() => handleActionClick('track')}
                className="bg-[#132d54] hover:bg-[#1a3a69] text-white border border-[#2a4d7a] font-semibold px-6 py-3 rounded-lg shadow-sm transition text-sm"
              >
                Track My Request
              </button>
            </div>
          </div>

          {/* Right Hero Graphic */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-[#0d274f] to-[#173a72] p-8 flex items-center justify-center relative shadow-2xl border border-blue-900/50">
              {/* Chevron side badge */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#2d7dd2] text-white flex items-center justify-center shadow-lg font-bold text-sm">
                ^
              </div>

              {/* Stylized Document Card */}
              <div className="w-48 h-56 bg-white rounded-2xl shadow-2xl p-5 relative flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-16 h-3 bg-blue-300 rounded-full" />
                  <div className="w-32 h-2.5 bg-blue-100 rounded-full" />
                  <div className="w-28 h-2.5 bg-blue-100 rounded-full" />
                  <div className="w-36 h-2.5 bg-blue-100 rounded-full" />
                  <div className="w-20 h-2.5 bg-blue-100 rounded-full" />
                </div>

                {/* Stamped checkmark badge */}
                <div className="self-end w-11 h-11 rounded-full bg-[#f5b400] text-[#0a1e3d] flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Four Metric Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5 text-left">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">7</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Service types supported</div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5 text-left">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">2-5</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Avg. working days to resolve</div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5 text-left">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">100%</div>
            <div className="text-xs text-slate-500 font-medium mt-1">E-signed approvals</div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5 text-left">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">24×7</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Status tracking online</div>
          </div>
        </div>
      </section>

      {/* 5. Services You Can Apply For Section */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-12">
        <div className="mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Services You Can Apply For
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            One adaptive form — the fields change automatically based on what you select.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((svc) => (
            <div
              key={svc.title}
              onClick={() => handleActionClick(svc.type)}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {svc.icon}
                </div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition">
                  {svc.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {svc.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How It Works
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            From submission to a signed, downloadable result.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#0a1e3d] text-white font-bold flex items-center justify-center text-sm mb-4">
              1
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1.5">Login or Register</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Students log in with their official @pmec.ac.in email. Personal email? Institute
              verifies you first.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#0a1e3d] text-white font-bold flex items-center justify-center text-sm mb-4">
              2
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1.5">Submit Your Request</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pick a service, fill the adaptive form, attach supporting documents, and submit.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#0a1e3d] text-white font-bold flex items-center justify-center text-sm mb-4">
              3
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1.5">Institute Reviews & E-Signs</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              An institute officer reviews, adds remarks, and approves with their e-signature.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Scrolling Announcements Ticker Bar */}
      <section className="bg-[#0c234b] text-white mt-12 overflow-hidden flex items-center border-t border-b border-blue-900">
        <div className="bg-[#f5b400] text-slate-950 font-bold px-4 py-2.5 flex items-center gap-2 shrink-0 z-10 text-xs tracking-wider uppercase">
          <span>📢</span>
          <span>ANNOUNCEMENTS</span>
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap py-2 px-4 text-xs font-medium text-slate-200">
          <div className="inline-block animate-marquee pl-4">
            Semester registration window open for Odd Semester 2026-27 • Institute e-signature setup
            now mandatory before approvals • Download signed bonafide certificates directly from
            your student dashboard
          </div>
        </div>
      </section>

      {/* 8. Letterhead Footer */}
      <footer id="contact" className="bg-[#08172e] text-white py-8 px-4 text-center border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-1.5">
          <p className="font-bold text-sm text-slate-200">
            PMEC Student Service Request Portal
          </p>
          <p className="text-xs text-slate-400">
            Parala Maharaja Engineering College, Sitalapalli, Berhampur, Ganjam, Odisha – 761003
          </p>
          <p className="text-xs text-slate-500">
            An Autonomous Government Engineering College affiliated to BPUT, Odisha · pmec.ac.in
          </p>
        </div>
      </footer>
    </div>
  );
}
