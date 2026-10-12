import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentTypes, getMyDocuments, uploadDocument, deleteDocument, viewDocument } from '../../services/documentService';
import Alert from '../../components/Alert';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

const REQUIRED_TYPES = ['CV', 'GRADE_8', 'GRADE_12', 'DEGREE'];

export default function ApplicationDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [deleting, setDeleting] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getMyDocuments()
      .then(res => setDocuments(res.documents || res.data || {}))
      .catch(err => setError(err.message || 'Unable to load documents.'))
      .finally(() => setLoading(false));
  }, []);

  const completed = useMemo(
    () => REQUIRED_TYPES.filter(type => documents[type]).length,
    [documents]
  );

  async function handleUpload(type, file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5 MB.');
      return;
    }
    setUploading(type);
    setError('');
    setMessage('');
    try {
      const endpoint = documentTypes.find(item => item.type === type).endpoint;
      await uploadDocument(endpoint, file);
      setMessage(`${type} uploaded successfully.`);
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading('');
    }
  }

  async function loadDocuments() {
    const res = await getMyDocuments();
    setDocuments(res.documents || res.data || {});
  }

  async function handleDelete(document) {
    setDeleting(document.document_id || document.document_type);
    setError('');
    try {
      await deleteDocument(document.document_id);
      setMessage('Document deleted successfully.');
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Delete failed.');
    } finally {
      setDeleting('');
    }
  }

  async function handleView(document) {
    try {
      const response = await viewDocument(document.document_id);
      if (!response.ok) throw new Error('Unable to view the document.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      setError(err.message || 'Unable to view the document.');
    }
  }

  return (
    <div>
      <button type="button" onClick={() => navigate(-1)} className="button-link">← Back</button>
      <div className="page-header">
        <h1 className="page-title">Application Documents</h1>
        <p className="page-subtitle">Upload and manage the documents required for job applications.</p>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 4 }}>Application readiness</h2>
            <p style={{ color: 'var(--color-gray-500)', margin: 0 }}>Documents completed: {completed}/{REQUIRED_TYPES.length}</p>
          </div>
          <div className="badge badge-primary">{completed === REQUIRED_TYPES.length ? 'Ready to apply' : 'Incomplete'}</div>
        </div>
        <div style={{ height: 8, background: 'var(--color-gray-100)', borderRadius: 4, marginTop: 'var(--space-4)', overflow: 'hidden' }}>
          <div style={{ width: `${completed / REQUIRED_TYPES.length * 100}%`, height: '100%', background: 'var(--color-primary)' }} />
        </div>
        {completed < REQUIRED_TYPES.length && (
          <p style={{ color: 'var(--color-warning)', marginTop: 'var(--space-3)' }}>
            Please upload the missing documents before submitting an application.
          </p>
        )}
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}
      {message && <Alert type="success" onClose={() => setMessage('')}>{message}</Alert>}

      {loading ? <Spinner size="lg" /> : (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {documentTypes.map(item => {
            const document = documents[item.type];
            return (
              <section className="card" key={item.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--font-size-base)', marginBottom: 4 }}>{item.label}</h2>
                    <p style={{ color: 'var(--color-gray-500)', margin: 0 }}>Required · Accepted: {item.accepted} · Maximum 5 MB</p>
                  </div>
                  {document && <span className="badge badge-success">✓ Uploaded</span>}
                </div>

                {document ? (
                  <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-gray-100)', borderRadius: 4 }}>
                    <strong style={{ display: 'block', wordBreak: 'break-all' }}>{document.file_name}</strong>
                    <span style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                      {Math.max(1, Math.round(document.file_size / 1024))} KB · {document.mime_type}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                      <Button variant="secondary" size="sm" onClick={() => handleView(document)}>View</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(document)} loading={deleting === document.document_id}>Delete</Button>
                    </div>
                  </div>
                ) : (
                  <label className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                    <span className="form-label">Upload document</span>
                    <input
                      className="form-input"
                      type="file"
                      accept={item.mime}
                      onChange={event => handleUpload(item.type, event.target.files?.[0])}
                      disabled={uploading === item.type}
                    />
                    {uploading === item.type && <Spinner size="sm" />}
                  </label>
                )}
                {document && (
                  <label className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                    <span className="form-label">Replace document</span>
                    <input
                      className="form-input"
                      type="file"
                      accept={item.mime}
                      onChange={event => handleUpload(item.type, event.target.files?.[0])}
                      disabled={uploading === item.type}
                    />
                  </label>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
