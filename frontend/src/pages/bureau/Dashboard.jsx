import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';

export default function BureauDashboard() {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.bureau_id) { setLoading(false); return; }
    api.getBureauStats(user.bureau_id)
      .then(res => setStats(res.stats || res.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading-page"><Spinner size="lg" /></div>;

  const recentJobs = stats?.recent_jobs || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bureau Dashboard</h1>
        <p className="page-subtitle">{stats?.bureau_name || "Managing your bureau's vacancies and recruitment."}</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Jobs',       value: stats?.total_jobs ?? 0,        icon: '💼', color: 'blue' },
          { label: 'Published',        value: stats?.published_jobs ?? 0,    icon: '✅', color: 'green' },
          { label: 'Pending Approval', value: stats?.pending_jobs ?? 0,      icon: '⏳', color: 'yellow' },
          { label: 'Total Applications', value: stats?.total_applications ?? 0, icon: '📋', color: 'orange' },
          { label: 'New Applications', value: stats?.new_applications ?? 0,  icon: '🔔', color: 'red' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <Link to="/bureau/jobs/create" className="btn btn-primary" style={{ textAlign: 'center' }}>➕ Post New Job</Link>
        <Link to="/bureau/applications" className="btn btn-outline" style={{ textAlign: 'center' }}>📋 View Applications</Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontWeight: 600 }}>Recent Jobs</h2>
          <Link to="/bureau/jobs" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}>View all →</Link>
        </div>
        {recentJobs.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <div className="empty-state-icon">💼</div>
            <p className="empty-state-title">No Jobs Posted Yet</p>
            <Link to="/bureau/jobs/create" className="btn btn-primary" style={{ marginTop: 'var(--space-3)' }}>Post First Job</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Title</th><th>Status</th><th>Applications</th><th>Deadline</th><th></th></tr>
              </thead>
              <tbody>
                {recentJobs.map(j => (
                  <tr key={j.id}>
                    <td style={{ fontWeight: 500 }}>{j.title_en}</td>
                    <td><StatusBadge status={j.status} type="job" /></td>
                    <td style={{ color: 'var(--color-gray-600)' }}>{j.application_count ?? 0}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                      {j.deadline ? new Date(j.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <Link to={`/bureau/jobs/${j.id}/edit`} style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-xs)' }}>Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
