import {type JSX} from 'react';
import {Navigate, useParams} from 'react-router-dom';
import {useMe} from '@/hooks/use-auth/use-auth.hook';
import {LoadingAnimation} from '@/components/loading-animation/loading-animation.component';

type PrivateRouteProps = {
  readonly children: JSX.Element;
};

export function PrivateRoute({children}: PrivateRouteProps): JSX.Element {
  const {locale} = useParams<{locale: string}>();
  const {isLoading, isError} = useMe();

  if (isLoading) {
    return <LoadingAnimation />;
  }

  if (isError) {
    return <Navigate replace to={`/${locale ?? 'en'}/login`} />;
  }

  return children;
}
