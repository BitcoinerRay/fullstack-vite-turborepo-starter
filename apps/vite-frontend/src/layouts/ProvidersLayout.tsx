import {Outlet} from 'react-router-dom';
import {HelmetProvider} from 'react-helmet-async';
import {I18nextProvider} from 'react-i18next';
import i18n from '@/i18n/config.ts';
import {LanguageSync} from '@/i18n/LanguageSync.tsx';
import {ReactQueryProvider} from '@/providers/react-query/react-query.provider';
import {ToastProvider} from '@/providers/toast/toast.provider';
import {ConfirmProvider} from '@/providers/confirm/confirm.provider';
import {ZodErrorProvider} from '@/providers/zod-error/zod-error.provider';
import {LoadingAnimation} from '@/components/loading-animation/loading-animation.component';

export function ProvidersLayout() {
  return (
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <LanguageSync />
        <ZodErrorProvider>
          <ToastProvider>
            <ConfirmProvider>
              <ReactQueryProvider>
                <LoadingAnimation />
                <Outlet />
              </ReactQueryProvider>
            </ConfirmProvider>
          </ToastProvider>
        </ZodErrorProvider>
      </I18nextProvider>
    </HelmetProvider>
  );
}
