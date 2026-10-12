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
import { getValidationPattern, validateFormValues } from '../../utils/validation';

const ROLE_OPTS = [
  { value: 'job_seeker',     label: 'Job Seeker' },
  { value: 'bureau_admin',   label: 'Bureau Admin' },
  { value: 'bureau_staff',   label: 'Bureau Staff' },
  { value: 'regional_admin', label: 'Regional Admin' },
  { value: 'super_admin',    label: 'Super Admin' },
];
const EMPTY_FORM = { full_name: '', email: '', phone: '', role: 'job_seeker', bureau_id: '', is_active: true };

export default function AdminUsers() {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [users, setUsers]     = useState([]);
  const [bureaus, setBureaus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [showModal, setShowModal]   = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [viewUser, setViewUser]      = useState(null);
  const [openUserMenu, setOpenUserMenu] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  // Reset password confirm
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getUsers({ q: q || undefined, role: roleFilter || undefined })
      .then(res => setUsers(res.users || res.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [q, roleFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.getBureaus().then(res => setBureaus(res.bureaus || res.data || [])).catch(() => {});
  }, []);

  function openCreate() { setEditUser(null); setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true); }
  function openEdit(u)  { setEditUser(u); setOpenUserMenu(null); setForm({ full_name: u.full_name, email: u.email, phone: u.phone||'', role: u.role, bureau_id: u.bureau_id||'', is_active: u.is_active }); setFormErrors({}); setShowModal(true); }
  function openView(u)  { setViewUser(u); setOpenUserMenu(null); }
  function openReset(u) { setResetTarget(u); setOpenUserMenu(null); }

  async function toggleSuspend(u) {
    setOpenUserMenu(null);
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      success(u.is_active ? `${u.full_name} has been suspended.` : `${u.full_name} has been activated.`);
      load();
    } catch (err) {
      toastError(err.message || 'Failed to update account status.');
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setFormErrors(er => ({ ...er, [name]: '' }));
  }

  function validate() {
    return validateFormValues(form, [
      { name: 'full_name', label: 'Full name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'phone', type: 'tel', label: 'Phone' },
      { name: 'role', type: 'select', label: 'Role', required: true, options: ROLE_OPTS },
      ...(bureauNeeded ? [{ name: 'bureau_id', type: 'select', label: 'Bureau', required: true, options: bureaus.map(b => ({ value: b.id })) }] : []),
    ]);
  }

  async function doSave() {
    const errors = validate();
    if (Object.keys(errors).length) { setFormErrors(errors); setConfirmSave(false); return; }
    setSaving(true);
    try {
      const payload = { ...form, bureau_id: form.bureau_id || undefined };
      if (editUser) {
        await api.updateUser(editUser.id, payload);
        success('User updated.');
      } else {
        const res = await api.createUser(payload);
        const temporaryPassword = res.temporaryPassword || res.data?.temporaryPassword || res.temp_password || res.data?.temp_password;
        success(temporaryPassword
          ? `User created and activated. They must change the password from “${temporaryPassword}” before continuing.`
          : 'User created and activated. The user must change the temporary password before continuing.');
      }
      setShowModal(false);
      setConfirmSave(false);
      load();
    } catch (err) {
      toastError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  }

  async function doReset() {
    setResetting(true);
    try {
      const res = await api.resetPassword(resetTarget.id);
      const temporaryPassword = res.temporaryPassword || res.data?.temporaryPassword || res.temp_password || res.data?.temp_password;
      if (temporaryPassword) {
        success(`Temporary password set for ${resetTarget.full_name}: “${temporaryPassword}”. The user must change it at next login.`);
      } else {
        success(`Temporary password set for ${resetTarget.full_name}. The user must change it at next login.`);
      }
    } catch (err) {
      toastError(err.message || 'Failed to reset password.');
    } finally {
      setResetting(false);
      setResetTarget(null);
    }
  }

  const bureauNeeded = ['bureau_admin', 'bureau_staff'].includes(form.role);

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
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage all platform user accounts.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>➕ Add User</Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ flex: 1, minWidth: 200 }} pattern={getValidationPattern('text')} title="Use up to 500 standard text characters." placeholder="Search by name or email…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="form-select" style={{ width: 180 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No Users Found" description="No users match the current filter." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Bureau</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{u.email}</td>
                    <td><span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{u.role.replace(/_/g,' ')}</span></td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{u.bureau_name || '—'}</td>
                    <td><StatusBadge status={u.is_active} type="bool" /></td>
                    <td style={{ position: 'relative', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label={`Open actions for ${u.full_name}`}
                        aria-haspopup="menu"
                        aria-expanded={openUserMenu === u.id}
                        onClick={() => setOpenUserMenu(openUserMenu === u.id ? null : u.id)}
                      >
                        ⋯
                      </button>
                      {openUserMenu === u.id && (
                        <div
                          role="menu"
                          style={{
                            position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 10,
                            display: 'flex', flexDirection: 'column', minWidth: 150,
                            padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                            background: 'var(--color-white)', border: '1px solid var(--color-gray-200)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                          }}
                        >
                          <button type="button" role="menuitem" className="btn btn-ghost btn-sm" onClick={() => openReset(u)}>Reset Password</button>
                          <button type="button" role="menuitem" className="btn btn-ghost btn-sm" onClick={() => openView(u)}>View</button>
                          <button type="button" role="menuitem" className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>
                          <button type="button" role="menuitem" className="btn btn-ghost btn-sm" onClick={() => toggleSuspend(u)}>{u.is_active ? 'Suspend' : 'Activate'}</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={showModal && !confirmSave}
        onClose={() => setShowModal(false)}
        title={editUser ? 'Edit User' : 'Create User'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={() => {
              const errors = validate();
              setFormErrors(errors);
              if (Object.keys(errors).length) return;
              setConfirmSave(true);
            }}>
              {editUser ? 'Save Changes' : 'Create User'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Full Name" name="full_name" required value={form.full_name} onChange={handleChange} error={formErrors.full_name} />
          <FormField label="Email"     name="email"     type="email" required value={form.email} onChange={handleChange} error={formErrors.email} disabled={!!editUser} />
          <FormField label="Phone"     name="phone"     type="tel"   value={form.phone}  onChange={handleChange} />
          <FormField label="Role"      name="role"      type="select" required value={form.role} onChange={handleChange} options={ROLE_OPTS} />
          {bureauNeeded && (
            <FormField label="Bureau" name="bureau_id" type="select" required value={form.bureau_id} onChange={handleChange}
              options={bureaus.map(b => ({ value: b.id, label: b.name_en }))} placeholder="Select bureau" />
          )}
          {editUser && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
              <span className="form-label" style={{ margin: 0 }}>Account Active</span>
            </label>
          )}
        </div>
      </Modal>

      <Modal
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        title={viewUser ? `${viewUser.full_name}'s Account` : 'User Account'}
        hideClose={false}
      >
        {viewUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div><strong>Name:</strong> {viewUser.full_name}</div>
            <div><strong>Email:</strong> {viewUser.email}</div>
            <div><strong>Role:</strong> {viewUser.role.replace(/_/g, ' ')}</div>
            <div><strong>Bureau:</strong> {viewUser.bureau_name || '—'}</div>
            <div><strong>Status:</strong> {viewUser.is_active ? 'Active' : 'Suspended'}</div>
          </div>
        )}
        <div style={{ marginTop: 'var(--space-4)', textAlign: 'right' }}>
          <Button variant="ghost" onClick={() => setViewUser(null)}>Close</Button>
        </div>
      </Modal>

      {/* Confirm save */}
      <ConfirmModal
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={doSave}
        loading={saving}
        title={editUser ? 'Confirm User Update' : 'Confirm User Creation'}
        message={editUser
          ? `Save changes to ${form.full_name}'s account?`
          : `Create a new ${form.role.replace(/_/g,' ')} account for ${form.full_name}? The shared temporary password “Admin@1234” will be assigned and must be changed after login.`}
        confirmLabel={editUser ? 'Save Changes' : 'Create User'}
        confirmVariant="primary"
      />

      {/* Reset password confirm */}
      <ConfirmModal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={doReset}
        loading={resetting}
        title="Reset Password"
        message={`Reset the password for ${resetTarget?.full_name}? The shared temporary password “Admin@1234” will be used and they will be required to change it on next login.`}
        confirmLabel="Reset Password"
        confirmVariant="warning"
      />
    </div>
  );
}
