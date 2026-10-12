export const VALIDATION_PATTERNS = {
    phone: String.raw`(?:\+?[0-9][0-9 ()-]{5,19}|0[0-9 ()-]{8,13})`,
  email: String.raw`[A-Za-z0-9.!#$%&'*+/=?^_{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+`,
  name: String.raw`[\p{L}\p{M}][\p{L}\p{M}\p{N} .’'&()\-]{0,99}`,
  password: String.raw`.{8,128}`,
  passwordCurrent: String.raw`[\s\S]+`,
  shortCode: String.raw`[A-Za-z0-9][A-Za-z0-9_-]{0,19}`,
  text: String.raw`[^\u0000-\u001F\u007F<>]{0,500}`,
  textarea: String.raw`[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]{0,10000}`,
  integer: String.raw`[0-9]+`,
  decimal: String.raw`[0-9]+(?:\.[0-9]{1,2})?`,
  date: String.raw`\d{4}-\d{2}-\d{2}`,
  url: String.raw`https?:\/\/(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?::[0-9]{1,5})?(?:[/?#][^\s]*)?`,
};

const NAME_FIELDS = new Set([
  'full_name', 'name', 'name_en', 'name_am', 'title_en', 'title_am', 'headline',
]);

export function getValidationPattern(type = 'text', name = '') {
  if (type === 'email' || name === 'email') return VALIDATION_PATTERNS.email;
  if (type === 'tel' || name === 'phone') return VALIDATION_PATTERNS.phone;
  if (type === 'url' || name === 'website') return VALIDATION_PATTERNS.url;
  if (type === 'password') return name === 'current_password' ? VALIDATION_PATTERNS.passwordCurrent : VALIDATION_PATTERNS.password;
  if (name === 'short_code') return VALIDATION_PATTERNS.shortCode;
  if (type === 'number') {
    return ['positions', 'experience_years'].includes(name)
      ? VALIDATION_PATTERNS.integer
      : VALIDATION_PATTERNS.decimal;
  }
  if (type === 'date') return VALIDATION_PATTERNS.date;
  if (NAME_FIELDS.has(name)) return VALIDATION_PATTERNS.name;
  if (type === 'textarea') return VALIDATION_PATTERNS.textarea;
  return VALIDATION_PATTERNS.text;
}

export function validateFieldValue(value, { type = 'text', name = '', required = false, options, pattern, min, max } = {}) {
  const text = String(value ?? '');
  if (!text.length || (type !== 'password' && !text.trim())) return !required;
  if (type === 'select' && options?.length) {
    return options.some(option => String(option.value) === text);
  }
  const valuePattern = pattern || getValidationPattern(type, name);
  try {
    if (!new RegExp(`^(?:${valuePattern})$`, 'u').test(text)) return false;
    if (type === 'number' && ((min !== undefined && Number(text) < min) || (max !== undefined && Number(text) > max))) return false;
    if (type === 'date') {
      const parsed = new Date(`${text}T00:00:00Z`);
      if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function validateFormValues(values, fields) {
  return fields.reduce((errors, field) => {
    if (!validateFieldValue(values[field.name], field)) {
      errors[field.name] = field.message || `Please enter a valid ${field.label || field.name}.`;
    }
    return errors;
  }, {});
}
