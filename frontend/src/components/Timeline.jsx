import React from 'react';
import { FILE_BASE_URL } from '../api/axios';

const ACTION_COLORS = {
  submitted: 'bg-yellow-500',
  reviewed: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  forwarded: 'bg-purple-500',
};

export default function Timeline({ entries }) {
  if (!entries || !entries.length) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }

  return (
    <ol className="relative border-l-2 border-slate-200 ml-2">
      {entries.map((e) => (
        <li key={e.id} className="mb-6 ml-4">
          <span
            className={`absolute w-3 h-3 rounded-full -left-[7px] border-2 border-white ${ACTION_COLORS[e.action] || 'bg-slate-400'}`}
          />
          <p className="text-sm font-semibold text-slate-800 capitalize">{e.action}</p>
          <p className="text-xs text-slate-500 mb-1">
            {new Date(e.timestamp).toLocaleString('en-IN')}
            {e.admin_name ? ` · ${e.admin_name} (${e.admin_role})` : ' · Student'}
          </p>
          {e.comment && <p className="text-sm text-slate-600">{e.comment}</p>}
          {e.signature_url && (
            <div className="mt-2">
              <p className="text-xs text-slate-400 mb-1">E-signed:</p>
              <img
                src={`${FILE_BASE_URL}${e.signature_url}`}
                alt="Admin e-signature"
                className="h-10 border border-slate-200 rounded bg-white p-1"
              />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
