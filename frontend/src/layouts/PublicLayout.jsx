import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import { useLang } from '../context/LangContext';

function Navbar() {
  const { user, logout, isAdmin, isBureau } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashPath = isAdmin ? '/admin' : isBureau ? '/bureau' : '/applicant';

  function handleLogout() {
    logout();
    navigate('/');
    setMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          Amhara <span>Jobs</span>
        </Link>

        {/* Desktop Nav */}
        <nav id="primary-navigation" className={`navbar-nav${menuOpen ? ' open' : ''}`} aria-label="Main navigation">
          <NavLink to="/"        className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)} end>{t('Home', 'መነሻ')}</NavLink>
          <NavLink to="/jobs"    className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>{t('Jobs', 'ሥራዎች')}</NavLink>
          <NavLink to="/bureaus" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>{t('Bureaus', 'ቢሮዎች')}</NavLink>
          <NavLink to="/about"   className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>{t('About', 'ስለ እኛ')}</NavLink>
          <NavLink to="/contact" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>{t('Contact', 'ያግኙን')}</NavLink>
          {user && (
            <NavLink to={dashPath} className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>{t('Dashboard', 'ዳሽቦርድ')}</NavLink>
          )}
        </nav>

        {/* Actions */}
        <div className="navbar-actions">
          <LanguageSelector />
          {user ? (
            <>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', display: 'none' }} className="d-sm-block">
                {user.full_name?.split(' ')[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>{t('Sign Out', 'ውጣ')}</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" to="/login">{t('Sign In', 'ግባ')}</Button>
              <Button variant="primary" size="sm" to="/register">{t('Register', 'ይመዝገቡ')}</Button>
            </>
          )}
          <button
            className="navbar-menu-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Amhara <span>Jobs</span></div>
            <p className="footer-desc">
              {t('The centralized recruitment portal for Amhara Regional State government bureaus and offices.', 'የአማራ ክልል የመንግሥት ቢሮዎችና ተቋማት የቅጥር ፖርታል።')}
            </p>
          </div>
          <div>
            <p className="footer-heading">{t('Quick Links', 'ፈጣን አገናኞች')}</p>
            <ul className="footer-links">
              <li><Link to="/">{t('Home', 'መነሻ')}</Link></li>
              <li><Link to="/jobs">{t('Browse Jobs', 'ሥራዎችን ይመልከቱ')}</Link></li>
              <li><Link to="/bureaus">{t('Bureaus', 'ቢሮዎች')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="footer-heading">{t('Account', 'መለያ')}</p>
            <ul className="footer-links">
              <li><Link to="/register">{t('Register', 'ይመዝገቡ')}</Link></li>
              <li><Link to="/login">{t('Sign In', 'ግባ')}</Link></li>
              <li><Link to="/applicant">{t('My Applications', 'የእኔ ማመልከቻዎች')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="footer-heading">{t('Information', 'መረጃ')}</p>
            <ul className="footer-links">
              <li><Link to="/about">{t('About', 'ስለ እኛ')}</Link></li>
              <li><Link to="/contact">{t('Contact', 'ያግኙን')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {t('Amhara Regional State · Amhara Jobs Portal', 'አማራ ክልል · አማራ ጆብስ ፖርታል')}</span>
          <span>{t('All vacancies are database-backed records.', 'ሁሉም የሥራ ማስታወቂያዎች በዳታቤዝ የተመዘገቡ ናቸው።')}</span>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
