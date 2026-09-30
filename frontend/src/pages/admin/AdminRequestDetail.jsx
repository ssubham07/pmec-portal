import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import { useAuth } from '../../context/AuthContext';

export default function AdminRequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  function load() {
    setLoading(true);
    api.get(`/requests/${id}`).then((res) => setRequest(res.data)).finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function act(action) {
    setError('');
    if (!comment.trim()) {
      setError('A comment is required before you can approve, reject or forward a request.');
      return;
    }
    if (action === 'approve' && !user.signature_url) {
      setError('Set up your e-signature first (top menu → E-Signature) before approving requests.');
      return;
    }
    setActing(true);
    try {
      await api.post(`/admin/requests/${id}/action`, { action, comment });
      setComment('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.');
    } finally {
      setActing(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;
  if (!request) return <div className="p-10 text-center text-slate-500">Request not found.</div>;

  const isFinal = ['approved', 'rejected'].includes(request.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/admin" className="text-sm text-pmec-blue hover:underline">&larr; Back to queue</Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 capitalize">{request.type.replace(/_/g, ' ')}</h1>
            <p className="text-sm text-slate-500">Request #{request.id}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm mb-5 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div><p className="text-slate-400 text-xs uppercase">Student</p><p>{request.student_name}</p></div>
          <div><p className="text-slate-400 text-xs uppercase">Roll No.</p><p>{request.roll_no}</p></div>
          <div><p className="text-slate-400 text-xs uppercase">Department</p><p>{request.student_department}</p></div>
          <div><p className="text-slate-400 text-xs uppercase">Semester</p><p>{request.student_semester}</p></div>
          <div><p className="text-slate-400 text-xs uppercase">Email</p><p>{request.student_email}</p></div>
          <div><p className="text-slate-400 text-xs uppercase">Phone</p><p>{request.student_phone || '—'}</p></div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm mb-5">
          {Object.entries(request.details || {}).map(([k, v]) => (
            <div key={k}>
              <p className="text-slate-400 text-xs uppercase">{k.replace(/_/g, ' ')}</p>
              <p className="text-slate-700">{String(v)}</p>
            </div>
          ))}
        </div>

        {request.documents?.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-slate-400 uppercase mb-2">Uploaded Documents</p>
            <ul className="text-sm space-y-1">
              {request.documents.map((d) => (
                <li key={d.id}>
                  <a href={`${FILE_BASE_URL}${d.file_url}`} target="_blank" rel="noreferrer" className="text-pmec-blue hover:underline">
                    {d.doc_type}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isFinal && (
          <div className="border-t border-slate-200 pt-5 mb-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Take Action</h2>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-3">{error}</p>}
            <textarea
              placeholder="Comment (mandatory for every action)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3"
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => act('review')} disabled={acting} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50">
                Mark Under Review
              </button>
              <button onClick={() => act('approve')} disabled={acting} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white disabled:opacity-50">
                {acting ? 'Processing...' : 'Approve & E-Sign'}
              </button>
              <button onClick={() => act('reject')} disabled={acting} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white disabled:opacity-50">
                Reject
              </button>
              <button onClick={() => act('forward')} disabled={acting} className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white disabled:opacity-50">
                Forward
              </button>
            </div>
            {user?.signature_url && (
              <div className="mt-4">
                <p className="text-xs text-slate-400 mb-1">Approving will stamp this signature on file:</p>
                <img src={`${FILE_BASE_URL}${user.signature_url}`} alt="Your e-signature" className="h-12 border border-slate-200 rounded bg-white p-1" />
              </div>
            )}
          </div>
        )}

        <h2 className="text-sm font-semibold text-slate-700 mb-3">Audit Log</h2>
        <Timeline entries={request.timeline} />
      </div>
    </div>
  );
}
