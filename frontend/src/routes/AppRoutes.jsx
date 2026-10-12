import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/Spinner';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

/* ── Lazy page imports ────────────────────────────────────── */
// Public
const Home         = lazy(() => import('../pages/public/Home'));
const JobsList     = lazy(() => import('../pages/public/JobsList'));
const JobDetail    = lazy(() => import('../pages/public/JobDetail'));
const BureauList   = lazy(() => import('../pages/public/BureauList'));
const BureauDetail = lazy(() => import('../pages/public/BureauDetail'));
const About        = lazy(() => import('../pages/public/About'));
const Contact      = lazy(() => import('../pages/public/Contact'));

// Auth
const Login          = lazy(() => import('../pages/auth/Login'));
const Register       = lazy(() => import('../pages/auth/Register'));
const ChangePassword = lazy(() => import('../pages/auth/ChangePassword'));

// Applicant
const ApplicantDashboard       = lazy(() => import('../pages/applicant/Dashboard'));
const ApplicantProfile         = lazy(() => import('../pages/applicant/Profile'));
const ApplicantApplications    = lazy(() => import('../pages/applicant/Applications'));
const ApplicantDocuments       = lazy(() => import('../pages/applicant/ApplicationDocuments'));
const ApplicantNotifications   = lazy(() => import('../pages/applicant/Notifications'));

// Bureau
const BureauDashboard    = lazy(() => import('../pages/bureau/Dashboard'));
const BureauJobsList     = lazy(() => import('../pages/bureau/JobsList'));
const BureauJobCreate    = lazy(() => import('../pages/bureau/JobCreate'));
const BureauJobEdit      = lazy(() => import('../pages/bureau/JobEdit'));
const BureauApplications = lazy(() => import('../pages/bureau/Applications'));
const BureauProfile      = lazy(() => import('../pages/bureau/BureauProfile'));

// Admin
const AdminDashboard     = lazy(() => import('../pages/admin/Dashboard'));
const AdminUsers         = lazy(() => import('../pages/admin/Users'));
const AdminBureaus       = lazy(() => import('../pages/admin/Bureaus'));
const AdminJobs          = lazy(() => import('../pages/admin/Jobs'));
const AdminAuditLogs     = lazy(() => import('../pages/admin/AuditLogs'));
const AdminLocations     = lazy(() => import('../pages/admin/Locations'));
const AdminNotifications = lazy(() => import('../pages/admin/Notifications'));
const AdminApplications  = lazy(() => import('../pages/admin/Applications'));

/* ── Role sets ────────────────────────────────────────────── */
const ADMIN_ROLES  = ['super_admin', 'regional_admin'];
const BUREAU_ROLES = ['bureau_admin', 'bureau_staff', 'super_admin', 'regional_admin'];
const SEEKER_ROLES = ['job_seeker'];

/* ── Guards ───────────────────────────────────────────────── */
function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    if (ADMIN_ROLES.includes(user.role))  return <Navigate to="/admin"     replace />;
    if (BUREAU_ROLES.includes(user.role)) return <Navigate to="/bureau"    replace />;
    return <Navigate to="/applicant" replace />;
  }

  if (user.must_change_pw && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) {
    if (ADMIN_ROLES.includes(user.role))  return <Navigate to="/admin"     replace />;
    if (BUREAU_ROLES.includes(user.role)) return <Navigate to="/bureau"    replace />;
    return <Navigate to="/applicant" replace />;
  }
  return children;
}

/* ── Layout wrappers (Outlet-based) ──────────────────────── */
function PublicLayoutWrapper() {
  return <PublicLayout><Outlet /></PublicLayout>;
}

function DashboardWrapper({ roles }) {
  return (
    <RequireAuth roles={roles}>
      <DashboardLayout><Outlet /></DashboardLayout>
    </RequireAuth>
  );
}

function NotFound() {
  return (
    <PublicLayout>
      <div className="container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{ fontSize: '5rem', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, margin: '1rem 0' }}>
          Page Not Found
        </h1>
        <p style={{ color: 'var(--color-gray-500)', marginBottom: '2rem' }}>
          The page you are looking for does not exist.
        </p>
        <a href="/" className="btn btn-primary">Back to Home</a>
      </div>
    </PublicLayout>
  );
}

/* ── Route Tree ───────────────────────────────────────────── */
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Public pages ──────────────────────────────────── */}
        <Route element={<PublicLayoutWrapper />}>
          <Route index element={<Home />} />
          <Route path="jobs" element={<JobsList />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="bureaus" element={<BureauList />} />
          <Route path="bureaus/:id" element={<BureauDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
        </Route>

        {/* Auth ───────────────────────────────────────────── */}
        <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/change-password" element={
          <RequireAuth><ChangePassword /></RequireAuth>
        } />

        {/* Applicant portal ──────────────────────────────── */}
        <Route path="/applicant" element={<DashboardWrapper roles={SEEKER_ROLES} />}>
          <Route index element={<ApplicantDashboard />} />
          <Route path="profile"       element={<ApplicantProfile />} />
          <Route path="applications"  element={<ApplicantApplications />} />
          <Route path="documents"     element={<ApplicantDocuments />} />
          <Route path="notifications" element={<ApplicantNotifications />} />
        </Route>

        {/* Bureau portal ─────────────────────────────────── */}
        <Route path="/bureau" element={<DashboardWrapper roles={BUREAU_ROLES} />}>
          <Route index element={<BureauDashboard />} />
          <Route path="jobs"            element={<BureauJobsList />} />
          <Route path="jobs/create"     element={<BureauJobCreate />} />
          <Route path="jobs/:id/edit"   element={<BureauJobEdit />} />
          <Route path="applications"    element={<BureauApplications />} />
          <Route path="profile"         element={<BureauProfile />} />
        </Route>

        {/* Admin portal ──────────────────────────────────── */}
        <Route path="/admin" element={<DashboardWrapper roles={ADMIN_ROLES} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="bureaus"       element={<AdminBureaus />} />
          <Route path="jobs"          element={<AdminJobs />} />
          <Route path="applications"  element={<AdminApplications />} />
          <Route path="audit-logs"    element={<AdminAuditLogs />} />
          <Route path="locations"     element={<AdminLocations />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        {/* 404 ────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  );
}
