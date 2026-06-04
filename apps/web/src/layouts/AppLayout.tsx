import { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (lang && lang !== i18n.language) {
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) {
        i18n.changeLanguage(lang);
      } else {
        navigate(`/en`, { replace: true });
      }
    }
  }, [lang, i18n, navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: `/${lang}/generator`, label: t('nav.generator') },
    { to: `/${lang}/verify`, label: t('nav.verifier') },
    { to: `/${lang}/spec`, label: t('nav.spec') },
    { to: `/${lang}/adopt`, label: t('nav.adopt') },
  ];

  return (
    <div className={styles.layout}>
      <header className={`container ${styles.header} rise rise-delay-1`}>
        <div className={styles.headerRow}>
          <NavLink to={`/${lang}`} end className={styles.wordmark}>
            <img src="/favicon.svg" alt="" className={styles.logo} width={22} height={22} />
            hireguard
          </NavLink>

          <button
            className={styles.burger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className={menuOpen ? styles.burgerLineOpen : styles.burgerLine} />
          </button>
        </div>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
          <LanguageSwitcher />
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className={`container ${styles.footer}`}>
        <p>{t('footer.openSource')}</p>
      </footer>
    </div>
  );
}
