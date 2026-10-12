import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import LanguageSelector from '../../components/LanguageSelector';
import { useLang } from '../../context/LangContext';

export default function ChangePassword() {
  const { user, updateUser } = useAuth();
  const { t } = useLang();
  const { success } = useToast();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ current_password: '', new_password: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const isForced = user?.must_change_pw;

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '' }));
    setApiError('');
  }

  function validate() {
    const errs = {};
    if (!form.current_password) errs.current_password = 'Current password is required.';
    if (!form.new_password)     errs.new_password = 'New password is required.';
    else if (form.new_password.length < 8) errs.new_password = 'Must be at least 8 characters.';
    if (form.new_password !== form.confirm) errs.confirm = 'Passwords do not match.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      await api.changePassword({ current_password: form.current_password, new_password: form.new_password });
      success('Password changed successfully!');
      updateUser({ must_change_pw: false });
      const dest = user.role === 'super_admin' || user.role === 'regional_admin' ? '/admin'
        : user.role === 'bureau_admin' || user.role === 'bureau_staff' ? '/bureau'
        : '/applicant';
      navigate(dest, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-gray-50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div style={{ position: 'fixed', top: 'var(--space-4)', right: 'var(--space-4)', zIndex: 10 }}><LanguageSelector /></div>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Back — hidden when forced */}
        {!isForced && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)',
                padding: 0,
              }}
            >
              ← Go Back
            </button>
          </div>
        )}

        <div className="card">
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            {t('Change Password', 'የይለፍ ቃል ቀይር')}
          </h1>

          {isForced && (
            <Alert type="warning" style={{ marginBottom: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
              This account uses a temporary password. Set a new password before continuing.
            </Alert>
          )}
          {apiError && (
            <Alert type="danger" onClose={() => setApiError('')} style={{ marginBottom: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
              {apiError}
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}
            autoComplete="on"
          >
            <FormField
              label={t('Current Password', 'የአሁኑ የይለፍ ቃል')}
              name="current_password"
              type="password"
              required
              value={form.current_password}
              onChange={handleChange}
              error={errors.current_password}
              autoComplete="current-password"
            />
            <FormField
              label={t('New Password', 'አዲስ የይለፍ ቃል')}
              name="new_password"
              type="password"
              required
              value={form.new_password}
              onChange={handleChange}
              error={errors.new_password}
              helper={t('At least 8 characters', 'ቢያንስ 8 ቁምፊዎች')}
              autoComplete="new-password"
            />
            <FormField
              label={t('Confirm New Password', 'አዲሱን የይለፍ ቃል ያረጋግጡ')}
              name="confirm"
              type="password"
              required
              value={form.confirm}
              onChange={handleChange}
              error={errors.confirm}
              autoComplete="new-password"
            />
            <Button type="submit" variant="primary" block loading={loading}>
              {t('Update Password', 'የይለፍ ቃሉን አዘምን')}
            </Button>
          </form>

          {!isForced && (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 'var(--space-2)' }}
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
