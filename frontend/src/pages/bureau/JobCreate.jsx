import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { ConfirmModal } from '../../components/Modal';
import { validateFormValues } from '../../utils/validation';

const EMPTY = {
  title_en: '', title_am: '', description: '', requirements: '', responsibilities: '',
  education_level: '', experience_years: '', employment_type: 'full_time',
  positions: 1, salary_min: '', salary_max: '', deadline: '',
  zone_id: '', woreda_id: '', category_id: '', gender_pref: 'any',
};

const EMP_OPTS   = ['full_time','part_time','contract','internship','temporary','volunteer'].map(v => ({ value: v, label: v.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase()) }));
const GENDER_OPTS= [{ value:'any',label:'Any'},{ value:'male',label:'Male'},{ value:'female',label:'Female'}];
const EDU_OPTS   = ['Certificate','Diploma',"Bachelor's Degree","Master's Degree",'PhD','Other'].map(v=>({value:v,label:v}));

export default function BureauJobCreate() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const isBureauAdmin = user?.role === 'bureau_admin';

  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving]     = useState(false);
  const [zones, setZones]       = useState([]);
  const [woredas, setWoredas]   = useState([]);
  const [categories, setCategories] = useState([]);

  // Discard confirmation
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    api.getZones().then(r => setZones(r.zones || r.data || [])).catch(() => {});
    api.getCategories().then(r => setCategories(r.categories || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.zone_id) { setWoredas([]); return; }
    api.getWoredas(form.zone_id).then(r => setWoredas(r.woredas || r.data || [])).catch(() => setWoredas([]));
  }, [form.zone_id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value, ...(name === 'zone_id' ? { woreda_id: '' } : {}) }));
    setErrors(er => ({ ...er, [name]: '' }));
    setApiError('');
  }

  function validate() {
    const errs = validateFormValues(form, [
      { name: 'title_en', label: 'Job title (English)', required: true },
      { name: 'title_am', label: 'Job title (Amharic)' },
      { name: 'description', type: 'textarea', label: 'Description', required: true },
      { name: 'requirements', type: 'textarea', label: 'Requirements' },
      { name: 'responsibilities', type: 'textarea', label: 'Responsibilities' },
      { name: 'employment_type', type: 'select', label: 'Employment type', required: true, options: EMP_OPTS },
      { name: 'education_level', type: 'select', label: 'Education level', options: EDU_OPTS },
      { name: 'experience_years', type: 'number', label: 'Experience', min: 0 },
      { name: 'positions', type: 'number', label: 'Number of positions', required: true, min: 1 },
      { name: 'gender_pref', type: 'select', label: 'Gender preference', options: GENDER_OPTS },
      { name: 'salary_min', type: 'number', label: 'Minimum salary', min: 0 },
      { name: 'salary_max', type: 'number', label: 'Maximum salary', min: 0 },
      { name: 'deadline', type: 'date', label: 'Deadline' },
      { name: 'zone_id', type: 'select', label: 'Zone', options: zones.map(z => ({ value: z.id })) },
      { name: 'woreda_id', type: 'select', label: 'Woreda', options: woredas.map(w => ({ value: w.id })) },
      { name: 'category_id', type: 'select', label: 'Category', options: categories.map(c => ({ value: c.id })) },
    ]);
    if (form.deadline && new Date(form.deadline) < new Date()) errs.deadline = 'Deadline must be in the future.';
    if (form.positions && Number(form.positions) < 1) errs.positions = 'At least 1 position required.';
    if (form.experience_years && Number(form.experience_years) < 0) errs.experience_years = 'Experience cannot be negative.';
    if (form.salary_min && Number(form.salary_min) < 0) errs.salary_min = 'Salary cannot be negative.';
    if (form.salary_max && Number(form.salary_max) < 0) errs.salary_max = 'Salary cannot be negative.';
    if (form.salary_min && form.salary_max && Number(form.salary_min) > Number(form.salary_max))
      errs.salary_max = 'Max salary must be greater than min.';
    return errs;
  }

  async function submit(publish) {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); setApiError(Object.values(errs)[0]); return; }
    setSaving(true);
    setApiError('');
    try {
      await api.createJob({
        ...form,
        bureau_id:        user.bureau_id,
        positions:        Number(form.positions),
        experience_years: form.experience_years ? Number(form.experience_years) : undefined,
        salary_min:       form.salary_min  ? Number(form.salary_min)  : undefined,
        salary_max:       form.salary_max  ? Number(form.salary_max)  : undefined,
        zone_id:          form.zone_id     || undefined,
        woreda_id:        form.woreda_id   || undefined,
        category_id:      form.category_id || undefined,
        status:           publish ? 'pending' : 'draft',
      });
      success(publish
        ? (isBureauAdmin ? 'Job published to the job seeker portal!' : 'Job submitted for approval!')
        : 'Job saved as draft.');
      navigate('/bureau/jobs');
    } catch (err) {
      const msg = err.message || 'Failed to save job.';
      setApiError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  }

  // Has the user entered anything?
  const isDirty = Object.values(form).some(v => v !== '' && v !== 1 && v !== 'full_time' && v !== 'any');

  function handleCancel() {
    if (isDirty) setConfirmDiscard(true);
    else navigate('/bureau/jobs');
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Back */}
      <button
        type="button"
        onClick={handleCancel}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)',
          padding: 0, marginBottom: 'var(--space-4)',
        }}
      >
        ← Back to Jobs
      </button>

      <div className="page-header">
        <h1 className="page-title">Post a New Job</h1>
        <p className="page-subtitle">Fill in the vacancy details. Save as draft or submit for approval.</p>
      </div>

      {apiError && <Alert type="danger" onClose={() => setApiError('')} style={{ marginBottom: 'var(--space-4)' }}>{apiError}</Alert>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="card">
          <h2 style={{ fontWeight:600, marginBottom:'var(--space-4)', fontSize:'var(--font-size-base)' }}>Basic Information</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
            <FormField label="Job Title (English)" name="title_en" required value={form.title_en} onChange={handleChange} error={errors.title_en} style={{ gridColumn:'1/-1' }} />
            <FormField label="Job Title (Amharic)" name="title_am" value={form.title_am} onChange={handleChange} style={{ gridColumn:'1/-1' }} />
            <FormField label="Category"       name="category_id"    type="select" value={form.category_id}    onChange={handleChange} options={categories.map(c=>({value:c.id,label:c.name_en}))} placeholder="Select category" />
            <FormField label="Employment Type" name="employment_type" type="select" required value={form.employment_type} onChange={handleChange} options={EMP_OPTS} error={errors.employment_type} />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight:600, marginBottom:'var(--space-4)', fontSize:'var(--font-size-base)' }}>Details</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <FormField label="Description"     name="description"     type="textarea" required rows={5} value={form.description}     onChange={handleChange} error={errors.description}     placeholder="Describe the position…" />
            <FormField label="Requirements"    name="requirements"    type="textarea" rows={4} value={form.requirements}    onChange={handleChange} placeholder="Required qualifications…" />
            <FormField label="Responsibilities" name="responsibilities" type="textarea" rows={4} value={form.responsibilities} onChange={handleChange} placeholder="Key duties and responsibilities…" />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight:600, marginBottom:'var(--space-4)', fontSize:'var(--font-size-base)' }}>Qualifications & Compensation</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
            <FormField label="Education Level"    name="education_level"  type="select" value={form.education_level}  onChange={handleChange} options={EDU_OPTS} placeholder="Any" />
            <FormField label="Experience (years)" name="experience_years" type="number" min={0} step={1} value={form.experience_years} onChange={handleChange} error={errors.experience_years} />
            <FormField label="Number of Positions" name="positions" type="number" min={1} step={1} required value={form.positions} onChange={handleChange} error={errors.positions} />
            <FormField label="Gender Preference"  name="gender_pref"  type="select" value={form.gender_pref}  onChange={handleChange} options={GENDER_OPTS} />
            <FormField label="Min Salary (ETB)"   name="salary_min"   type="number" min={0} step="0.01" value={form.salary_min}   onChange={handleChange} error={errors.salary_min} />
            <FormField label="Max Salary (ETB)"   name="salary_max"   type="number" min={0} step="0.01" value={form.salary_max}   onChange={handleChange} error={errors.salary_max} />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight:600, marginBottom:'var(--space-4)', fontSize:'var(--font-size-base)' }}>Location & Deadline</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
            <FormField label="Zone"   name="zone_id"   type="select" value={form.zone_id}   onChange={handleChange} options={zones.map(z=>({value:z.id,label:z.name_en}))} placeholder="Select zone" />
            <FormField label="Woreda" name="woreda_id" type="select" value={form.woreda_id} onChange={handleChange} options={woredas.map(w=>({value:w.id,label:w.name_en}))} placeholder={form.zone_id ? 'Select woreda' : 'Select zone first'} disabled={!form.zone_id} />
            <FormField label="Application Deadline" name="deadline" type="date" value={form.deadline} onChange={handleChange} error={errors.deadline} />
          </div>
        </div>

        <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end' }}>
          <Button variant="ghost"   type="button" onClick={handleCancel}>Cancel</Button>
          <Button variant="outline" type="button" loading={saving} onClick={() => submit(false)}>Save Draft</Button>
          <Button variant="primary" type="button" loading={saving} onClick={() => submit(true)}>
            {isBureauAdmin ? 'Publish Job' : 'Submit for Approval'}
          </Button>
        </div>
      </div>

      {/* Discard confirmation */}
      <ConfirmModal
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => navigate('/bureau/jobs')}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to leave? All entered data will be lost."
        confirmLabel="Discard"
        confirmVariant="danger"
      />
    </div>
  );
}
