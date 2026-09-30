import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';

export default function RequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/requests/${id}`).then((res) => setRequest(res.data)).finally(() => setLoading(false));
  }, [id]);

  async function downloadCertificate() {
    setDownloading(true);
    try {
      const res = await api.get(`/requests/${id}/certificate`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${request.certificate?.certificate_no || 'certificate'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Could not download certificate.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;
  if (!request) return <div className="p-10 text-center text-slate-500">Request not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/dashboard" className="text-sm text-pmec-blue hover:underline">&larr; Back to dashboard</Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 capitalize">{request.type.replace(/_/g, ' ')}</h1>
            <p className="text-sm text-slate-500">Request #{request.id}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm mb-5">
          {Object.entries(request.details || {}).map(([k, v]) => (
            <div key={k}>
              <p className="text-slate-400 text-xs uppercase">{k.replace(/_/g, ' ')}</p>
              <p className="text-slate-700">{String(v)}</p>
            </div>
          ))}
        </div>

        {request.remarks && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm mb-5">
            <p className="text-xs text-slate-400 uppercase mb-1">Latest Remarks</p>
            <p className="text-slate-700">{request.remarks}</p>
          </div>
        )}

        {request.documents?.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-slate-400 uppercase mb-2">Supporting Documents</p>
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

        {request.status === 'approved' && request.certificate && (
          <button
            onClick={downloadCertificate}
            disabled={downloading}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg font-medium mb-6 disabled:opacity-50"
          >
            {downloading ? 'Preparing...' : `Download Certificate (${request.certificate.certificate_no})`}
          </button>
        )}

        <h2 className="text-sm font-semibold text-slate-700 mb-3">Status Timeline</h2>
        <Timeline entries={request.timeline} />
      </div>
    </div>
  );
}
