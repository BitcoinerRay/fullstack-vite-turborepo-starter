import React, {type JSX} from 'react';
import {createBrowserRouter, Navigate} from 'react-router-dom';
import {MainLayout} from '@/layouts/MainLayout.tsx';
import {BareLayout} from '@/layouts/BareLayout.tsx';
import {ProvidersLayout} from '@/layouts/ProvidersLayout.tsx';
import {PrivateRoute} from '@/router/PrivateRoute.tsx';
import {RouteBoundary} from '@/components/route-boundary/route-boundary.component';
import {defaultLocale} from '@/i18n/constants.ts';
import {getLocalePath} from '@/i18n/navigation.ts';

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

function infoPageElement(pageKey: 'about' | 'contact' | 'imprint' | 'privacy' | 'terms'): JSX.Element {
  return (
    <RouteBoundary>
      <InfoPage pageKey={pageKey} />
    </RouteBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to={getLocalePath(defaultLocale)} />,
  },
  {
    path: '/:locale',
    element: <ProvidersLayout />,
    errorElement: (
      <RouteBoundary>
        <ErrorBoundary />
      </RouteBoundary>
    ),
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: (
              <PrivateRoute>
                <RouteBoundary>
                  <Home />
                </RouteBoundary>
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
              <RouteBoundary>
                <LoginPage />
              </RouteBoundary>
            ),
          },
          {
            path: 'register',
            element: (
              <RouteBoundary>
                <RegisterPage />
              </RouteBoundary>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <RouteBoundary>
        <NotFound />
      </RouteBoundary>
    ),
  },
]);
