import {useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {defaultLocale, isSupportedLocale} from '@/i18n/constants.ts';
import {getLocalePath} from '@/i18n/navigation.ts';

export function LanguageSync() {
  const {locale} = useParams<{locale: string}>();
  const navigate = useNavigate();
  const {i18n} = useTranslation();

  useEffect(() => {
    if (!isSupportedLocale(locale)) {
      navigate(getLocalePath(defaultLocale), {replace: true});
      return;
    }

    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n, navigate]);

  return null;
}
