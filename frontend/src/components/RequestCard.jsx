import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const TYPE_LABELS = {
  semester_registration: 'Semester Registration',
  internal_mark_correction: 'Internal Mark Correction',
  back_paper: 'Back Paper',
  revaluation: 'Revaluation',
  exam_grievance: 'Exam Grievance',
  bonafide_certificate: 'Bonafide Certificate',
  scholarship_verification: 'Scholarship Verification',
};

export default function RequestCard({ request, to }) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800">{TYPE_LABELS[request.type] || request.type}</p>
          <p className="text-xs text-slate-500 mt-1">Request #{request.id}</p>
          {request.student_name && (
            <p className="text-xs text-slate-500">{request.student_name} ({request.roll_no})</p>
          )}
        </div>
        <StatusBadge status={request.status} />
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Submitted {new Date(request.submitted_at).toLocaleString('en-IN')}
      </p>
    </Link>
  );
}
