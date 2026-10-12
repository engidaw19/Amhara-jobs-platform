/**
 * StatusBadge — renders a coloured pill badge for any status value.
 *
 * Covers job statuses, application statuses, user/bureau active flags.
 */

const JOB_STATUS = {
  draft:        { label: 'Draft',        variant: 'gray' },
  pending:      { label: 'Pending',      variant: 'warning' },
  published:    { label: 'Published',    variant: 'success' },
  closed:       { label: 'Closed',       variant: 'gray' },
  expired:      { label: 'Expired',      variant: 'gray' },
  rejected:     { label: 'Rejected',     variant: 'danger' },
  // doc lifecycle aliases
  submitted:    { label: 'Submitted',    variant: 'info' },
  under_review: { label: 'Under Review', variant: 'warning' },
  approved:     { label: 'Approved',     variant: 'success' },
  cancelled:    { label: 'Cancelled',    variant: 'danger' },
};

const APP_STATUS = {
  applied:      { label: 'Applied',      variant: 'info' },
  under_review: { label: 'Under Review', variant: 'warning' },
  shortlisted:  { label: 'Shortlisted',  variant: 'primary' },
  interview:    { label: 'Interview',    variant: 'secondary' },
  accepted:     { label: 'Accepted',     variant: 'success' },
  rejected:     { label: 'Rejected',     variant: 'danger' },
  withdrawn:    { label: 'Withdrawn',    variant: 'gray' },
};

const BOOL_STATUS = {
  true:  { label: 'Active',   variant: 'success' },
  false: { label: 'Inactive', variant: 'gray' },
};

const EMPLOYMENT_TYPE = {
  full_time:   { label: 'Full Time',   variant: 'primary' },
  part_time:   { label: 'Part Time',   variant: 'info' },
  contract:    { label: 'Contract',    variant: 'secondary' },
  internship:  { label: 'Internship',  variant: 'warning' },
  temporary:   { label: 'Temporary',   variant: 'gray' },
  volunteer:   { label: 'Volunteer',   variant: 'success' },
};

const ALL_MAP = { ...JOB_STATUS, ...APP_STATUS, ...EMPLOYMENT_TYPE };

export default function StatusBadge({ status, type = 'auto', label: labelOverride }) {
  const key = String(status).toLowerCase();

  let entry;
  if (type === 'bool') {
    entry = BOOL_STATUS[String(status === true || status === 1 || status === 'true' || status === '1')];
  } else if (type === 'job') {
    entry = JOB_STATUS[key];
  } else if (type === 'application') {
    entry = APP_STATUS[key];
  } else if (type === 'employment') {
    entry = EMPLOYMENT_TYPE[key];
  } else {
    entry = ALL_MAP[key];
  }

  const { label = labelOverride || key, variant = 'gray' } = entry || {};

  return (
    <span className={`badge badge-${variant}`}>
      {labelOverride || label}
    </span>
  );
}
