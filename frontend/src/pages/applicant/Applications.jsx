import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function ApplicantApplications() {
  const navigate = useNavigate();
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyApplications()
      .then(res => setApps(res.applications || res.data || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="page-title">My Applications</h1>
        <p className="page-subtitle">Track the status of all your job applications.</p>
      </div>

      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : apps.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No Applications Yet"
          description="You haven't applied to any jobs. Browse available vacancies to get started."
          action={<Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>}
        />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Bureau</th>
                  <th>Applied On</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/jobs/${a.job_id}`} style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>
                        {a.job_title || a.title_en}
                      </Link>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{a.bureau_name}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', whiteSpace: 'nowrap' }}>
                      {new Date(a.applied_at).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', whiteSpace: 'nowrap' }}>
                      {new Date(a.updated_at).toLocaleDateString()}
                    </td>
                    <td><StatusBadge status={a.status} type="application" /></td>
                    <td>
                      <Link to={`/jobs/${a.job_id}`} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}>
                        View Job
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
