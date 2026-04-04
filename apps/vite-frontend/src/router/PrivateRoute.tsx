import {type JSX} from 'react';
import {Navigate, useParams} from 'react-router-dom';
import {useAuthSession} from '@/hooks/use-auth/use-auth.hook';
import {LoadingAnimation} from '@/components/loading-animation/loading-animation.component';
import {getLocalePath} from '@/i18n/navigation.ts';

type PrivateRouteProps = {
  readonly children: JSX.Element;
};

export function PrivateRoute({children}: PrivateRouteProps): JSX.Element {
  const {locale} = useParams<{locale: string}>();
  const {sessionStatus} = useAuthSession();

  if (sessionStatus === 'loading') {
    return <LoadingAnimation />;
  }

  if (sessionStatus === 'guest') {
    return <Navigate replace to={getLocalePath(locale, '/login')} />;
  }

  return children;
}
