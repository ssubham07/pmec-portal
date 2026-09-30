import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import RequestCard from '../../components/RequestCard';

export default function StudentDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/requests/mine').then((res) => setRequests(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const counts = requests.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Requests</h1>
          <p className="text-sm text-slate-500">Track the status of every service request you've submitted.</p>
        </div>
        <Link to="/requests/new" className="bg-pmec-blue text-white text-sm px-4 py-2 rounded-lg font-medium">
          + New Request
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'submitted', 'under_review', 'approved', 'rejected', 'forwarded'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              filter === s ? 'bg-pmec-blue text-white border-pmec-blue' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')} {s !== 'all' && counts[s] ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No requests here yet. <Link to="/requests/new" className="text-pmec-blue underline">Submit one now</Link>.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <RequestCard key={r.id} request={r} to={`/requests/${r.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
