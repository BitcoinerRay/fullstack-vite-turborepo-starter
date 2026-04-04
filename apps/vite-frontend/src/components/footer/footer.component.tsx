import {useTranslation} from 'react-i18next';
import {type JSX} from 'react';
import {useParams} from 'react-router-dom';
import {LocaleSelect} from './components/LocaleSelect/locale-select.component';
import {Link, getLocalePath} from '@/i18n/navigation.ts';

type FooterItem = {
  label: string;
  href: string;
};

type FooterItemsGroup = {
  label: string;
  items: FooterItem[];
};

export function Footer(): JSX.Element {
  const {t} = useTranslation();
  const {locale} = useParams<{locale: string}>();

  const footerItemsGroups: FooterItemsGroup[] = [
    {
      label: t('components.footer.groups.company'),
      items: [
        {label: t('components.footer.links.aboutUs'), href: getLocalePath(locale, '/about')},
        {label: t('components.footer.links.contact'), href: getLocalePath(locale, '/contact')},
      ],
    },
    {
      label: t('components.footer.groups.legal'),
      items: [
        {label: t('components.footer.links.imprint'), href: getLocalePath(locale, '/imprint')},
        {label: t('components.footer.links.privacyPolicy'), href: getLocalePath(locale, '/privacy')},
        {label: t('components.footer.links.termsOfService'), href: getLocalePath(locale, '/terms')},
      ],
    },
  ];

  return (
    <footer className="max-w-full border-t border-slate-200 bg-slate-100 px-2 py-6 text-slate-700 md:px-4">
      <div className="mx-auto max-w-7xl divide-y divide-slate-300 text-center">
        <nav className="mb-4 pb-4">
          <ul className="flex flex-wrap justify-center gap-8 md:gap-12 lg:gap-16">
            {footerItemsGroups.map((group) => (
              <li key={group.label} className="mb-2 text-sm">
                <p className="mb-1 tracking-[0.3em] text-slate-400">{group.label}</p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link to={item.href} className="transition-colors duration-200 hover:text-slate-900">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex w-full justify-end">
            <LocaleSelect />
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} {t('components.footer.copyrightNotice')}
          </p>
        </div>
      </div>
    </footer>
  );
}
