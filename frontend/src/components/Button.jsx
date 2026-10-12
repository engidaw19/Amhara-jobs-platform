import { Link } from 'react-router-dom';

/**
 * Polymorphic button — renders <button> by default, or <Link> when `to` is set,
 * or <a> when `href` is set.
 *
 * Props:
 *   variant  : 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
 *   size     : 'sm' | 'md' | 'lg'
 *   block    : boolean — full width
 *   loading  : boolean — shows spinner, disables button
 *   to       : string  — renders as react-router <Link>
 *   href     : string  — renders as <a>
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  to,
  href,
  className = '',
  ...rest
}) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}
