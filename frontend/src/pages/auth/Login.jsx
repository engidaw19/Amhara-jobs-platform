import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { VALIDATION_PATTERNS } from '../../utils/validation';
import LanguageSelector from '../../components/LanguageSelector';
import { useLang } from '../../context/LangContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const [form, setForm]       = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await api.login(form);
      const user  = res.user  || res.data;
      const token = res.token || res.access_token;

      // remember-me: persist vs session-only
      if (rememberMe) {
        localStorage.setItem('ajp_token', token);
        localStorage.setItem('ajp_user',  JSON.stringify(user));
      } else {
        sessionStorage.setItem('ajp_token', token);
        sessionStorage.setItem('ajp_user',  JSON.stringify(user));
        // remove any stale localStorage copy
        localStorage.removeItem('ajp_token');
        localStorage.removeItem('ajp_user');
      }

      login(user, token);
      success(`Welcome back, ${user.full_name?.split(' ')[0] || 'User'}!`);

      if (user.must_change_pw) {
        navigate('/change-password', { replace: true });
        return;
      }
      const dest = from || (
        user.role === 'super_admin' || user.role === 'regional_admin' ? '/admin' :
        user.role === 'bureau_admin' || user.role === 'bureau_staff'  ? '/bureau' :
        '/applicant'
      );
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
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
        {/* Back to home */}
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
            {t('Sign in to your account', 'ወደ መለያዎ ይግቡ')}
          </h1>
        </div>

        <div className="card">
          {error && (
            <Alert type="danger" onClose={() => setError('')} style={{ marginBottom: 'var(--space-4)' }}>
              {error}
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            autoComplete="on"
          >
            {/* No placeholder — label is sufficient */}
            <FormField
              label={t('Email Address', 'ኢሜይል አድራሻ')}
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />

            {/* Password — toggle handled inside FormField */}
            <FormField
              label={t('Password', 'የይለፍ ቃል')}
              name="password"
              type="password"
              validationPattern={VALIDATION_PATTERNS.passwordCurrent}
              required
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

            {/* Remember me */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              cursor: 'pointer', userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                {t('Remember me on this device', 'በዚህ መሣሪያ ላይ አስታውሰኝ')}
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              block
              loading={loading}
              disabled={!form.email || !form.password}
            >
              {t('Sign In', 'ግባ')}
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
            {t('Don\'t have an account?', 'መለያ የለዎትም?')}{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{t('Register here', 'እዚህ ይመዝገቡ')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
