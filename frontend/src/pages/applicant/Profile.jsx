import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import Alert from '../../components/Alert';

export default function ApplicantProfile() {
  const { user, updateUser } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [profile, setProfile] = useState({ headline: '', summary: '', date_of_birth: '', gender: '' });
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    api.getSeekerProfile()
      .then(res => {
        const p = res.profile || res.data || {};
        setProfile({
          headline:      p.headline || '',
          summary:       p.summary  || '',
          date_of_birth: p.date_of_birth ? p.date_of_birth.split('T')[0] : '',
          gender:        p.gender   || '',
        });
      })
      .catch(() => {});
  }, []);

  function handleChange(e, which) {
    const { name, value } = e.target;
    if (which === 'user') setForm(f => ({ ...f, [name]: value }));
    else setProfile(f => ({ ...f, [name]: value }));
    setApiError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.full_name.trim()) { setApiError('Full name is required.'); return; }
    setSaving(true);
    setApiError('');
    try {
      await api.updateSeekerProfile({ ...profile, full_name: form.full_name, phone: form.phone });
      updateUser({ full_name: form.full_name, phone: form.phone });
      success('Profile updated successfully!');
    } catch (err) {
      const msg = err.message || 'Failed to save profile.';
      setApiError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  }

  const GENDER_OPTIONS = [
    { value: 'male',   label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other',  label: 'Other' },
  ];

  return (
    <div style={{ maxWidth: 640 }}>
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
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Keep your profile up to date to improve your applications.</p>
      </div>

      {apiError && (
        <Alert type="danger" onClose={() => setApiError('')} style={{ marginBottom: 'var(--space-4)' }}>
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Account Info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Full Name" name="full_name" required value={form.full_name} onChange={e => handleChange(e, 'user')} />
            <FormField label="Phone"     name="phone"     type="tel" value={form.phone}    onChange={e => handleChange(e, 'user')} autoComplete="tel" />
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email || ''} disabled />
              <span className="form-helper">Email cannot be changed here.</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Profile Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField
              label="Professional Headline"
              name="headline"
              value={profile.headline}
              onChange={e => handleChange(e, 'profile')}
              style={{ gridColumn: '1/-1' }}
            />
            <FormField label="Date of Birth" name="date_of_birth" type="date"   value={profile.date_of_birth} onChange={e => handleChange(e, 'profile')} />
            <FormField label="Gender"        name="gender"        type="select" value={profile.gender}        onChange={e => handleChange(e, 'profile')} options={GENDER_OPTIONS} placeholder="Select gender" />
            <FormField
              label="Professional Summary"
              name="summary"
              type="textarea"
              rows={4}
              value={profile.summary}
              onChange={e => handleChange(e, 'profile')}
              placeholder="Brief professional summary…"
              style={{ gridColumn: '1/-1' }}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" loading={saving}>Save Profile</Button>
      </form>
    </div>
  );
}
