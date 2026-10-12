import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PageLoader } from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

export default function BureauDetail() {
  const { id } = useParams();
  const [bureau, setBureau] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBureauById(id)
      .then(res => setBureau(res.bureau || res.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!bureau) return (
    <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <h2>Bureau not found</h2>
      <Link to="/bureaus" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Bureaus</Link>
    </div>
  );

  const jobs = bureau.recent_jobs || bureau.jobs || [];

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      <Link to="/bureaus" style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 'var(--space-4)' }}>
        ← Back to Bureaus
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-8)', alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: 4 }}>{bureau.name_en}</h1>
            {bureau.name_am && <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-500)', marginBottom: 'var(--space-4)' }}>{bureau.name_am}</p>}
            {bureau.description && (
              <p style={{ lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-gray-700)' }}>{bureau.description}</p>
            )}
          </div>

          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Open Vacancies</h2>
          {jobs.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <div className="empty-state-icon">💼</div>
              <p className="empty-state-title">No Open Vacancies</p>
              <p className="empty-state-desc">This bureau has no published vacancies at this time.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {jobs.map(j => (
                <Link key={j.id} to={`/jobs/${j.id}`} className="card card-sm" style={{ textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--color-gray-900)', marginBottom: 4 }}>{j.title_en}</p>
                      <div className="job-card-meta">
                        {j.zone_name && <span>📍 {j.zone_name}</span>}
                        {j.deadline && <span>⏰ {new Date(j.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <StatusBadge status={j.employment_type} type="employment" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 16px)' }}>
            <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Contact Info</h2>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {bureau.email   && <Detail label="📧 Email"   value={bureau.email} />}
              {bureau.phone   && <Detail label="📞 Phone"   value={bureau.phone} />}
              {bureau.address && <Detail label="📍 Address" value={bureau.address} />}
              {bureau.website && (
                <div>
                  <dt style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: 2 }}>🌐 Website</dt>
                  <dd><a href={bureau.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>{bureau.website}</a></dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: 2 }}>{label}</dt>
      <dd style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{value}</dd>
    </div>
  );
}
