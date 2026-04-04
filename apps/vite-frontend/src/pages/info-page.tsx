import {useTranslation} from 'react-i18next';
import {Helmet} from 'react-helmet-async';
import {useParams} from 'react-router-dom';
import {Link, getLocalePath} from '@/i18n/navigation.ts';

export type InfoPageKey = 'about' | 'contact' | 'imprint' | 'privacy' | 'terms';

type InfoPageSection = {
  title: string;
  body: string[];
};

type InfoPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  sections: InfoPageSection[];
  cta: {
    title: string;
    body: string;
    primary: string;
    secondary: string;
  };
};

type InfoPageProps = {
  readonly pageKey: InfoPageKey;
};

export function InfoPage({pageKey}: InfoPageProps) {
  const {t} = useTranslation();
  const {locale} = useParams<{locale: string}>();
  const content = t(`pages.${pageKey}`, {returnObjects: true}) as InfoPageContent;

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
        <html lang={locale ?? 'en'} />
      </Helmet>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:items-start">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{content.eyebrow}</p>
          <h1 className="mb-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            {content.title}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">{content.description}</p>
          <div className="mt-8 space-y-8">
            {content.sections.map((section) => (
              <section key={section.title} className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">{section.title}</h2>
                <div className="space-y-3 text-sm leading-7 text-slate-600 md:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
        <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            {t('components.header.brand')}
          </p>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">{content.cta.title}</h2>
          <p className="mb-6 text-sm leading-7 text-slate-600 md:text-base">{content.cta.body}</p>
          <div className="flex flex-col gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              to={getLocalePath(locale, '/register')}
            >
              {content.cta.primary}
            </Link>
            <Link
              className={[
                'inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3',
                'text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900',
              ].join(' ')}
              to={getLocalePath(locale, '/login')}
            >
              {content.cta.secondary}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
