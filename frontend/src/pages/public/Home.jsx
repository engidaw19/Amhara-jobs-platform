import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import { getValidationPattern } from '../../utils/validation';
import { useLang } from '../../context/LangContext';

function StatCard({ value, label, icon }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{icon}</div>
      <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-white)' }}>{value}</div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,.75)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id}`} className="job-card">
      <div>
        <p className="job-card-bureau">{job.bureau_name}</p>
        <p className="job-card-title">{job.title_en}</p>
      </div>
      <div className="job-card-meta">
        {job.zone_name && <span>📍 {job.zone_name}</span>}
        <span>👥 {job.positions} position{job.positions !== 1 ? 's' : ''}</span>
        {job.deadline && <span>⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
      </div>
      <div className="job-card-footer">
        <StatusBadge status={job.employment_type} type="employment" />
        {job.category_name && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
            {job.category_name}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [query, setQuery]     = useState('');
  const [jobs, setJobs]       = useState([]);
  const [bureaus, setBureaus] = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getJobs({ status: 'published', limit: 6 }),
      api.getBureaus(),
    ])
      .then(([jobsRes, bureausRes]) => {
        setJobs(jobsRes.jobs || jobsRes.data || []);
        setBureaus((bureausRes.bureaus || bureausRes.data || []).slice(0, 6));
        // derive simple stats from what we have
        setStats({
          jobs:    jobsRes.total || (jobsRes.jobs || []).length,
          bureaus: (bureausRes.bureaus || bureausRes.data || []).length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-title">
            {t('Find Government Jobs in', 'የመንግሥት ሥራዎችን ያግኙ በ')}<br />
            <span>{t('Amhara Regional State', 'አማራ ክልል')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('Browse and apply for vacancies from authorized regional bureaus and government offices. All listings are officially published and database-backed.', 'ከተፈቀደላቸው የክልል ቢሮዎችና የመንግሥት ተቋማት የሥራ ማስታወቂያዎችን ይመልከቱ እና ያመልክቱ። ሁሉም ማስታወቂያዎች በይፋ የታተሙ ናቸው።')}
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <input
              className="form-input"
              pattern={getValidationPattern('text')}
              title="Use up to 500 standard text characters."
              style={{ flex: 2, minWidth: 200 }}
              placeholder={t('Search job title or keyword…', 'የሥራ ርዕስ ወይም ቁልፍ ቃል ይፈልጉ…')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label={t('Search jobs', 'ሥራዎችን ይፈልጉ')}
            />
            <button type="submit" className="btn btn-secondary btn-lg">
              🔍 {t('Search Jobs', 'ሥራዎችን ፈልግ')}
            </button>
          </form>

          {stats && (
            <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-8)', flexWrap: 'wrap' }}>
              <StatCard value={stats.jobs}    label={t('Open Vacancies', 'ክፍት የሥራ ቦታዎች')} icon="💼" />
              <StatCard value={stats.bureaus} label={t('Participating Bureaus', 'ተሳታፊ ቢሮዎች')} icon="🏛️" />
            </div>
          )}
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h2 className="section-title" style={{ fontSize: 'var(--font-size-2xl)' }}>{t('Recent Vacancies', 'የቅርብ ጊዜ የሥራ ማስታወቂያዎች')}</h2>
              <p className="section-subtitle" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
                {t('Latest published vacancies from participating bureaus', 'ከተሳታፊ ቢሮዎች የቅርብ ጊዜ የታተሙ የሥራ ማስታወቂያዎች')}
              </p>
            </div>
            <Link to="/jobs" className="btn btn-outline">{t('View All Jobs', 'ሁሉንም ሥራዎች ይመልከቱ')} →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <Spinner size="lg" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-title">{t('No Vacancies Published Yet', 'የሥራ ማስታወቂያ ገና አልታተመም')}</p>
              <p className="empty-state-desc">{t('Check back soon — new vacancies are published regularly.', 'አዳዲስ የሥራ ማስታወቂያዎች በየጊዜው ስለሚታተሙ እንደገና ይመልከቱ።')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
              {jobs.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          )}
        </div>
      </section>

      {/* Bureaus */}
      <section className="section-sm" style={{ background: 'var(--color-white)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-6)' }}>
            {t('Participating Bureaus', 'ተሳታፊ ቢሮዎች')}
          </h2>
          {bureaus.length === 0 ? (
            <p style={{ color: 'var(--color-gray-500)' }}>{t('No bureaus registered yet.', 'እስካሁን ምንም ቢሮ አልተመዘገበም።')}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              {bureaus.map(b => (
                <Link key={b.id} to={`/bureaus/${b.id}`} className="card card-sm" style={{ textDecoration: 'none', transition: 'box-shadow .15s' }}>
                  <p style={{ fontWeight: 600, color: 'var(--color-gray-900)', marginBottom: 4, fontSize: 'var(--font-size-sm)' }}>{b.name_en}</p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}>
                    {b.active_jobs ?? 0} {t('active vacancies', 'ክፍት የሥራ ቦታዎች')}
                  </p>
                </Link>
              ))}
            </div>
          )}
          <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            <Link to="/bureaus" className="btn btn-outline">{t('View All Bureaus', 'ሁሉንም ቢሮዎች ይመልከቱ')}</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm" style={{ background: 'var(--color-primary-light)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--space-3)' }}>
            {t('Ready to Apply?', 'ለማመልከት ዝግጁ ነዎት?')}
          </h2>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-6)' }}>
            {t('Create a free account to track your applications and receive notifications.', 'ማመልከቻዎችዎን ለመከታተልና ማሳወቂያዎችን ለመቀበል ነፃ መለያ ይፍጠሩ።')}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">{t('Create Account', 'መለያ ይፍጠሩ')}</Link>
            <Link to="/jobs" className="btn btn-outline btn-lg">{t('Browse Jobs', 'ሥራዎችን ይመልከቱ')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
