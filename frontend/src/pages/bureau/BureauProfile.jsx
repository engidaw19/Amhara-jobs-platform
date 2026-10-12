import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import { PageLoader } from '../../components/Spinner';
import Alert from '../../components/Alert';
import { ConfirmModal } from '../../components/Modal';

export default function BureauProfile() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [bureau, setBureau]     = useState(null);
  const [form, setForm]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);

  useEffect(() => {
    if (!user?.bureau_id) { setLoading(false); return; }
    api.getBureauById(user.bureau_id)
      .then(res => {
        const b = res.bureau || res.data || res;
        setBureau(b);
        const f = {
          name_en: b.name_en||'', name_am: b.name_am||'',
          description: b.description||'', email: b.email||'',
          phone: b.phone||'', address: b.address||'', website: b.website||'',
        };
        setForm(f);
      })
      .catch(() => toastError('Failed to load bureau info.'))
      .finally(() => setLoading(false));
  }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setApiError('');
  }

  async function doSave() {
    setSaving(true);
    setApiError('');
    try {
      await api.updateBureau(user.bureau_id, form);
      setConfirmSave(false);
      success('Bureau profile updated.');
    } catch (err) {
      const msg = err.message || 'Failed to update.';
      setApiError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setConfirmSave(true);
  }

  if (loading) return <PageLoader />;
  if (!bureau) return (
    <div className="empty-state">
      <div className="empty-state-icon">🏛️</div>
      <p className="empty-state-title">Bureau Not Found</p>
      <p className="empty-state-desc">Your account is not linked to a bureau. Contact an administrator.</p>
    </div>
  );

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
        <h1 className="page-title">Bureau Profile</h1>
        <p className="page-subtitle">Update your bureau's public information.</p>
      </div>

      {apiError && <Alert type="danger" onClose={() => setApiError('')} style={{ marginBottom: 'var(--space-4)' }}>{apiError}</Alert>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Bureau Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <FormField label="Bureau Name (English)" name="name_en" required value={form.name_en} onChange={handleChange} />
            <FormField label="Bureau Name (Amharic)" name="name_am" value={form.name_am} onChange={handleChange} />
            <FormField label="Description" name="description" type="textarea" rows={4} value={form.description} onChange={handleChange} placeholder="Brief description of the bureau's mandate…" />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Contact Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Email"   name="email"   type="email" value={form.email}   onChange={handleChange} />
            <FormField label="Phone"   name="phone"   type="tel"   value={form.phone}   onChange={handleChange} />
            <FormField label="Address" name="address"             value={form.address}  onChange={handleChange} style={{ gridColumn: '1/-1' }} />
            <FormField label="Website" name="website" type="url"   value={form.website} onChange={handleChange} style={{ gridColumn: '1/-1' }} />
          </div>
        </div>

        <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
      </form>

      {/* Save confirmation */}
      <ConfirmModal
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={doSave}
        loading={saving}
        title="Save Bureau Profile"
        message="Are you sure you want to save these changes? The updated information will be publicly visible."
        confirmLabel="Save Changes"
        confirmVariant="primary"
      />
    </div>
  );
}
