import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { useLang } from '../../context/LangContext';

export default function Contact() {
  const { t } = useLang();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ background: 'var(--color-primary)', color: '#fff', padding: 'var(--space-10) 0' }}>
        <div className="container">
          {/* Back button */}
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'rgba(255,255,255,.8)', fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-3)', textDecoration: 'none',
            }}
          >
            ← {t('Back to Home', 'ወደ መነሻ ተመለስ')}
          </Link>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>{t('Contact Us', 'ያግኙን')}</h1>
          <p style={{ opacity: .8, marginTop: 'var(--space-2)' }}>{t('Get in touch with the Amhara Jobs portal team', 'ከአማራ ጆብስ ፖርታል ቡድን ጋር ይገናኙ')}</p>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-12) var(--space-6)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-10)', alignItems: 'start',
          maxWidth: 900, margin: '0 auto',
        }}>
          {/* Form */}
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
              {t('Send a Message', 'መልዕክት ይላኩ')}
            </h2>

            {submitted ? (
              <Alert type="success">
                {t('Thank you for your message. We will get back to you soon.', 'ለመልዕክትዎ እናመሰግናለን። በቅርቡ ምላሽ እንሰጥዎታለን።')}
              </Alert>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
              >
                {/* type="text" — no numbers */}
                <FormField
                  label={t('Full Name', 'ሙሉ ስም')}
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
                <FormField
                  label={t('Email Address', 'ኢሜይል አድራሻ')}
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                <FormField
                  label={t('Subject', 'ርዕስ')}
                  name="subject"
                  type="text"
                  required
                  value={form.subject}
                  onChange={handleChange}
                />
                {/* textarea keeps placeholder */}
                <FormField
                  label={t('Message', 'መልዕክት')}
                  name="message"
                  type="textarea"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder={t('Write your message here…', 'መልዕክትዎን እዚህ ይጻፉ…')}
                />

                <Button type="submit" variant="primary">{t('Send Message', 'መልዕክት ይላኩ')}</Button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
              {t('Contact Information', 'የመገኛ መረጃ')}
            </h2>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[
                ['📍', 'Address', 'Bahir Dar, Amhara Regional State, Ethiopia'],
                ['📧', 'Email',   'info@amharajobs.gov.et'],
                ['📞', 'Phone',   '+251 58 220 0000'],
                ['🕐', 'Hours',   'Monday – Friday, 8:00 AM – 5:00 PM'],
              ].map(([icon, label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
