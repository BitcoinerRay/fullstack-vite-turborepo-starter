export const defaultLocale = 'en';

export const supportedLocales = ['en', 'zh'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

const supportedLocaleSet = new Set<string>(supportedLocales);

export function isSupportedLocale(locale: string | undefined): locale is SupportedLocale {
  return typeof locale === 'string' && supportedLocaleSet.has(locale);
}
