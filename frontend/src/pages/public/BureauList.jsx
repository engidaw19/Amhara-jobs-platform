import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { getValidationPattern } from '../../utils/validation';

export default function BureauList() {
  const [bureaus, setBureaus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.getBureaus()
      .then(res => setBureaus(res.bureaus || res.data || []))
      .catch(() => setBureaus([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bureaus.filter(b =>
    b.name_en.toLowerCase().includes(q.toLowerCase()) ||
    (b.name_am || '').includes(q)
  );

  return (
    <div>
      <div style={{ background: 'var(--color-primary)', color: '#fff', padding: 'var(--space-10) 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Participating Bureaus
          </h1>
          <p style={{ opacity: .8 }}>Government bureaus and offices posting vacancies on this portal</p>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
        <div style={{ maxWidth: 400, marginBottom: 'var(--space-6)' }}>
          <input
            className="form-input"
            pattern={getValidationPattern('text')}
            title="Use up to 500 standard text characters."
            placeholder="Search bureaus…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🏛️" title="No Bureaus Found" description={q ? 'Try a different search term.' : 'No bureaus have been registered yet.'} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {filtered.map(b => (
              <Link key={b.id} to={`/bureaus/${b.id}`} className="card" style={{ textDecoration: 'none', transition: 'box-shadow .15s, border-color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                <p style={{ fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: 4 }}>{b.name_en}</p>
                {b.name_am && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginBottom: 'var(--space-3)' }}>{b.name_am}</p>}
                {b.description && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>{b.description.slice(0, 100)}{b.description.length > 100 ? '…' : ''}</p>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {b.active_jobs ?? 0} active {b.active_jobs === 1 ? 'vacancy' : 'vacancies'}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
