import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { getValidationPattern } from '../../utils/validation';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { useLang } from '../../context/LangContext';

const PAGE_SIZE = 12;

export default function JobsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLang();

  const [jobs, setJobs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [bureaus, setBureaus]   = useState([]);
  const [zones, setZones]       = useState([]);
  const [categories, setCategories] = useState([]);

  // Filter state from URL params
  const page     = Number(searchParams.get('page') || 1);
  const q        = searchParams.get('q') || '';
  const bureauId = searchParams.get('bureau_id') || '';
  const zoneId   = searchParams.get('zone_id') || '';
  const catId    = searchParams.get('category_id') || '';
  const empType  = searchParams.get('employment_type') || '';

  // Load filter options once
  useEffect(() => {
    Promise.all([
      api.getBureaus(),
      api.getZones(),
      api.getCategories(),
    ]).then(([bRes, zRes, cRes]) => {
      setBureaus(bRes.bureaus || bRes.data || []);
      setZones(zRes.zones || zRes.data || []);
      setCategories(cRes.categories || cRes.data || []);
    }).catch(() => {});
  }, []);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    api.getJobs({
      q, bureau_id: bureauId, zone_id: zoneId,
      category_id: catId, employment_type: empType,
      status: 'published', page, limit: PAGE_SIZE,
    })
      .then(res => {
        setJobs(res.jobs || res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => { setJobs([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [q, bureauId, zoneId, catId, empType, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  function set(key, val) {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  }

  function setPage(n) {
    const p = new URLSearchParams(searchParams);
    p.set('page', n);
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const EMP_TYPES = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract',  label: 'Contract' },
    { value: 'internship',label: 'Internship' },
    { value: 'temporary', label: 'Temporary' },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ background: 'var(--color-primary)', color: 'var(--color-white)', padding: 'var(--space-10) 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            {t('Browse Vacancies', 'የሥራ ማስታወቂያዎችን ይመልከቱ')}
          </h1>
          <p style={{ opacity: .8 }}>
            {total > 0 ? (t(`${total} published vacanc${total === 1 ? 'y' : 'ies'} found`, `${total} የታተሙ የሥራ ቦታዎች ተገኝተዋል`)) : t('Search and filter government vacancies below', 'ከታች ያሉትን የመንግሥት የሥራ ማስታወቂያዎች ይፈልጉ እና ያጣሩ')}
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>

          {/* Filters sidebar */}
          <aside>
            <div className="card" style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 16px)' }}>
              <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>{t('Filters', 'ማጣሪያዎች')}</h2>

              {/* Search */}
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">{t('Keyword', 'ቁልፍ ቃል')}</label>
                <input
                  className="form-input"
                  pattern={getValidationPattern('text')}
                  title="Use up to 500 standard text characters."
                  placeholder={t('Job title or keyword', 'የሥራ ርዕስ ወይም ቁልፍ ቃል')}
                  value={q}
                  onChange={e => set('q', e.target.value)}
                />
              </div>

              {/* Bureau */}
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">{t('Bureau', 'ቢሮ')}</label>
                <select className="form-select" value={bureauId} onChange={e => set('bureau_id', e.target.value)}>
                  <option value="">{t('All Bureaus', 'ሁሉም ቢሮዎች')}</option>
                  {bureaus.map(b => <option key={b.id} value={b.id}>{b.name_en}</option>)}
                </select>
              </div>

              {/* Zone */}
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">{t('Zone', 'ዞን')}</label>
                <select className="form-select" value={zoneId} onChange={e => set('zone_id', e.target.value)}>
                  <option value="">{t('All Zones', 'ሁሉም ዞኖች')}</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name_en}</option>)}
                </select>
              </div>

              {/* Category */}
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">{t('Category', 'ምድብ')}</label>
                <select className="form-select" value={catId} onChange={e => set('category_id', e.target.value)}>
                  <option value="">{t('All Categories', 'ሁሉም ምድቦች')}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                </select>
              </div>

              {/* Employment Type */}
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">{t('Employment Type', 'የቅጥር ዓይነት')}</label>
                <select className="form-select" value={empType} onChange={e => set('employment_type', e.target.value)}>
                  <option value="">{t('All Types', 'ሁሉም ዓይነቶች')}</option>
                  {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <button className="btn btn-ghost btn-block" onClick={() => setSearchParams({})}>
                Clear Filters
              </button>
            </div>
          </aside>

          {/* Results */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
                <Spinner size="lg" />
              </div>
            ) : jobs.length === 0 ? (
                <EmptyState
                icon="🔍"
                  title={t('No Vacancies Found', 'የሥራ ማስታወቂያ አልተገኘም')}
                  description={t('Try adjusting your search filters or check back later for new postings.', 'የፍለጋ ማጣሪያዎችን ይቀይሩ ወይም ለአዳዲስ ማስታወቂያዎች ቆይተው ይመልከቱ።')}
              />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                  {jobs.map(j => <JobCard key={j.id} job={j} />)}
                </div>
                <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job }) {
  const deadlinePast = job.deadline && new Date(job.deadline) < new Date();
  return (
    <Link to={`/jobs/${job.id}`} className="job-card">
      <div>
        <p className="job-card-bureau">{job.bureau_name}</p>
        <p className="job-card-title">{job.title_en}</p>
      </div>
      <div className="job-card-meta">
        {job.zone_name && <span>📍 {job.zone_name}</span>}
        <span>👥 {job.positions} pos.</span>
        {job.education_level && <span>🎓 {job.education_level}</span>}
        {job.deadline && (
          <span style={{ color: deadlinePast ? 'var(--color-danger)' : undefined }}>
            ⏰ {new Date(job.deadline).toLocaleDateString()}
          </span>
        )}
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
