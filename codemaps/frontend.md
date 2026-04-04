# Frontend (Vite + React)

**Updated:** 2026-04-04

## Entry and Bootstrapping

- `index.html` -> `src/main.tsx`
- `src/main.tsx` 完成：
  - i18n 初始化
  - 全局样式加载
  - `RouterProvider` 挂载
- 开发端口由 `vite.config.ts` 固定为 `3000`

## Routing Model

- 路由定义文件：`src/router/index.tsx`
- 路由策略：
  - `/` 重定向到 `/en`
  - `/:locale` 作为主语言前缀
  - `*` 走 `NotFound`
- 当前已实现页面：
  - `Home`
  - `LoginPage`
  - `RegisterPage`
  - `ErrorBoundary`
  - `NotFound`

## Core Flow

### Auth Flow

- API 调用位于 `src/api/`
- `axiosInstance` 固定请求 `/api/v1`
- `useMe()` 使用 React Query 拉取 `/users/me`
- `useLogin()` / `useRegister()` 写入 Zustand 用户态
- 收到 `401` 时自动清空状态并跳回登录页

### UI Composition

```text
ProvidersLayout
  HelmetProvider
  I18nextProvider
  ZodErrorProvider
  ToastProvider
  ConfirmProvider
  ReactQueryProvider
    LoadingAnimation
    Outlet
```

## File Layout

```text
src/
  api/                auth.api.ts, user.api.ts
  components/
    footer/           Footer + LocaleSelect
    header/           Header placeholder
    loading-animation/
    ui/               Radix/shadcn-based primitives
  hooks/
    use-auth/
    use-confirm-dialog/
    use-toast/
  i18n/
    config.ts
    LanguageSync.tsx
    navigation.ts
  layouts/
    BareLayout.tsx
    MainLayout.tsx
    ProvidersLayout.tsx
  lib/
    axios.ts
    utils.ts
  pages/
    Home.tsx
    ErrorBoundary.tsx
    NotFound.tsx
    auth/
      LoginPage.tsx
      RegisterPage.tsx
  providers/
    confirm/
    react-query/
    toast/
    zod-error/
  router/
    index.tsx
    PrivateRoute.tsx
  store/
    auth/
    loading/
  styles/
    globals.css
```

## i18n

- `react-i18next + i18next-http-backend`
- 当前支持语言：
  - `en`
  - `zh`
- 语言资源文件：
  - `public/locales/en.json`
  - `public/locales/zh.json`
- URL 由 `/:locale` 驱动，`LanguageSync.tsx` 负责同步语言状态

## Current Limitations

- `Header` 仍然是占位组件，没有真实导航
- `Footer` 包含若干尚未实现的路由链接
- `apps/vite-frontend/MIGRATION-SUMMARY.md` 是历史迁移记录，不应当作现状文档
- 前端当前没有实际 Playwright 测试资产

## Build Notes

- 生产构建会生成手动分块：
  - `vendor-react`
  - `vendor-radix`
  - `vendor-query`
- `VITE_BACKEND_URL` 目前未被前端代码消费
- 开发态是否能访问后端，主要取决于 Vite 代理和后端 `4000` 端口是否可用
