import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { PageLoader } from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { ConfirmModal } from '../../components/Modal';
import { validateFormValues } from '../../utils/validation';

const EMP_OPTS    = ['full_time','part_time','contract','internship','temporary','volunteer'].map(v=>({value:v,label:v.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}));
const GENDER_OPTS = [{value:'any',label:'Any'},{value:'male',label:'Male'},{value:'female',label:'Female'}];
const EDU_OPTS    = ['Certificate','Diploma',"Bachelor's Degree","Master's Degree",'PhD','Other'].map(v=>({value:v,label:v}));

export default function BureauJobEdit() {
  const { id } = useParams();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [form, setForm]         = useState(null);
  const [original, setOriginal] = useState(null);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [zones, setZones]       = useState([]);
  const [woredas, setWoredas]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    Promise.all([api.getJobById(id), api.getZones(), api.getCategories()])
      .then(([jobRes, zRes, cRes]) => {
        const j = jobRes.job || jobRes.data || jobRes;
        const f = {
          title_en: j.title_en||'', title_am: j.title_am||'',
          description: j.description||'', requirements: j.requirements||'',
          responsibilities: j.responsibilities||'',
          education_level: j.education_level||'', experience_years: j.experience_years??'',
          employment_type: j.employment_type||'full_time',
          positions: j.positions||1, salary_min: j.salary_min||'', salary_max: j.salary_max||'',
          deadline: j.deadline ? j.deadline.split('T')[0] : '',
          zone_id: j.zone_id||'', woreda_id: j.woreda_id||'',
          category_id: j.category_id||'', gender_pref: j.gender_pref||'any',
          status: j.status,
        };
        setForm(f);
        setOriginal(JSON.stringify(f));
        setZones(zRes.zones||zRes.data||[]);
        setCategories(cRes.categories||cRes.data||[]);
      })
      .catch(() => toastError('Failed to load job.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!form?.zone_id) { setWoredas([]); return; }
    api.getWoredas(form.zone_id).then(r => setWoredas(r.woredas||r.data||[])).catch(() => setWoredas([]));
  }, [form?.zone_id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value, ...(name==='zone_id'?{woreda_id:''}:{}) }));
    setErrors(er => ({ ...er, [name]: '' }));
    setApiError('');
  }

  async function submit(submitForApproval) {
    const validationErrors = validateFormValues(form, [
      { name: 'title_en', label: 'Job title (English)', required: true },
      { name: 'title_am', label: 'Job title (Amharic)' },
      { name: 'description', type: 'textarea', label: 'Description', required: true },
      { name: 'requirements', type: 'textarea', label: 'Requirements' },
      { name: 'responsibilities', type: 'textarea', label: 'Responsibilities' },
      { name: 'employment_type', type: 'select', label: 'Employment type', required: true, options: EMP_OPTS },
      { name: 'education_level', type: 'select', label: 'Education level', options: EDU_OPTS },
      { name: 'experience_years', type: 'number', label: 'Experience' },
      { name: 'positions', type: 'number', label: 'Positions', required: true },
      { name: 'gender_pref', type: 'select', label: 'Gender preference', options: GENDER_OPTS },
      { name: 'salary_min', type: 'number', label: 'Minimum salary' },
      { name: 'salary_max', type: 'number', label: 'Maximum salary' },
      { name: 'deadline', type: 'date', label: 'Deadline' },
      { name: 'zone_id', type: 'select', label: 'Zone', options: zones.map(z => ({ value: z.id })) },
      { name: 'woreda_id', type: 'select', label: 'Woreda', options: woredas.map(w => ({ value: w.id })) },
      { name: 'category_id', type: 'select', label: 'Category', options: categories.map(c => ({ value: c.id })) },
    ]);
    if (form.positions && Number(form.positions) < 1) validationErrors.positions = 'At least 1 position required.';
    if (form.experience_years && Number(form.experience_years) < 0) validationErrors.experience_years = 'Experience cannot be negative.';
    if (form.salary_min && Number(form.salary_min) < 0) validationErrors.salary_min = 'Salary cannot be negative.';
    if (form.salary_max && Number(form.salary_max) < 0) validationErrors.salary_max = 'Salary cannot be negative.';
    if (form.deadline && new Date(form.deadline) < new Date()) validationErrors.deadline = 'Deadline must be in the future.';
    if (form.salary_min && form.salary_max && Number(form.salary_min) > Number(form.salary_max)) validationErrors.salary_max = 'Max salary must be greater than min.';
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setApiError(Object.values(validationErrors)[0]);
      return;
    }
    setSaving(true);
    setApiError('');
    try {
      await api.updateJob(id, {
        ...form,
        positions:        Number(form.positions),
        experience_years: form.experience_years ? Number(form.experience_years) : undefined,
        salary_min:       form.salary_min  ? Number(form.salary_min)  : undefined,
        salary_max:       form.salary_max  ? Number(form.salary_max)  : undefined,
        zone_id:          form.zone_id     || undefined,
        woreda_id:        form.woreda_id   || undefined,
        category_id:      form.category_id || undefined,
        status:           submitForApproval ? 'pending' : 'draft',
      });
      success(submitForApproval ? 'Submitted for approval!' : 'Changes saved.');
      navigate('/bureau/jobs');
    } catch (err) {
      const msg = err.message||'Save failed.';
      setApiError(msg); toastError(msg);
    } finally {
      setSaving(false);
    }
  }

  const isDirty = form && original && JSON.stringify(form) !== original;

  function handleBack() {
    if (isDirty) setConfirmDiscard(true);
    else navigate('/bureau/jobs');
  }

  if (loading) return <PageLoader />;
  if (!form)   return <div className="container" style={{ padding: '4rem' }}>Job not found.</div>;

  const canEdit = form.status === 'draft' || form.status === 'rejected';

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Back */}
      <button
        type="button"
        onClick={handleBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)',
          padding: 0, marginBottom: 'var(--space-4)',
        }}
      >
        ← Back to Jobs
      </button>

      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="page-title">Edit Job</h1>
          <p className="page-subtitle">{form.title_en}</p>
        </div>
        <StatusBadge status={form.status} type="job" />
      </div>

      {!canEdit && <Alert type="info"   style={{ marginBottom:'var(--space-4)' }}>This job is <strong>{form.status}</strong>. Only Draft or Rejected jobs can be edited.</Alert>}
      {form.status==='rejected' && <Alert type="danger" style={{ marginBottom:'var(--space-4)' }}>This job was rejected. Please address the feedback and resubmit.</Alert>}
      {apiError  && <Alert type="danger" onClose={() => setApiError('')} style={{ marginBottom:'var(--space-4)' }}>{apiError}</Alert>}

      <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-6)', opacity: canEdit ? 1 : 0.7 }}>
        <div className="card">
          <h2 style={{ fontWeight:600, marginBottom:'var(--space-4)', fontSize:'var(--font-size-base)' }}>Basic Information</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
            <FormField label="Job Title (English)" name="title_en" required value={form.title_en} onChange={handleChange} error={errors.title_en} disabled={!canEdit} style={{ gridColumn:'1/-1' }} />
            <FormField label="Job Title (Amharic)" name="title_am" value={form.title_am} onChange={handleChange} disabled={!canEdit} style={{ gridColumn:'1/-1' }} />
            <FormField label="Category"        name="category_id"    type="select" value={form.category_id}    onChange={handleChange} options={categories.map(c=>({value:c.id,label:c.name_en}))} placeholder="Select category" disabled={!canEdit} />
            <FormField label="Employment Type" name="employment_type" type="select" required value={form.employment_type} onChange={handleChange} options={EMP_OPTS} disabled={!canEdit} />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight:600, marginBottom:'var(--space-4)', fontSize:'var(--font-size-base)' }}>Details</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <FormField label="Description"      name="description"     type="textarea" required rows={5} value={form.description}     onChange={handleChange} error={errors.description}  disabled={!canEdit} placeholder="Describe the position…" />
            <FormField label="Requirements"     name="requirements"    type="textarea" rows={4} value={form.requirements}    onChange={handleChange} disabled={!canEdit} placeholder="Required qualifications…" />
            <FormField label="Responsibilities" name="responsibilities" type="textarea" rows={4} value={form.responsibilities} onChange={handleChange} disabled={!canEdit} placeholder="Key duties…" />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight:600, marginBottom:'var(--space-4)', fontSize:'var(--font-size-base)' }}>Qualifications & Compensation</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
            <FormField label="Education Level"    name="education_level"  type="select" value={form.education_level}  onChange={handleChange} options={EDU_OPTS} placeholder="Any" disabled={!canEdit} />
            <FormField label="Experience (years)" name="experience_years" type="number" min={0} step={1} value={form.experience_years} onChange={handleChange} disabled={!canEdit} />
            <FormField label="Positions"          name="positions"  type="number" min={1} step={1} required value={form.positions}  onChange={handleChange} disabled={!canEdit} />
            <FormField label="Gender Preference"  name="gender_pref" type="select" value={form.gender_pref} onChange={handleChange} options={GENDER_OPTS} disabled={!canEdit} />
            <FormField label="Min Salary (ETB)"   name="salary_min" type="number" min={0} step="0.01" value={form.salary_min} onChange={handleChange} disabled={!canEdit} />
            <FormField label="Max Salary (ETB)"   name="salary_max" type="number" min={0} step="0.01" value={form.salary_max} onChange={handleChange} disabled={!canEdit} />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight:600, marginBottom:'var(--space-4)', fontSize:'var(--font-size-base)' }}>Location & Deadline</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
            <FormField label="Zone"     name="zone_id"   type="select" value={form.zone_id}   onChange={handleChange} options={zones.map(z=>({value:z.id,label:z.name_en}))} placeholder="Select zone"   disabled={!canEdit} />
            <FormField label="Woreda"   name="woreda_id" type="select" value={form.woreda_id} onChange={handleChange} options={woredas.map(w=>({value:w.id,label:w.name_en}))} placeholder="Select woreda" disabled={!canEdit||!form.zone_id} />
            <FormField label="Deadline" name="deadline"  type="date"   value={form.deadline}  onChange={handleChange} disabled={!canEdit} />
          </div>
        </div>

        {canEdit && (
          <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end' }}>
            <Button variant="ghost"   onClick={handleBack}>Cancel</Button>
            <Button variant="outline" loading={saving} onClick={() => submit(false)}>Save Draft</Button>
            <Button variant="primary" loading={saving} onClick={() => submit(true)}>Submit for Approval</Button>
          </div>
        )}
      </div>

      {/* Discard confirmation */}
      <ConfirmModal
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => navigate('/bureau/jobs')}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to leave? All changes will be lost."
        confirmLabel="Discard"
        confirmVariant="danger"
      />
    </div>
  );
}
