import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div>
      <div style={{ background: 'var(--color-primary)', color: '#fff', padding: 'var(--space-10) 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>About Amhara Jobs</h1>
          <p style={{ opacity: .8, marginTop: 'var(--space-2)' }}>The centralized recruitment portal for Amhara Regional State</p>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-12) var(--space-6)', maxWidth: 800 }}>
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>How the System Works</h2>
          <p style={{ lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-gray-700)' }}>
            Amhara Jobs is a recruitment portal for the Amhara Regional State of Ethiopia. It connects
            authorized government bureaus with job seekers who can browse published vacancies and
            submit applications through the platform.
          </p>
          <p style={{ lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-gray-700)', marginTop: 'var(--space-3)' }}>
            Authorized bureau staff create and update vacancy information. Job seekers can review
            published positions, apply for suitable vacancies, and view their application records.
            Authorized reviewers can record application decisions, and relevant administrative actions
            are kept in the system for operational review.
          </p>
          <p style={{ lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-gray-700)', marginTop: 'var(--space-3)' }}>
            The system uses authentication, role-based authorization, database-backed records,
            bureau-scoped access controls, and audit logging to support accountability. These controls
            are intended to limit unauthorized access and actions, but they do not replace secure
            deployment, regular review, access management, and responsible system administration.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Security and System Responsibilities</h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              ['Official Records', 'Vacancies, bureaus, applications, and administrative information are stored as database records.'],
              ['Role-Based Access', 'Authenticated users are checked against their assigned role before permitted operations are executed.'],
              ['Bureau Scope', 'Bureau-scoped users are restricted to resources belonging to their assigned bureau where that control is applied.'],
              ['Audit Logging', 'Selected administrative actions are recorded for operational review and accountability.'],
              ['Security Limitations', 'No application can guarantee complete protection. Secure configuration, monitoring, and regular access review remain essential.'],
            ].map(([title, desc]) => (
              <li key={title} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>•</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 2 }}>{title}</strong>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
          <Link to="/jobs" className="btn btn-primary btn-lg">Browse Vacancies</Link>
        </div>
      </div>
    </div>
  );
}
