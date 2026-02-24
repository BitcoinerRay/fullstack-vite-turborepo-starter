# Frontend (Vite + React)

**Updated:** 2026-02-13

## Entry

- index.html → /src/main.tsx
- main.tsx → ReactDOM.createRoot, RouterProvider, i18n/config, styles/globals.css
- Dev server: Vite default port 3000

## Router

- createBrowserRouter (react-router-dom)
- / → redirect /en; /:locale → App (Outlet); \* → NotFound
- Routes: Home (index), ErrorBoundary (errorElement), NotFound

## Structure

```
src/
  main.tsx
  App.tsx              # HelmetProvider, I18nextProvider, LanguageSync, providers, Header, Footer, Outlet
  router/index.tsx     # router (createBrowserRouter)
  pages/
    Home.tsx           # useTranslation, Helmet
    ErrorBoundary.tsx  # useRouteError, useNavigate
    NotFound.tsx       # Link to /en
  i18n/
    config.ts          # i18next, HttpBackend, supportedLngs: en, zh
    LanguageSync.tsx   # useParams locale → i18n.changeLanguage, invalid → redirect /en
    navigation.ts      # re-export Link, useNavigate, useLocation, Navigate
  components/
    header/            # Header
    footer/            # Footer, LocaleSelect
    loading-animation/ # LoadingAnimation
    float-label-input-text/
    ui/                # Button, Input, Label, Select, AlertDialog, DropdownMenu, NavigationMenu, Sonner
  providers/
    react-query/       # ReactQueryProvider
    toast/             # ToastProvider
    confirm/            # ConfirmProvider
    zod-error/         # ZodErrorProvider, createZodErrorMap
  hooks/
    use-confirm-dialog/
    use-toast/
  lib/utils.ts         # cn (clsx + tailwind-merge)
  store/loading/      # useLoadingStore (zustand)
  styles/globals.css  # Tailwind, CSS variables
```

## Providers

- HelmetProvider, I18nextProvider, LanguageSync, ZodErrorProvider, ToastProvider, ConfirmProvider, ReactQueryProvider

## i18n

- react-i18next; locales: en, zh
- loadPath: /locales/{{lng}}.json
- URL-driven: /:locale (en | zh)

## External Deps

- vite, react, react-dom, react-router-dom, react-i18next, i18next, i18next-http-backend, react-helmet-async
- @tanstack/react-query, zustand, zod, react-hook-form, @hookform/resolvers
- @radix-ui/\*, tailwindcss, lucide-react, sonner
