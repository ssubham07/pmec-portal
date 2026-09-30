import React from 'react';

const STYLES = {
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  under_review: 'bg-blue-100 text-blue-800 border-blue-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  forwarded: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-300';
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}
