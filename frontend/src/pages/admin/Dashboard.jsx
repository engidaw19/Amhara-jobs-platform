import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Spinner from '../../components/Spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminStats()
      .then(res => setStats(res.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><Spinner size="lg" /></div>;

  const zoneData  = stats?.jobs_by_zone   || [];
  const bureauData= stats?.jobs_by_bureau || [];
  const monthly   = stats?.monthly_trend  || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform Dashboard</h1>
        <p className="page-subtitle">System-wide statistics and activity overview.</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Jobs',         value: stats?.total_jobs ?? 0,         icon: '💼', color: 'blue' },
          { label: 'Published Jobs',     value: stats?.published_jobs ?? 0,     icon: '✅', color: 'green' },
          { label: 'Pending Approval',   value: stats?.pending_jobs ?? 0,       icon: '⏳', color: 'yellow' },
          { label: 'Total Bureaus',      value: stats?.total_bureaus ?? 0,      icon: '🏛️', color: 'orange' },
          { label: 'Registered Users',   value: stats?.total_users ?? 0,        icon: '👥', color: 'blue' },
          { label: 'Total Applications', value: stats?.total_applications ?? 0, icon: '📋', color: 'green' },
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

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        {[
          { to: '/admin/jobs',       icon: '✅', label: 'Approve Jobs' },
          { to: '/admin/users',      icon: '👥', label: 'Manage Users' },
          { to: '/admin/bureaus',    icon: '🏛️', label: 'Manage Bureaus' },
          { to: '/admin/audit-logs', icon: '🔍', label: 'Audit Logs' },
        ].map(l => (
          <Link key={l.to} to={l.to} className="card card-sm" style={{ textDecoration: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{l.icon}</div>
            <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{l.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {monthly.length > 0 && (
          <div className="card">
            <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Monthly Job Postings</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {bureauData.length > 0 && (
          <div className="card">
            <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Jobs by Bureau</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bureauData.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="bureau" tick={{ fontSize: 10 }} width={60} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-secondary)" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {zoneData.length > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Jobs by Zone</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={zoneData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" />
              <XAxis dataKey="zone" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-success)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
