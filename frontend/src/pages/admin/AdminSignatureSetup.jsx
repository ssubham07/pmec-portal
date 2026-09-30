import React, { useState } from 'react';
import api, { FILE_BASE_URL } from '../../api/axios';
import SignaturePad from '../../components/SignaturePad';
import { useAuth } from '../../context/AuthContext';

export default function AdminSignatureSetup() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSaveDrawn(dataUrl) {
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.post('/admin/signature/draw', { dataUrl });
      setUser((u) => ({ ...u, signature_url: data.admin.signature_url }));
      setMessage('Signature saved successfully.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save signature.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFile(file) {
    setSaving(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('signature', file);
      const { data } = await api.post('/admin/signature/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser((u) => ({ ...u, signature_url: data.admin.signature_url }));
      setMessage('Signature uploaded successfully.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to upload signature.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">E-Signature Setup</h1>
      <p className="text-sm text-slate-500 mb-6">
        This signature is stamped on every certificate and approval memo you sign off on. You can update it any time.
      </p>

      {user?.signature_url && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <p className="text-xs text-slate-400 uppercase mb-2">Current signature on file</p>
          <img src={`${FILE_BASE_URL}${user.signature_url}`} alt="Current signature" className="h-16 border border-slate-200 rounded bg-white p-2" />
        </div>
      )}

      {message && <p className="text-sm bg-blue-50 border border-blue-200 text-blue-800 rounded p-2 mb-4">{message}</p>}

      <SignaturePad onSaveDrawn={handleSaveDrawn} onSaveFile={handleSaveFile} saving={saving} />
    </div>
  );
}
