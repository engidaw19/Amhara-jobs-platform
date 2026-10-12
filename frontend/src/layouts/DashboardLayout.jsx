import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import { useLang } from '../context/LangContext';

/* ── Sidebar link definitions per role ───────────────────── */
const ADMIN_LINKS = [
  { section: 'Overview', links: [
    { to: '/admin',           icon: '📊', label: 'Dashboard', end: true },
  ]},
  { section: 'Account', links: [
    { to: '/change-password', icon: '🔒', label: 'Change Password' },
  ]},
  { section: 'Management', links: [
    { to: '/admin/jobs',         icon: '💼', label: 'Jobs & Approvals' },
    { to: '/admin/applications', icon: '📋', label: 'Applications' },
    { to: '/admin/bureaus',      icon: '🏛️', label: 'Bureaus' },
    { to: '/admin/users',        icon: '👥', label: 'Users' },
    { to: '/admin/locations',    icon: '📍', label: 'Locations' },
  ]},
  { section: 'Reports', links: [
    { to: '/admin/audit-logs', icon: '🔍', label: 'Audit Logs' },
    { to: '/admin/notifications', icon: '🔔', label: 'Notifications' },
  ]},
];

const BUREAU_LINKS = [
  { section: 'Overview', links: [
    { to: '/bureau',             icon: '📊', label: 'Dashboard', end: true },
  ]},
  { section: 'Account', links: [
    { to: '/change-password', icon: '🔒', label: 'Change Password' },
  ]},
  { section: 'Vacancies', links: [
    { to: '/bureau/jobs',        icon: '💼', label: 'My Jobs' },
    { to: '/bureau/jobs/create', icon: '➕', label: 'Post a Job' },
  ]},
  { section: 'Recruitment', links: [
    { to: '/bureau/applications', icon: '📋', label: 'Applications' },
  ]},
  { section: 'Bureau', links: [
    { to: '/bureau/profile',     icon: '🏛️', label: 'Bureau Profile' },
  ]},
];

const APPLICANT_LINKS = [
  { section: 'Overview', links: [
    { to: '/applicant',               icon: '📊', label: 'Dashboard', end: true },
  ]},
  { section: 'Account', links: [
    { to: '/change-password', icon: '🔒', label: 'Change Password' },
  ]},
  { section: 'Jobs', links: [
    { to: '/jobs',                    icon: '🔍', label: 'Find Jobs' },
    { to: '/applicant/applications',  icon: '📋', label: 'My Applications' },
  ]},
  { section: 'Documents', links: [
    { to: '/applicant/documents', icon: '📄', label: 'Application Documents' },
  ]},
  { section: 'Profile', links: [
    { to: '/applicant/profile',       icon: '👤', label: 'My Profile' },
    { to: '/applicant/notifications', icon: '🔔', label: 'Notifications' },
  ]},
];

function sectionsByRole(role) {
  if (role === 'super_admin' || role === 'regional_admin') return ADMIN_LINKS;
  if (role === 'bureau_admin' || role === 'bureau_staff') return BUREAU_LINKS;
  return APPLICANT_LINKS;
}

/* ── Top Navbar for dashboard ─────────────────────────────── */
function DashNavbar({ onToggle }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={onToggle}
            className="navbar-menu-toggle"
            style={{ display: 'flex' }}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <Link to="/" className="navbar-brand">
            Amhara <span>Jobs</span>
          </Link>
        </div>

        <div className="navbar-actions" style={{ gap: 'var(--space-3)' }}>
          <LanguageSelector />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
            {user?.full_name}
          </span>
          <span
            className="badge badge-primary"
            style={{ textTransform: 'capitalize' }}
          >
            {user?.role?.replace(/_/g, ' ')}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            {t('Sign Out', 'ውጣ')}
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ── Sidebar ──────────────────────────────────────────────── */
function Sidebar({ open, onClose, role }) {
  const sections = sectionsByRole(role);
  const { t } = useLang();
  const amharic = {
    Overview: 'አጠቃላይ እይታ', Account: 'መላው', Management: 'አስተዳደር', Reports: 'ሪፖርቶች',
    Vacancies: 'የሥራ ማስታወቂያዎች', Recruitment: 'ቅጥር', Bureau: 'ቢሮ', Jobs: 'ሥራዎች', Profile: 'ፕሮፋይል',
    Dashboard: 'ዳሽቦርድ', 'Jobs & Approvals': 'ሥራዎች እና ማጽደቂያ', Bureaus: 'ቢሮዎች', Users: 'ተጠቃሚዎች',
    Locations: 'አካባቢዎች', 'Audit Logs': 'የኦዲት መዝገቦች', Notifications: 'ማሳወቂያዎች', 'My Jobs': 'የእኔ ሥራዎች',
    'Post a Job': 'ሥራ ይለጥፉ', Applications: 'ማመልከቻዎች', 'Bureau Profile': 'የቢሮ ፕሮፋይል',
    'Find Jobs': 'ሥራ ፈልግ', 'My Applications': 'የእኔ ማመልከቻዎች', 'Application Documents': 'የማመልከቻ ሰኔዶች',
    'My Profile': 'የእኔ ፕሮፋይል', 'Change Password': 'የይለፍ ቃል ቀይር',
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`sidebar-backdrop${open ? ' open' : ''}`}
        aria-hidden="true"
      />
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Sidebar navigation">
        {sections.map((sec) => (
          <div key={sec.section} className="sidebar-section">
            <p className="sidebar-section-label">{t(sec.section, amharic[sec.section])}</p>
            {sec.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-icon" aria-hidden="true">{link.icon}</span>
                {t(link.label, amharic[link.label])}
                {link.badge > 0 && (
                  <span className="sidebar-badge">{link.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
    </>
  );
}

/* ── Main Layout ──────────────────────────────────────────── */
export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <DashNavbar onToggle={() => setSidebarOpen((o) => !o)} />
      <div className="dash-layout">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          role={user?.role}
        />
        <main className="dash-main">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
