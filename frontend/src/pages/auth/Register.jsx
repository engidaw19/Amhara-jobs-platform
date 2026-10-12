import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import LanguageSelector from '../../components/LanguageSelector';
import { useLang } from '../../context/LangContext';

export default function Register() {
  const { login } = useAuth();
  const { t } = useLang();
  const { success } = useToast();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ full_name: '', email: '', phone: '', password: '', password_confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]  = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: '' }));
    setApiError('');
  }

  function validate() {
    const errs = {};
    if (!form.full_name.trim())   errs.full_name = 'Full name is required.';
    if (!form.email.trim())       errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password)           errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.password_confirm) errs.password_confirm = 'Passwords do not match.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const res = await api.register({
        full_name: form.full_name,
        email:     form.email,
        phone:     form.phone || undefined,
        password:  form.password,
      });
      const user  = res.user  || res.data;
      const token = res.token || res.access_token;
      if (user && token) {
        login(user, token);
        success('Account created! Welcome to Amhara Jobs.');
        navigate('/applicant', { replace: true });
      } else {
        success('Account created! Please sign in.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
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
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Back */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)',
              textDecoration: 'none',
            }}
          >
            ← {t('Back to Home', 'ወደ መነሻ ተመለስ')}
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <Link to="/" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
            Amhara <span style={{ color: 'var(--color-secondary)' }}>Jobs</span>
          </Link>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginTop: 'var(--space-4)', color: 'var(--color-gray-900)' }}>
            {t('Create your account', 'መለያዎን ይፍጠሩ')}
          </h1>
        </div>

        <div className="card">
          {apiError && (
            <Alert type="danger" onClose={() => setApiError('')} style={{ marginBottom: 'var(--space-4)' }}>
              {apiError}
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            autoComplete="on"
          >
            <FormField label={t('Full Name', 'ሙሉ ስም')} name="full_name" type="text" required value={form.full_name} onChange={handleChange} error={errors.full_name} autoComplete="name" />
            <FormField label={t('Email Address', 'ኢሜይል አድራሻ')} name="email" type="email" required value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
            <FormField label={t('Phone Number', 'ስልክ ቁጥር')} name="phone" type="tel" value={form.phone} onChange={handleChange} helper={t('Optional — used for application notifications', 'አማራጭ — ስለ ማመልከቻ ማሳወቂያዎች ለመላክ ይጠቅማል')} autoComplete="tel" />
            <FormField label={t('Password', 'የይለፍ ቃል')} name="password" type="password" required value={form.password} onChange={handleChange} error={errors.password} autoComplete="new-password" />
            <FormField label={t('Confirm Password', 'የይለፍ ቃሉን ያረጋግጡ')} name="password_confirm" type="password" required value={form.password_confirm} onChange={handleChange} error={errors.password_confirm} autoComplete="new-password" />

            <Button type="submit" variant="primary" block loading={loading}>
              {t('Create Account', 'መለያ ይፍጠሩ')}
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
            {t('Already have an account?', 'ቀድሞውኑ መለያ አለዎት?')}{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{t('Sign in', 'ይግቡ')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
