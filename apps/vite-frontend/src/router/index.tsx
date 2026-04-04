import React, {type JSX} from 'react';
import {createBrowserRouter, Navigate} from 'react-router-dom';
import {MainLayout} from '@/layouts/MainLayout.tsx';
import {BareLayout} from '@/layouts/BareLayout.tsx';
import {ProvidersLayout} from '@/layouts/ProvidersLayout.tsx';
import {PrivateRoute} from '@/router/PrivateRoute.tsx';
import {LoadingAnimation} from '@/components/loading-animation/loading-animation.component';

const Home = React.lazy(async () => {
  const mod = await import('../pages/Home.tsx');
  return {default: mod.Home};
});
const InfoPage = React.lazy(async () => {
  const mod = await import('../pages/info-page.tsx');
  return {default: mod.InfoPage};
});
const LoginPage = React.lazy(async () => {
  const mod = await import('../pages/auth/LoginPage.tsx');
  return {default: mod.LoginPage};
});
const RegisterPage = React.lazy(async () => {
  const mod = await import('../pages/auth/RegisterPage.tsx');
  return {default: mod.RegisterPage};
});
const ErrorBoundary = React.lazy(async () => {
  const mod = await import('../pages/ErrorBoundary.tsx');
  return {default: mod.ErrorBoundary};
});
const NotFound = React.lazy(async () => {
  const mod = await import('../pages/NotFound.tsx');
  return {default: mod.NotFound};
});

function SuspenseWrapper({children}: {readonly children: React.ReactNode}): JSX.Element {
  return <React.Suspense fallback={<LoadingAnimation />}>{children}</React.Suspense>;
}

function infoPageElement(pageKey: 'about' | 'contact' | 'imprint' | 'privacy' | 'terms'): JSX.Element {
  return (
    <SuspenseWrapper>
      <InfoPage pageKey={pageKey} />
    </SuspenseWrapper>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/en" />,
  },
  {
    path: '/:locale',
    element: <ProvidersLayout />,
    errorElement: (
      <SuspenseWrapper>
        <ErrorBoundary />
      </SuspenseWrapper>
    ),
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: (
              <PrivateRoute>
                <SuspenseWrapper>
                  <Home />
                </SuspenseWrapper>
              </PrivateRoute>
            ),
          },
          {
            path: 'about',
            element: infoPageElement('about'),
          },
          {
            path: 'contact',
            element: infoPageElement('contact'),
          },
          {
            path: 'imprint',
            element: infoPageElement('imprint'),
          },
          {
            path: 'privacy',
            element: infoPageElement('privacy'),
          },
          {
            path: 'terms',
            element: infoPageElement('terms'),
          },
        ],
      },
      {
        element: <BareLayout />,
        children: [
          {
            path: 'login',
            element: (
              <SuspenseWrapper>
                <LoginPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'register',
            element: (
              <SuspenseWrapper>
                <RegisterPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFound />
      </SuspenseWrapper>
    ),
  },
]);
