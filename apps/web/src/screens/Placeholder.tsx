import { useTranslation } from 'react-i18next';

export function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="container" style={{ paddingBlockStart: 80, textAlign: 'center' }}>
      <h1 style={{ fontSize: 24, marginBlockEnd: 16 }}>{t(titleKey)}</h1>
      <p className="muted">{t('comingSoon')}</p>
    </div>
  );
}
