import {type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {useShallow} from 'zustand/react/shallow';
import {Button} from '@/components/ui/button.tsx';
import {useLogout} from '@/hooks/use-auth/use-auth.hook';
import {Link, getLocalePath} from '@/i18n/navigation.ts';
import {cn} from '@/lib/utils.ts';
import {useAuthStore} from '@/store/auth/auth.store';

export function Header(): JSX.Element {
  const {t} = useTranslation();
  const {locale} = useParams<{locale: string}>();
  const location = useLocation();
  const navigate = useNavigate();
  const {user, isAuthenticated} = useAuthStore(
    useShallow((state) => ({user: state.user, isAuthenticated: state.isAuthenticated})),
  );
  const {logout, isPending} = useLogout();
  const homePath = getLocalePath(locale, '/');
  const navigationItems = [
    {label: t('components.header.links.about'), to: getLocalePath(locale, '/about')},
    {label: t('components.header.links.contact'), to: getLocalePath(locale, '/contact')},
    {label: t('components.header.links.privacy'), to: getLocalePath(locale, '/privacy')},
  ];

  if (isAuthenticated) {
    navigationItems.unshift({label: t('components.header.links.dashboard'), to: homePath});
  }

  const onLogout = async (): Promise<void> => {
    await logout();
    void navigate(getLocalePath(locale, '/login'));
  };

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Link className="flex flex-col gap-1" to={isAuthenticated ? homePath : getLocalePath(locale, '/about')}>
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
            {t('components.header.brand')}
          </span>
          <span className="text-sm text-slate-600">{t('components.header.tagline')}</span>
        </Link>
        <nav aria-label={t('components.header.navigationLabel')}>
          <ul className="flex flex-wrap items-center gap-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.to;

              return (
                <li key={item.to}>
                  <Link
                    className={cn(
                      'inline-flex rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900',
                      isActive && 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white',
                    )}
                    to={item.to}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {isAuthenticated ? (
            <>
              <p className="text-sm text-slate-500">{t('components.header.signedInAs', {email: user?.email ?? ''})}</p>
              <Button disabled={isPending} size="sm" variant="outline" onClick={onLogout}>
                {t('components.header.auth.logout')}
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to={getLocalePath(locale, '/login')}>{t('components.header.auth.login')}</Link>
              </Button>
              <Button asChild size="sm">
                <Link to={getLocalePath(locale, '/register')}>{t('components.header.auth.register')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
