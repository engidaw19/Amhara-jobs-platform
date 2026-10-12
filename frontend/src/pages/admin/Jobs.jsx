import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Modal, { ConfirmModal } from '../../components/Modal';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import Pagination from '../../components/Pagination';
import { validateFieldValue } from '../../utils/validation';

const PAGE_SIZE = 20;

export default function AdminJobs() {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState('pending');

  // Approve/reject selection
  const [selected, setSelected] = useState(null);
  const [action, setAction]     = useState('');   // 'approve' | 'reject'
  const [reason, setReason]     = useState('');
  const [showDetail, setShowDetail]   = useState(false); // detail modal
  const [confirmAction, setConfirmAction] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getJobs({ status: status || undefined, page, limit: PAGE_SIZE })
      .then(res => { setJobs(res.jobs || res.data || []); setTotal(res.total || 0); })
      .catch(() => { setJobs([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  function openAction(job, act) {
    setSelected(job);
    setAction(act);
    setReason('');
    setShowDetail(true);
  }

  async function doSubmit() {
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await api.approveJob(selected.id);
        success('Job approved and published.');
      } else {
        if (!validateFieldValue(reason, { type: 'textarea', name: 'reason', required: true })) {
          toastError('Enter a valid rejection reason.'); setSubmitting(false); return;
        }
        await api.rejectJob(selected.id, { reason });
        success('Job rejected.');
      }
      setSelected(null);
      setShowDetail(false);
      setConfirmAction(false);
      load();
    } catch (err) {
      toastError(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const STATUS_OPTS = [
    { value: 'pending',   label: 'Pending Approval' },
    { value: 'published', label: 'Published' },
    { value: 'rejected',  label: 'Rejected' },
    { value: 'draft',     label: 'Draft' },
    { value: 'closed',    label: 'Closed' },
    { value: '',          label: 'All Jobs' },
  ];

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
        <h1 className="page-title">Jobs &amp; Approvals</h1>
        <p className="page-subtitle">Review, approve, and reject submitted vacancies.</p>
      </div>

      <div style={{ marginBottom: 'var(--space-4)', maxWidth: 240 }}>
        <select className="form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState icon="💼" title="No Jobs Found" description="No jobs match the selected filter." />
      ) : (
        <>
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr><th>Title</th><th>Bureau</th><th>Type</th><th>Positions</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id}>
                      <td style={{ fontWeight: 500, maxWidth: 220 }}>{j.title_en}</td>
                      <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{j.bureau_name}</td>
                      <td><StatusBadge status={j.employment_type} type="employment" /></td>
                      <td style={{ textAlign: 'center' }}>{j.positions}</td>
                      <td style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', color: 'var(--color-gray-500)' }}>
                        {j.deadline ? new Date(j.deadline).toLocaleDateString() : '—'}
                      </td>
                      <td><StatusBadge status={j.status} type="job" /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          {j.status === 'pending' ? (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => openAction(j, 'approve')}>Approve</button>
                              <button className="btn btn-danger  btn-sm" onClick={() => openAction(j, 'reject')}>Reject</button>
                            </>
                          ) : (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo(0,0); }} />
        </>
      )}

      {/* Step 1 — detail / reason entry */}
      <Modal
        open={showDetail && !confirmAction}
        onClose={() => { setShowDetail(false); setSelected(null); }}
        title={action === 'approve' ? '✅ Approve Job' : '❌ Reject Job'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowDetail(false); setSelected(null); }}>Cancel</Button>
            <Button
              variant={action === 'approve' ? 'success' : 'danger'}
              onClick={() => {
                if (action === 'reject' && !validateFieldValue(reason, { type: 'textarea', name: 'reason', required: true })) {
                  toastError('Enter a valid rejection reason.'); return;
                }
                setConfirmAction(true);
              }}
            >
              {action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        {selected && (
          <div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
              <strong>{selected.title_en}</strong> — {selected.bureau_name}
            </p>
            {action === 'approve' ? (
              <p style={{ color: 'var(--color-gray-700)' }}>
                Approving will make this vacancy publicly visible immediately.
              </p>
            ) : (
              <FormField
                label="Rejection Reason"
                name="reason"
                type="textarea"
                required
                rows={4}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain why this job is being rejected…"
              />
            )}
          </div>
        )}
      </Modal>

      {/* Step 2 — final confirm */}
      <ConfirmModal
        open={confirmAction}
        onClose={() => setConfirmAction(false)}
        onConfirm={doSubmit}
        loading={submitting}
        title={action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
        message={action === 'approve'
          ? `Publish "${selected?.title_en}" from ${selected?.bureau_name}? It will be immediately visible to job seekers.`
          : `Reject "${selected?.title_en}"? The bureau will be notified and the job will be returned for revision.`}
        confirmLabel={action === 'approve' ? 'Yes, Publish' : 'Yes, Reject'}
        confirmVariant={action === 'approve' ? 'success' : 'danger'}
      />
    </div>
  );
}
