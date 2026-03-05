import {useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';

const SUPPORTED_LOCALES = new Set(['en', 'zh']);

export function LanguageSync() {
  const {locale} = useParams<{locale: string}>();
  const navigate = useNavigate();
  const {i18n} = useTranslation();

  useEffect(() => {
    if (!locale || !SUPPORTED_LOCALES.has(locale)) {
      navigate('/en', {replace: true});
      return;
    }

    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n, navigate]);

  return null;
}
