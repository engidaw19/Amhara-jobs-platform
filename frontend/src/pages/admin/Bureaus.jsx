import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Modal, { ConfirmModal } from '../../components/Modal';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import { validateFormValues } from '../../utils/validation';

const EMPTY = { name_en:'', name_am:'', short_code:'', description:'', email:'', phone:'', address:'', website:'', is_active: true };

export default function AdminBureaus() {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [bureaus, setBureaus]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBureau, setEditBureau] = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getBureaus()
      .then(res => setBureaus(res.bureaus || res.data || []))
      .catch(() => setBureaus([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditBureau(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(b)  {
    setEditBureau(b);
    setForm({ name_en: b.name_en, name_am: b.name_am||'', short_code: b.short_code||'', description: b.description||'', email: b.email||'', phone: b.phone||'', address: b.address||'', website: b.website||'', is_active: !!b.is_active });
    setShowModal(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function doSave() {
    const errors = validateFormValues(form, [
      { name: 'name_en', label: 'Bureau name', required: true },
      { name: 'name_am', label: 'Amharic name' },
      { name: 'short_code', label: 'Short code' },
      { name: 'email', type: 'email', label: 'Email' },
      { name: 'phone', type: 'tel', label: 'Phone' },
      { name: 'website', type: 'url', label: 'Website' },
      { name: 'address', label: 'Address' },
      { name: 'description', type: 'textarea', label: 'Description' },
    ]);
    if (Object.keys(errors).length) { toastError(Object.values(errors)[0]); setConfirmSave(false); return; }
    setSaving(true);
    try {
      if (editBureau) {
        await api.updateBureau(editBureau.id, form);
        success('Bureau updated.');
      } else {
        await api.createBureau(form);
        success('Bureau created.');
      }
      setShowModal(false);
      setConfirmSave(false);
      load();
    } catch (err) {
      toastError(err.message || 'Failed to save bureau.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
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

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="page-title">Bureaus</h1>
          <p className="page-subtitle">Manage participating government bureaus.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>➕ Add Bureau</Button>
      </div>

      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : bureaus.length === 0 ? (
        <EmptyState icon="🏛️" title="No Bureaus" description="No bureaus registered yet."
          action={<Button variant="primary" onClick={openCreate}>Add First Bureau</Button>} />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead><tr><th>Bureau</th><th>Code</th><th>Active Jobs</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {bureaus.map(b => (
                  <tr key={b.id}>
                    <td>
                      <p style={{ fontWeight: 500 }}>{b.name_en}</p>
                      {b.name_am && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>{b.name_am}</p>}
                    </td>
                    <td><span className="badge badge-gray">{b.short_code || '—'}</span></td>
                    <td style={{ textAlign: 'center' }}>{b.active_jobs ?? 0}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{b.email || '—'}</td>
                    <td><StatusBadge status={b.is_active} type="bool" /></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={showModal && !confirmSave}
        onClose={() => setShowModal(false)}
        title={editBureau ? 'Edit Bureau' : 'Create Bureau'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={() => {
              const errors = validateFormValues(form, [
                { name: 'name_en', label: 'Bureau name', required: true },
                { name: 'name_am', label: 'Amharic name' },
                { name: 'short_code', label: 'Short code' },
                { name: 'email', type: 'email', label: 'Email' },
                { name: 'phone', type: 'tel', label: 'Phone' },
                { name: 'website', type: 'url', label: 'Website' },
                { name: 'address', label: 'Address' },
                { name: 'description', type: 'textarea', label: 'Description' },
              ]);
              if (Object.keys(errors).length) { toastError(Object.values(errors)[0]); return; }
              setConfirmSave(true);
            }}>
              {editBureau ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Name (English)" name="name_en" required value={form.name_en} onChange={handleChange} style={{ gridColumn: '1/-1' }} />
          <FormField label="Name (Amharic)" name="name_am" value={form.name_am} onChange={handleChange} style={{ gridColumn: '1/-1' }} />
          <FormField label="Short Code"     name="short_code" value={form.short_code} onChange={handleChange} />
          <FormField label="Email"          name="email"    type="email" value={form.email}   onChange={handleChange} />
          <FormField label="Phone"          name="phone"    type="tel"   value={form.phone}   onChange={handleChange} />
          <FormField label="Website"        name="website"  type="url"   value={form.website} onChange={handleChange} />
          <FormField label="Address"        name="address"              value={form.address}  onChange={handleChange} style={{ gridColumn: '1/-1' }} />
          <FormField label="Description"    name="description" type="textarea" rows={3} value={form.description} onChange={handleChange} style={{ gridColumn: '1/-1' }} placeholder="Brief description of the bureau…" />
          {editBureau && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', gridColumn: '1/-1', cursor: 'pointer' }}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
              <span className="form-label" style={{ margin: 0 }}>Active</span>
            </label>
          )}
        </div>
      </Modal>

      {/* Confirm save */}
      <ConfirmModal
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={doSave}
        loading={saving}
        title={editBureau ? 'Confirm Bureau Update' : 'Confirm Bureau Creation'}
        message={editBureau
          ? `Save changes to "${form.name_en}"? This will update the bureau's public profile.`
          : `Create a new bureau "${form.name_en}"?`}
        confirmLabel={editBureau ? 'Save Changes' : 'Create Bureau'}
        confirmVariant="primary"
      />
    </div>
  );
}
