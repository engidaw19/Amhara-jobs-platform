import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Modal, { ConfirmModal } from '../../components/Modal';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import { validateFieldValue } from '../../utils/validation';

const STATUS_OPTS = [
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted',  label: 'Shortlisted' },
  { value: 'interview',    label: 'Interview' },
  { value: 'accepted',     label: 'Accepted' },
  { value: 'rejected',     label: 'Rejected' },
];

const FILTER_OPTS = [{ value: '', label: 'All Statuses' }, { value: 'applied', label: 'Applied' }, ...STATUS_OPTS];

export default function BureauApplications() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [apps, setApps]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Update status modal
  const [selected, setSelected]   = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);

  // Confirm update
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  const load = useCallback(() => {
    if (!user?.bureau_id) { setLoading(false); return; }
    setLoading(true);
    api.getBureauApplications(user.bureau_id, { status: statusFilter || undefined })
      .then(res => setApps(res.applications || res.data || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [user, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function openUpdate(app) {
    setSelected(app);
    setNewStatus(app.status);
    setNote('');
  }

  async function handleUpdate() {
    if (!validateFieldValue(newStatus, { type: 'select', name: 'status', required: true, options: STATUS_OPTS }) ||
        !validateFieldValue(note, { type: 'textarea', name: 'note' })) {
      toastError('Please enter a valid status and note.');
      setConfirmUpdate(false);
      return;
    }
    setSaving(true);
    try {
      await api.updateAppStatus(selected.id, { status: newStatus, status_note: note });
      success('Application status updated.');
      setSelected(null);
      setConfirmUpdate(false);
      load();
    } catch (err) {
      toastError(err.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)',
          padding: 0, marginBottom: 'var(--space-4)',
        }}
      >
        ← Back
      </button>

      <div className="page-header">
        <h1 className="page-title">Applications</h1>
        <p className="page-subtitle">Review and manage applications for your bureau's jobs.</p>
      </div>

      <div style={{ marginBottom: 'var(--space-4)', maxWidth: 240 }}>
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {FILTER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : apps.length === 0 ? (
        <EmptyState icon="📋" title="No Applications" description="No applications match the current filter." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Applicant</th><th>Position</th><th>Applied</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td>
                      <p style={{ fontWeight: 500 }}>{a.applicant_name || a.full_name}</p>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>{a.applicant_email || a.email}</p>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>{a.job_title || a.title_en}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', whiteSpace: 'nowrap' }}>
                      {new Date(a.applied_at).toLocaleDateString()}
                    </td>
                    <td><StatusBadge status={a.status} type="application" /></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => openUpdate(a)}>
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Select new status modal */}
      <Modal
        open={!!selected && !confirmUpdate}
        onClose={() => setSelected(null)}
        title="Update Application Status"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (!validateFieldValue(newStatus, { type: 'select', name: 'status', required: true, options: STATUS_OPTS }) ||
                  !validateFieldValue(note, { type: 'textarea', name: 'note' })) {
                toastError('Please enter a valid status and note.');
                return;
              }
              setConfirmUpdate(true);
            }}>
              Review & Confirm
            </Button>
          </>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>Applicant</p>
              <p style={{ fontWeight: 600 }}>{selected.applicant_name || selected.full_name}</p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{selected.job_title}</p>
            </div>
            <FormField label="New Status" name="status" type="select" value={newStatus} onChange={e => setNewStatus(e.target.value)} options={STATUS_OPTS} />
            <FormField label="Note (optional)" name="note" type="textarea" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for status change…" />
          </div>
        )}
      </Modal>

      {/* Confirm status update */}
      <ConfirmModal
        open={confirmUpdate}
        onClose={() => setConfirmUpdate(false)}
        onConfirm={handleUpdate}
        loading={saving}
        title="Confirm Status Update"
        message={`Change status to "${STATUS_OPTS.find(o => o.value === newStatus)?.label || newStatus}" for ${selected?.applicant_name || selected?.full_name || 'this applicant'}? The applicant will be notified.`}
        confirmLabel="Yes, Update"
        confirmVariant="primary"
      />
    </div>
  );
}
