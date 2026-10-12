import { useState } from 'react';
import { getValidationPattern, validateFieldValue } from '../utils/validation';

/**
 * FormField — label + input/select/textarea + helper/error.
 *
 * Changes:
 *  - Password fields get a show/hide toggle eye icon.
 *  - `placeholder` prop is intentionally NOT forwarded to text/number/email/tel/url inputs.
 *    Placeholders are only rendered for textarea and select (as the empty option label).
 *    This keeps inputs clean and forces the label to carry all context.
 */
export default function FormField({
  label,
  required = false,
  error,
  helper,
  id,
  name,
  type = 'text',
  validationPattern,
  options,
  placeholder,   // used only for select empty-option & textarea
  className = '',
  rows = 4,
  value,
  onChange,
  disabled = false,
  onBlur,
  min,
  max,
  ...rest
}) {
  const [showPw, setShowPw] = useState(false);

  const fieldId   = id || name;
  const isPassword = type === 'password';
  const inputType  = isPassword ? (showPw ? 'text' : 'password') : type;
  const fieldPattern = validationPattern || getValidationPattern(type, name);

  function validateControl(e) {
    const valid = validateFieldValue(e.currentTarget.value, {
      type,
      name,
      required,
      options,
      pattern: fieldPattern,
      min,
      max,
    });
    e.currentTarget.setCustomValidity(valid ? '' : `Please enter a valid ${label || name}.`);
  }

  function handleChange(e) {
    validateControl(e);
    onChange?.(e);
  }

  const baseCls = (base) => `${base}${error ? ' error' : ''}`;

  const ariaDesc = error
    ? `${fieldId}-error`
    : helper
    ? `${fieldId}-helper`
    : undefined;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && <span className="required" aria-hidden="true"> *</span>}
        </label>
      )}

      {/* ── SELECT ─────────────────────────────────────────── */}
      {type === 'select' ? (
        <select
          id={fieldId}
          name={name}
          className={baseCls('form-select')}
          required={required}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-describedby={ariaDesc}
          aria-invalid={!!error}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {(options || []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

      /* ── TEXTAREA ───────────────────────────────────────── */
      ) : type === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          rows={rows}
          className={baseCls('form-textarea')}
          required={required}
          maxLength={10000}
          placeholder={placeholder}   /* textarea keeps placeholder */
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-describedby={ariaDesc}
          aria-invalid={!!error}
          {...rest}
        />

      /* ── PASSWORD (with toggle) ─────────────────────────── */
      ) : isPassword ? (
        <div style={{ position: 'relative' }}>
          <input
            id={fieldId}
            name={name}
            type={inputType}
            className={baseCls('form-input')}
            required={required}
            min={min}
            max={max}
            pattern={fieldPattern}
            title={`Please enter a valid ${label || name}.`}
            style={{ paddingRight: '2.5rem' }}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            aria-describedby={ariaDesc}
            aria-invalid={!!error}
            autoComplete={rest.autoComplete || 'current-password'}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            disabled={disabled}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '0.65rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 2px',
              color: 'var(--color-gray-400)',
              fontSize: '1.05rem',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPw ? (
              /* Eye-off icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              /* Eye icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>

      /* ── ALL OTHER INPUTS (no placeholder) ──────────────── */
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          className={baseCls('form-input')}
          required={required}
          min={min}
          max={max}
          pattern={type === 'number' || type === 'date' ? undefined : fieldPattern}
          title={`Please enter a valid ${label || name}.`}
          /* No placeholder — label carries all context */
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-describedby={ariaDesc}
          aria-invalid={!!error}
          {...rest}
        />
      )}

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">{error}</span>
      )}
      {!error && helper && (
        <span id={`${fieldId}-helper`} className="form-helper">{helper}</span>
      )}
    </div>
  );
}
