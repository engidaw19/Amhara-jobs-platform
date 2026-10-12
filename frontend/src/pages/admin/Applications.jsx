import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Button from '../../components/Button';

/* ── Constants ──────────────────────────────────────────────── */
const STATUS_OPTS = [
  { value: '',             label: 'All Statuses' },
  { value: 'applied',      label: 'Applied' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted',  label: 'Shortlisted' },
  { value: 'interview',    label: 'Interview' },
  { value: 'accepted',     label: 'Accepted' },
  { value: 'rejected',     label: 'Rejected' },
];

const DOC_LABELS = {
  CV:       'Curriculum Vitae',
  GRADE_8:  'Grade 8 Certificate',
  GRADE_12: 'Grade 12 Certificate',
  DEGREE:   'Degree Certificate',
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

/* ── Helpers ────────────────────────────────────────────────── */
function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtFull(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Print styles injected once ────────────────────────────── */
const PRINT_STYLES = `
@media print {
  body > *:not(#print-root) { display: none !important; }
  #print-root { display: block !important; }
  #print-root { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
  .print-header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 16px; }
  .print-section { margin-bottom: 14px; }
  .print-section h3 { font-size: 13px; font-weight: 700; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
  .print-row { display: flex; gap: 12px; margin-bottom: 6px; }
  .print-label { font-weight: 600; min-width: 160px; }
  .print-doc-row { margin-bottom: 4px; }
  @page { margin: 18mm; }
}
`;

/* ── Component ───────────────────────────────────────────────── */
export default function AdminApplications() {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const printRootRef = useRef(null);

  const [apps, setApps]         = useState([]);
  const [bureaus, setBureaus]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  // filters
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [bureauFilter, setBureau]   = useState('');

  /* inject print styles once */
  useEffect(() => {
    if (document.getElementById('admin-app-print-styles')) return;
    const tag = document.createElement('style');
    tag.id = 'admin-app-print-styles';
    tag.textContent = PRINT_STYLES;
    document.head.appendChild(tag);
  }, []);

  /* load bureaus for filter dropdown */
  useEffect(() => {
    api.getBureaus()
      .then(res => setBureaus(res.bureaus || res.data || []))
      .catch(() => {});
  }, []);

  /* load applications */
  const load = useCallback(() => {
    setLoading(true);
    api.getAllApplications({
      q:         search    || undefined,
      status:    statusFilter || undefined,
      bureau_id: bureauFilter || undefined,
    })
      .then(res => setApps(res.applications || res.data || []))
      .catch(err => { toastError(err.message || 'Failed to load applications.'); setApps([]); })
      .finally(() => setLoading(false));
  }, [search, statusFilter, bureauFilter, toastError]);

  useEffect(() => { load(); }, [load]);

  /* ── Download single application as JSON file ── */
  function downloadApplication(app) {
    const payload = {
      application_id:   app.id,
      status:           app.status,
      applied_at:       app.applied_at,
      applicant: {
        name:  app.applicant_name,
        email: app.applicant_email,
        phone: app.applicant_phone || '—',
      },
      job: {
        title:           app.job_title,
        employment_type: app.employment_type,
        deadline:        app.deadline,
        bureau:          app.bureau_name,
      },
      cover_letter: app.cover_letter || '(none)',
      status_note:  app.status_note  || '(none)',
      documents: (app.documents || []).map(d => ({
        type:      d.document_type,
        label:     DOC_LABELS[d.document_type] || d.document_type,
        file_name: d.file_name,
        size_kb:   d.file_size ? Math.round(d.file_size / 1024) : '?',
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `application_${app.id}_${(app.applicant_name || 'unknown').replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /* ── Download all visible applications as CSV ── */
  function downloadAllCSV() {
    const headers = [
      'ID', 'Status', 'Applied At',
      'Applicant Name', 'Email', 'Phone',
      'Job Title', 'Employment Type', 'Deadline', 'Bureau',
      'Cover Letter', 'Status Note',
    ];

    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const rows = apps.map(a => [
      a.id,
      a.status,
      fmtFull(a.applied_at),
      a.applicant_name,
      a.applicant_email,
      a.applicant_phone || '',
      a.job_title,
      a.employment_type,
      fmt(a.deadline),
      a.bureau_name,
      a.cover_letter || '',
      a.status_note  || '',
    ].map(escape).join(','));

    const csv  = [headers.map(escape).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `applications_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /* ── Print detail of a single application ── */
  function printApplication(app) {
    // Build a hidden div with formatted content, then trigger print
    const el = printRootRef.current;
    el.innerHTML = buildPrintHTML(app);
    window.print();
    el.innerHTML = '';
  }

  function buildPrintHTML(a) {
    const docs = (a.documents || []).map(d =>
      `<div class="print-doc-row">
        <strong>${DOC_LABELS[d.document_type] || d.document_type}</strong>
        — ${d.file_name} (${d.file_size ? Math.round(d.file_size / 1024) + ' KB' : '?'})
      </div>`
    ).join('') || '<p>No documents found.</p>';

    return `
      <div class="print-header">
        <h2 style="margin:0 0 4px">Application #${a.id} — ${a.job_title}</h2>
        <p style="margin:0;color:#555">Printed ${new Date().toLocaleString('en-GB')}</p>
      </div>

      <div class="print-section">
        <h3>Applicant Details</h3>
        <div class="print-row"><span class="print-label">Name:</span><span>${a.applicant_name}</span></div>
        <div class="print-row"><span class="print-label">Email:</span><span>${a.applicant_email}</span></div>
        <div class="print-row"><span class="print-label">Phone:</span><span>${a.applicant_phone || '—'}</span></div>
      </div>

      <div class="print-section">
        <h3>Job Details</h3>
        <div class="print-row"><span class="print-label">Position:</span><span>${a.job_title}</span></div>
        <div class="print-row"><span class="print-label">Employment Type:</span><span>${a.employment_type || '—'}</span></div>
        <div class="print-row"><span class="print-label">Deadline:</span><span>${fmt(a.deadline)}</span></div>
        <div class="print-row"><span class="print-label">Bureau:</span><span>${a.bureau_name}</span></div>
      </div>

      <div class="print-section">
        <h3>Application Status</h3>
        <div class="print-row"><span class="print-label">Status:</span><span>${a.status.replace(/_/g, ' ').toUpperCase()}</span></div>
        <div class="print-row"><span class="print-label">Applied At:</span><span>${fmtFull(a.applied_at)}</span></div>
        <div class="print-row"><span class="print-label">Last Updated:</span><span>${fmtFull(a.updated_at)}</span></div>
        ${a.status_note ? `<div class="print-row"><span class="print-label">Status Note:</span><span>${a.status_note}</span></div>` : ''}
      </div>

      <div class="print-section">
        <h3>Cover Letter</h3>
        <p style="white-space:pre-wrap;line-height:1.6">${a.cover_letter || '(no cover letter provided)'}</p>
      </div>

      <div class="print-section">
        <h3>Submitted Documents</h3>
        ${docs}
      </div>
    `;
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div>
      {/* Hidden node used for printing */}
      <div
        ref={printRootRef}
        id="print-root"
        style={{ display: 'none' }}
        aria-hidden="true"
      />

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
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">All job applications submitted by job seekers across all bureaus.</p>
        </div>
        {apps.length > 0 && (
          <Button variant="outline" onClick={downloadAllCSV}>
            ⬇ Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <input
          className="form-input"
          style={{ maxWidth: 260 }}
          placeholder="Search by name, email or job title…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
        >
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          className="form-select"
          style={{ maxWidth: 220 }}
          value={bureauFilter}
          onChange={e => setBureau(e.target.value)}
        >
          <option value="">All Bureaus</option>
          {bureaus.map(b => <option key={b.id} value={b.id}>{b.name_en}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : apps.length === 0 ? (
        <EmptyState icon="📋" title="No Applications" description="No applications match the current filters." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Position</th>
                  <th>Bureau</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td>
                      <p style={{ fontWeight: 500 }}>{a.applicant_name}</p>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                        {a.applicant_email}
                      </p>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>{a.job_title}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                      {a.bureau_name}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', whiteSpace: 'nowrap' }}>
                      {fmt(a.applied_at)}
                    </td>
                    <td>
                      <StatusBadge status={a.status} type="application" />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'nowrap' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelected(a)}
                          title="View full details"
                        >
                          View
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => printApplication(a)}
                          title="Print this application"
                        >
                          🖨 Print
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => downloadApplication(a)}
                          title="Download as JSON"
                        >
                          ⬇ Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-500)',
            borderTop: '1px solid var(--color-gray-200)',
          }}>
            {apps.length} application{apps.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Application #${selected?.id} — ${selected?.job_title || ''}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button variant="outline" onClick={() => printApplication(selected)}>🖨 Print</Button>
            <Button variant="primary" onClick={() => downloadApplication(selected)}>⬇ Download</Button>
          </div>
        }
      >
        {selected && <ApplicationDetail app={selected} apiBase={API_BASE} docLabels={DOC_LABELS} fmt={fmt} fmtFull={fmtFull} />}
      </Modal>
    </div>
  );
}

/* ── Detail panel inside the modal ─────────────────────────── */
function ApplicationDetail({ app, apiBase, docLabels, fmt, fmtFull }) {
  const labelStyle = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-gray-500)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    marginBottom: 2,
  };
  const valueStyle = { fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-800)' };

  function Field({ label, value }) {
    return (
      <div>
        <p style={labelStyle}>{label}</p>
        <p style={valueStyle}>{value || '—'}</p>
      </div>
    );
  }

  function Section({ title, children }) {
    return (
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <p style={{
          fontWeight: 700,
          fontSize: 'var(--font-size-sm)',
          borderBottom: '1px solid var(--color-gray-200)',
          paddingBottom: 'var(--space-1)',
          marginBottom: 'var(--space-3)',
        }}>
          {title}
        </p>
        {children}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      <Section title="Applicant">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Full Name"    value={app.applicant_name} />
          <Field label="Email"        value={app.applicant_email} />
          <Field label="Phone"        value={app.applicant_phone} />
        </div>
      </Section>

      <Section title="Position">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Job Title"        value={app.job_title} />
          <Field label="Bureau"           value={app.bureau_name} />
          <Field label="Employment Type"  value={app.employment_type?.replace(/_/g, ' ')} />
          <Field label="Deadline"         value={fmt(app.deadline)} />
        </div>
      </Section>

      <Section title="Application Status">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <p style={labelStyle}>Status</p>
            <StatusBadge status={app.status} type="application" />
          </div>
          <Field label="Applied At"    value={fmtFull(app.applied_at)} />
          <Field label="Last Updated"  value={fmtFull(app.updated_at)} />
        </div>
        {app.status_note && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <p style={labelStyle}>Status Note</p>
            <p style={{ ...valueStyle, fontStyle: 'italic' }}>{app.status_note}</p>
          </div>
        )}
      </Section>

      <Section title="Cover Letter">
        <div style={{
          background: 'var(--color-gray-50)',
          border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 'var(--line-height-relaxed)',
          whiteSpace: 'pre-wrap',
          color: app.cover_letter ? 'var(--color-gray-800)' : 'var(--color-gray-400)',
          minHeight: 60,
        }}>
          {app.cover_letter || 'No cover letter provided.'}
        </div>
      </Section>

      <Section title="Submitted Documents">
        {app.documents?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {app.documents.map(doc => (
              <div
                key={doc.document_type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-gray-50)',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    {docLabels[doc.document_type] || doc.document_type}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                    {doc.file_name} · {doc.file_size ? Math.round(doc.file_size / 1024) + ' KB' : '?'}
                  </p>
                </div>
                <a
                  href={`${apiBase}/uploads/applicant-documents/${doc.stored_file_name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                  download={doc.file_name}
                >
                  ⬇ Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)' }}>
            No documents on record.
          </p>
        )}
      </Section>

    </div>
  );
}
