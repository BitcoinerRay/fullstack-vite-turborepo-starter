import {useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {defaultLocale, isSupportedLocale} from '@/i18n/constants.ts';
import {getLocalePath} from '@/i18n/navigation.ts';

export function LanguageSync(): null {
  const {locale} = useParams<{locale: string}>();
  const navigate = useNavigate();
  const {i18n} = useTranslation();

  useEffect(() => {
    if (!isSupportedLocale(locale)) {
      navigate(getLocalePath(defaultLocale), {replace: true});
      return;
    }

    if (i18n.language === locale) {
      return;
    }

    // Awaited so the namespace bundle finishes loading before the next render
    // observes the new language — avoids a brief flash of the previous locale.
    async function applyLanguage(): Promise<void> {
      try {
        await i18n.changeLanguage(locale);
      } catch {
        // Swallow — i18next falls back to the default namespace, and surfacing
        // a UI-level error here would block routing on a non-critical issue.
      }
    }

    void applyLanguage();
  }, [locale, i18n, navigate]);

  return null;
}
