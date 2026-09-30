import React, { useEffect, useState } from 'react';
import api, { FILE_BASE_URL } from '../../api/axios';
import RequestCard from '../../components/RequestCard';
import { useAuth } from '../../context/AuthContext';

const TYPES = [
  'semester_registration',
  'internal_mark_correction',
  'back_paper',
  'revaluation',
  'exam_grievance',
  'bonafide_certificate',
  'scholarship_verification',
];
const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'forwarded'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'verify_students'
  const [requests, setRequests] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [filters, setFilters] = useState({ status: 'submitted', type: '', department: '' });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab]);

  function loadData() {
    setLoading(true);
    if (activeTab === 'requests') {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.department) params.department = filters.department;

      api
        .get('/admin/requests', { params })
        .then((res) => setRequests(res.data))
        .finally(() => setLoading(false));
    } else {
      api
        .get('/admin/students/pending')
        .then((res) => setPendingStudents(res.data))
        .finally(() => setLoading(false));
    }
  }

  // Also prefetch pending student count
  useEffect(() => {
    api.get('/admin/students/pending').then((res) => setPendingStudents(res.data)).catch(() => {});
  }, []);

  async function handleVerifyStudent(studentId) {
    setVerifyingId(studentId);
    setVerifyMessage('');
    try {
      const res = await api.post(`/admin/students/${studentId}/verify`);
      setVerifyMessage(res.data.message || 'Student verified successfully.');
      setPendingStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      setVerifyMessage(err.response?.data?.error || 'Failed to verify student.');
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleRejectStudent(studentId) {
    if (!window.confirm('Are you sure you want to reject this student registration?')) return;
    setVerifyingId(studentId);
    setVerifyMessage('');
    try {
      const res = await api.post(`/admin/students/${studentId}/reject`);
      setVerifyMessage(res.data.message || 'Student registration rejected.');
      setPendingStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      setVerifyMessage(err.response?.data?.error || 'Failed to reject student.');
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Institute Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">Parala Maharaja Engineering College</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-200/80 rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'requests'
                ? 'bg-[#0f2a52] text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Service Requests Queue
          </button>
          <button
            onClick={() => setActiveTab('verify_students')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'verify_students'
                ? 'bg-[#0f2a52] text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>👤 Verify Students</span>
            {pendingStudents.length > 0 && (
              <span className="bg-[#f5b400] text-slate-950 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full">
                {pendingStudents.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {!user?.signature_url && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-lg p-3.5 mb-6 flex items-center justify-between">
          <div>
            <strong>Action Required:</strong> You haven't set up your e-signature yet. You'll need it before approving any request.
          </div>
          <a
            href="/admin/signature"
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition shrink-0 ml-3"
          >
            Set Up E-Signature
          </a>
        </div>
      )}

      {/* TAB 1: SERVICE REQUESTS QUEUE */}
      {activeTab === 'requests' && (
        <>
          <div className="flex flex-wrap gap-3 mb-6 text-xs">
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <input
              placeholder="Filter by department"
              value={filters.department}
              onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
            />
          </div>

          {loading ? (
            <p className="text-slate-500 text-sm">Loading queue...</p>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 text-sm">
              No service requests match these filters.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((r) => (
                <RequestCard key={r.id} request={r} to={`/admin/requests/${r.id}`} />
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: VERIFY STUDENTS QUEUE */}
      {activeTab === 'verify_students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Students Pending Institutional Verification
              </h2>
              <p className="text-xs text-slate-500">
                These students registered using personal emails and require verification before they can sign in.
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                api.get('/admin/students/pending').then((res) => setPendingStudents(res.data)).finally(() => setLoading(false));
              }}
              className="text-xs text-[#0f2a52] font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>

          {verifyMessage && (
            <div className="p-3 bg-blue-50 border-b border-blue-200 text-xs text-blue-800 font-medium">
              {verifyMessage}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading pending students...</div>
          ) : pendingStudents.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              <div className="text-2xl mb-1">🎉</div>
              No students are currently pending verification. All student accounts are active.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">College Reg No.</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Registered Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">ID Card</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pendingStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-[#0f2a52]">{s.roll_no}</td>
                      <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="p-3">{s.department}</td>
                      <td className="p-3">Sem {s.semester}</td>
                      <td className="p-3">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                          {s.email}
                        </span>
                      </td>
                      <td className="p-3">{s.phone || '—'}</td>
                      <td className="p-3">
                        {s.id_card_url ? (
                          <a
                            href={`${FILE_BASE_URL}${s.id_card_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold underline"
                          >
                            <span>🪪</span> View ID Card ↗
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleVerifyStudent(s.id)}
                            disabled={verifyingId === s.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition disabled:opacity-50"
                          >
                            {verifyingId === s.id ? 'Verifying...' : 'Verify'}
                          </button>
                          <button
                            onClick={() => handleRejectStudent(s.id)}
                            disabled={verifyingId === s.id}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
