import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import {defaultLocale, supportedLocales} from '@/i18n/constants.ts';

i18next
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: defaultLocale,
    supportedLngs: [...supportedLocales],
    defaultNS: 'translation',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
  });

export {default} from 'i18next';
