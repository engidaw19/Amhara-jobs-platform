import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Modal, { ConfirmModal } from '../../components/Modal';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import { validateFormValues } from '../../utils/validation';

export default function AdminLocations() {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [tab, setTab]             = useState('zones');
  const [zones, setZones]         = useState([]);
  const [woredas, setWoredas]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState({ name_en: '', name_am: '', zone_id: '' });
  const [saving, setSaving]       = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  const loadZones = useCallback(() => {
    setLoading(true);
    api.getZones()
      .then(res => setZones(res.zones || res.data || []))
      .catch(() => setZones([]))
      .finally(() => setLoading(false));
  }, []);

  const loadWoredas = useCallback(() => {
    setLoading(true);
    api.getZoneTree()
      .then(res => {
        const tree = res.zones || res.data || [];
        setWoredas(tree.flatMap(z => (z.woredas || []).map(w => ({ ...w, zone_name: z.name_en }))));
      })
      .catch(() => setWoredas([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'zones') loadZones(); else loadWoredas();
  }, [tab, loadZones, loadWoredas]);

  function openCreate() { setEditItem(null); setForm({ name_en: '', name_am: '', zone_id: '' }); setShowModal(true); }
  function openEdit(item) { setEditItem(item); setForm({ name_en: item.name_en, name_am: item.name_am || '', zone_id: item.zone_id || '' }); setShowModal(true); }
  function handleChange(e) { const { name, value } = e.target; setForm(f => ({ ...f, [name]: value })); }

  async function doSave() {
    const errors = validateFormValues(form, [
      { name: 'name_en', label: 'English name', required: true },
      { name: 'name_am', label: 'Amharic name' },
      ...(tab === 'woredas' ? [{ name: 'zone_id', type: 'select', label: 'Zone', required: true, options: zones.map(z => ({ value: z.id })) }] : []),
    ]);
    if (Object.keys(errors).length) { toastError(Object.values(errors)[0]); setConfirmSave(false); return; }
    setSaving(true);
    try {
      if (tab === 'zones') {
        editItem
          ? await api.updateZone(editItem.id, { name_en: form.name_en, name_am: form.name_am })
          : await api.createZone({ name_en: form.name_en, name_am: form.name_am });
        success(`Zone ${editItem ? 'updated' : 'created'}.`);
        loadZones();
      } else {
        await api.createWoreda({ id: editItem?.id, name_en: form.name_en, name_am: form.name_am, zone_id: form.zone_id, _update: !!editItem });
        success(`Woreda ${editItem ? 'updated' : 'created'}.`);
        loadWoredas();
      }
      setShowModal(false);
      setConfirmSave(false);
    } catch (err) {
      toastError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  const items = tab === 'zones' ? zones : woredas;
  const entity = tab === 'zones' ? 'Zone' : 'Woreda';

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
          <h1 className="page-title">Locations</h1>
          <p className="page-subtitle">Manage geographic zones and woredas.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>➕ Add {entity}</Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
        {['zones', 'woredas'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon="📍" title={`No ${entity}s`} description="None have been added yet."
          action={<Button variant="primary" onClick={openCreate}>Add First {entity}</Button>} />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name (English)</th><th>Name (Amharic)</th>
                  {tab === 'woredas' && <th>Zone</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.name_en}</td>
                    <td style={{ color: 'var(--color-gray-600)' }}>{item.name_am || '—'}</td>
                    {tab === 'woredas' && <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{item.zone_name}</td>}
                    <td><button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entry modal */}
      <Modal
        open={showModal && !confirmSave}
        onClose={() => setShowModal(false)}
        title={`${editItem ? 'Edit' : 'Add'} ${entity}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={() => {
              const errors = validateFormValues(form, [
                { name: 'name_en', label: 'English name', required: true },
                { name: 'name_am', label: 'Amharic name' },
                ...(tab === 'woredas' ? [{ name: 'zone_id', type: 'select', label: 'Zone', required: true, options: zones.map(z => ({ value: z.id })) }] : []),
              ]);
              if (Object.keys(errors).length) { toastError(Object.values(errors)[0]); return; }
              setConfirmSave(true);
            }}>{editItem ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {tab === 'woredas' && (
            <FormField label="Zone" name="zone_id" type="select" required value={form.zone_id} onChange={handleChange}
              options={zones.map(z => ({ value: z.id, label: z.name_en }))} placeholder="Select zone" />
          )}
          <FormField label="Name (English)" name="name_en" required value={form.name_en} onChange={handleChange} />
          <FormField label="Name (Amharic)" name="name_am" value={form.name_am} onChange={handleChange} />
        </div>
      </Modal>

      {/* Confirm save */}
      <ConfirmModal
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={doSave}
        loading={saving}
        title={`${editItem ? 'Update' : 'Create'} ${entity}`}
        message={editItem
          ? `Save changes to "${form.name_en}"?`
          : `Create a new ${entity.toLowerCase()} "${form.name_en}"?`}
        confirmLabel={editItem ? 'Save Changes' : `Create ${entity}`}
        confirmVariant="primary"
      />
    </div>
  );
}
