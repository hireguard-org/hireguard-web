import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../../i18n';
import type { SupportedLanguage } from '../../i18n';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();

  const handleChange = (newLang: SupportedLanguage) => {
    if (newLang === lang) return;
    const rest = location.pathname.replace(`/${lang}`, '');
    i18n.changeLanguage(newLang);
    navigate(`/${newLang}${rest}`, { replace: true });
  };

  return (
    <div className={styles.switcher}>
      {SUPPORTED_LANGUAGES.map((l) => (
        <button
          key={l}
          className={styles.btn}
          aria-pressed={i18n.language === l}
          onClick={() => handleChange(l)}
        >
          {LANGUAGE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
