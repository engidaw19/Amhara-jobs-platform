import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { ConfirmModal } from '../../components/Modal';

export default function BureauJobsList() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus]     = useState('');

  const load = useCallback(() => {
    if (!user?.bureau_id) { setLoading(false); return; }
    setLoading(true);
    api.getBureauJobs(user.bureau_id, { status: status || undefined })
      .then(res => setJobs(res.jobs || res.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [user, status]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteJob(deleteId);
      success('Job deleted.');
      setDeleteId(null);
      load();
    } catch (err) {
      toastError(err.message || 'Failed to delete job.');
    } finally {
      setDeleting(false);
    }
  }

  const STATUS_OPTS = [
    { value: '',          label: 'All Statuses' },
    { value: 'draft',     label: 'Draft' },
    { value: 'pending',   label: 'Pending Approval' },
    { value: 'published', label: 'Published' },
    { value: 'closed',    label: 'Closed' },
    { value: 'rejected',  label: 'Rejected' },
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

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="page-title">My Jobs</h1>
          <p className="page-subtitle">Manage your bureau's job postings.</p>
        </div>
        <Link to="/bureau/jobs/create" className="btn btn-primary">➕ Post New Job</Link>
      </div>

      <div style={{ marginBottom: 'var(--space-4)', maxWidth: 220 }}>
        <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState icon="💼" title="No Jobs Found" description="No jobs match the selected filter."
          action={<Link to="/bureau/jobs/create" className="btn btn-primary">Post First Job</Link>} />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Title</th><th>Type</th><th>Status</th><th>Deadline</th><th>Applications</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id}>
                    <td style={{ fontWeight: 500, maxWidth: 260 }}>{j.title_en}</td>
                    <td><StatusBadge status={j.employment_type} type="employment" /></td>
                    <td><StatusBadge status={j.status} type="job" /></td>
                    <td style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', color: 'var(--color-gray-500)' }}>
                      {j.deadline ? new Date(j.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ color: 'var(--color-gray-600)' }}>{j.application_count ?? 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Link to={`/bureau/jobs/${j.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                        {(j.status === 'draft' || j.status === 'rejected') && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteId(j.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Job Posting"
        message="Are you sure you want to permanently delete this job posting? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
