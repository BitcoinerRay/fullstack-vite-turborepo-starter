import {useTranslation} from 'react-i18next';
import {Helmet} from 'react-helmet-async';
import {useParams} from 'react-router-dom';

export function Home() {
  const {t} = useTranslation();
  const {locale} = useParams<{locale: string}>();

  return (
    <>
      <Helmet>
        <title>Vite Frontend</title>
        <meta name="description" content="Frontend powered by Vite" />
        <html lang={locale || 'en'} />
      </Helmet>
      <h2>{t('pages.home.title')}</h2>
    </>
  );
}
