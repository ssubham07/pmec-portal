import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

// Drives the adaptive form: each request type declares its own extra fields
// (stored server-side in requests.details JSONB) and whether a supporting
// document is expected.
const REQUEST_TYPES = [
  {
    value: 'semester_registration',
    label: 'Semester Registration',
    fields: [{ name: 'semester_to_register', label: 'Semester to Register', type: 'number', required: true }],
  },
  {
    value: 'internal_mark_correction',
    label: 'Internal Mark Correction',
    fields: [
      { name: 'subject_code', label: 'Subject Code', type: 'text', required: true },
      { name: 'subject_name', label: 'Subject Name', type: 'text', required: true },
      { name: 'current_marks', label: 'Current Marks Awarded', type: 'number', required: false },
      { name: 'expected_marks', label: 'Expected Marks', type: 'number', required: false },
    ],
  },
  {
    value: 'back_paper',
    label: 'Back Paper',
    fields: [
      { name: 'subject_code', label: 'Subject Code', type: 'text', required: true },
      { name: 'semester', label: 'Semester', type: 'number', required: true },
    ],
    requiresDocument: true,
    docLabel: 'Previous mark sheet (optional)',
  },
  {
    value: 'revaluation',
    label: 'Revaluation',
    fields: [
      { name: 'subject_code', label: 'Subject Code', type: 'text', required: true },
      { name: 'semester', label: 'Semester', type: 'number', required: true },
    ],
  },
  {
    value: 'exam_grievance',
    label: 'Exam Grievance',
    fields: [
      { name: 'subject_code', label: 'Subject Code', type: 'text', required: true },
      { name: 'description', label: 'Describe the grievance', type: 'textarea', required: true },
    ],
  },
  {
    value: 'bonafide_certificate',
    label: 'Bonafide Certificate',
    fields: [{ name: 'purpose', label: 'Purpose (e.g. Bank loan, Passport)', type: 'text', required: true }],
  },
  {
    value: 'scholarship_verification',
    label: 'Scholarship Verification',
    fields: [{ name: 'scheme_name', label: 'Scholarship Scheme Name', type: 'text', required: true }],
    requiresDocument: true,
    docLabel: 'Supporting document (income certificate, scheme proof, etc.)',
    documentRequired: true,
  },
];

export default function NewRequest() {
  const [type, setType] = useState(REQUEST_TYPES[0].value);
  const [details, setDetails] = useState({});
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const config = REQUEST_TYPES.find((t) => t.value === type);

  function handleTypeChange(newType) {
    setType(newType);
    setDetails({});
    setFile(null);
    setError('');
  }

  function updateField(name, value) {
    setDetails((d) => ({ ...d, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (config.documentRequired && !file) {
      setError(`Please attach a document: ${config.docLabel}`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('details', JSON.stringify(details));
      if (file) formData.append('documents', file);

      const { data } = await api.post('/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/requests/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">New Service Request</h1>
      <p className="text-sm text-slate-500 mb-6">Choose a request type — the form adapts to what's needed.</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">Request Type</label>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-5"
        >
          {REQUEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  required={f.required}
                  rows={4}
                  value={details[f.name] || ''}
                  onChange={(e) => updateField(f.name, e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              ) : (
                <input
                  type={f.type}
                  required={f.required}
                  value={details[f.name] || ''}
                  onChange={(e) => updateField(f.name, e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}

          {config.requiresDocument && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {config.docLabel} {config.documentRequired && <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files[0])}
                className="text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-pmec-blue text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
