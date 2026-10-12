/**
 * Spinner — inline loading indicator.
 * size: 'sm' (1em) | 'md' (1.5em) | 'lg' (2.5em)
 * fullPage: centers in viewport
 */
export default function Spinner({ size = 'md', fullPage = false, label = 'Loading…' }) {
  const style =
    size === 'sm'
      ? { width: '1rem', height: '1rem', borderWidth: '2px' }
      : size === 'lg'
      ? { width: '2.5rem', height: '2.5rem', borderWidth: '3px' }
      : { width: '1.5rem', height: '1.5rem', borderWidth: '2px' };

  const spinner = (
    <span
      className="spinner"
      style={{
        ...style,
        color: 'var(--color-primary)',
        display: 'inline-block',
        flexShrink: 0,
      }}
      role="status"
      aria-label={label}
    />
  );

  if (fullPage) {
    return (
      <div className="loading-page">
        {spinner}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return spinner;
}

/**
 * PageLoader — centered full-page loading state.
 */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="loading-page" role="status" aria-live="polite">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Spinner size="lg" />
        <span style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>{label}</span>
      </div>
    </div>
  );
}
