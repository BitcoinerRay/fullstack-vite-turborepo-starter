export {Link, useNavigate, useLocation, Navigate} from 'react-router-dom';

const defaultLocale = 'en';
const supportedLocales = new Set(['en', 'zh']);

function normalizePath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export function getLocale(locale: string | undefined): string {
  if (!locale || !supportedLocales.has(locale)) {
    return defaultLocale;
  }

  return locale;
}

export function getLocalePath(locale: string | undefined, path = '/'): string {
  const normalizedLocale = getLocale(locale);
  const normalizedPath = normalizePath(path);

  if (normalizedPath === '/') {
    return `/${normalizedLocale}`;
  }

  return `/${normalizedLocale}${normalizedPath}`;
}

export function replaceLocaleInPath(pathname: string, locale: string | undefined): string {
  const normalizedLocale = getLocale(locale);
  const segments = pathname.split('/');

  if (segments.length > 1 && supportedLocales.has(segments[1]!)) {
    segments[1] = normalizedLocale;
    return segments.join('/');
  }

  return getLocalePath(normalizedLocale, pathname);
}

export {defaultLocale, supportedLocales};
