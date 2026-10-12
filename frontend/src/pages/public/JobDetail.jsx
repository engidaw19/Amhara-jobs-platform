import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import { PageLoader } from '../../components/Spinner';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { validateFieldValue } from '../../utils/validation';

export default function JobDetail() {
  const { id } = useParams();
  const { user, isSeeker } = useAuth();
  const { success, error: toastError } = useToast();

  const [job, setJob]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applied, setApplied]   = useState(false);
  const [applying, setApplying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cover, setCover]       = useState('');

  useEffect(() => {
    api.getJobById(id)
      .then(res => {
        setJob(res.job || res.data || res);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    if (user && isSeeker) {
      api.getJobStatus(id)
        .then(res => setApplied(res.applied ?? res.has_applied ?? false))
        .catch(() => {});
    }
  }, [id, user, isSeeker]);

  async function handleApply(e) {
    e.preventDefault();
    if (!validateFieldValue(cover, { type: 'textarea', name: 'cover_letter' })) {
      toastError('Please enter a valid cover letter.');
      return;
    }

    try {
      const documentResponse = await api.getMyDocuments();
      const missingDocuments = documentResponse.missingDocuments || [];
      if (missingDocuments.length) {
        toastError(`Please upload all required documents before applying. Missing: ${missingDocuments.join(', ')}.`);
        return;
      }
    } catch (err) {
      toastError('Unable to check your documents. Please upload them in your document portal.');
      return;
    }

    setApplying(true);
    try {
      await api.apply(id, { cover_letter: cover });
      setApplied(true);
      setShowModal(false);
      success('Application submitted successfully!');
    } catch (err) {
      toastError(err.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <PageLoader />;
  if (notFound || !job) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Job not found</h2>
        <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Jobs</Link>
      </div>
    );
  }

  const deadlinePast = job.deadline && new Date(job.deadline) < new Date();

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-8)', alignItems: 'start' }}>

        {/* Main */}
        <div>
          <Link to="/jobs" style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 'var(--space-4)' }}>
            ← Back to Jobs
          </Link>

          <div className="card">
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: 4 }}>{job.bureau_name}</p>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gray-900)', lineHeight: 1.3 }}>
                {job.title_en}
              </h1>
              {job.title_am && (
                <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-500)', marginTop: 4 }}>{job.title_am}</p>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
              <StatusBadge status={job.employment_type} type="employment" />
              {job.category_name && <span className="badge badge-gray">{job.category_name}</span>}
              {job.gender_pref && job.gender_pref !== 'any' && (
                <span className="badge badge-info">Gender: {job.gender_pref}</span>
              )}
            </div>

            <hr className="divider" />

            {job.description && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-lg)' }}>Description</h2>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-gray-700)' }}>
                  {job.description}
                </div>
              </div>
            )}

            {job.requirements && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-lg)' }}>Requirements</h2>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-gray-700)' }}>
                  {job.requirements}
                </div>
              </div>
            )}

            {job.responsibilities && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-lg)' }}>Responsibilities</h2>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-gray-700)' }}>
                  {job.responsibilities}
                </div>
              </div>
            )}

            {job.skills?.length > 0 && (
              <div>
                <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-lg)' }}>Required Skills</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {job.skills.map(s => (
                    <span key={s.id} className="badge badge-primary">{s.name_en}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 16px)' }}>
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Job Details</h2>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {job.zone_name && <Detail label="📍 Location" value={[job.zone_name, job.woreda_name].filter(Boolean).join(', ')} />}
              {job.education_level && <Detail label="🎓 Education" value={job.education_level} />}
              {job.experience_years != null && <Detail label="💼 Experience" value={`${job.experience_years} year${job.experience_years !== 1 ? 's' : ''}`} />}
              <Detail label="👥 Positions" value={job.positions} />
              {job.salary_min && <Detail label="💰 Salary" value={`${job.salary_min.toLocaleString()}${job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : ''} ${job.salary_currency}`} />}
              {job.deadline && (
                <Detail
                  label="⏰ Deadline"
                  value={new Date(job.deadline).toLocaleDateString()}
                  valueStyle={{ color: deadlinePast ? 'var(--color-danger)' : 'var(--color-gray-800)', fontWeight: deadlinePast ? 600 : undefined }}
                />
              )}
            </dl>
          </div>

          {/* Apply button */}
          {isSeeker ? (
            applied ? (
              <div className="alert alert-success">
                ✓ You have applied for this position.
              </div>
            ) : deadlinePast ? (
              <div className="alert alert-warning">Application deadline has passed.</div>
            ) : (
              <button className="btn btn-primary btn-block btn-lg" onClick={() => setShowModal(true)}>
                Apply Now
              </button>
            )
          ) : !user ? (
            <div>
              <Link to="/login" className="btn btn-primary btn-block btn-lg">
                Sign in to Apply
              </Link>
              <p style={{ textAlign: 'center', marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)' }}>Register</Link>
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Apply for this Position"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" loading={applying} onClick={handleApply}>Submit Application</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Cover Letter <span style={{ color: 'var(--color-gray-400)', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            className="form-textarea"
            rows={6}
            placeholder="Briefly describe why you are a good fit for this position…"
            value={cover}
            onChange={e => {
              e.currentTarget.setCustomValidity(validateFieldValue(e.target.value, { type: 'textarea', name: 'cover_letter' }) ? '' : 'Please enter a valid cover letter.');
              setCover(e.target.value);
            }}
          />
        </div>

        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-2)' }}>
          Required documents must be uploaded in your applicant document portal before submitting an application.
        </p>
      </Modal>
    </div>
  );
}

function Detail({ label, value, valueStyle }) {
  return (
    <div>
      <dt style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: 2 }}>{label}</dt>
      <dd style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-gray-800)', ...valueStyle }}>{value}</dd>
    </div>
  );
}
