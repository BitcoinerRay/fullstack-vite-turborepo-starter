import axios, {type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig} from 'axios';
import {toast} from 'sonner';
import {getLocale, getLocalePath} from '@/i18n/navigation.ts';
import {useAuthStore} from '@/store/auth/auth.store';
import {useLoadingStore} from '@/store/loading/loading.store';

type RequestConfigWithMeta = InternalAxiosRequestConfig & {
  skipAuthRedirect?: boolean;
  skipAuthRefresh?: boolean;
  retriedAfterRefresh?: boolean;
};

type ApiErrorBody = {
  message?: string;
  statusCode?: number;
};

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function normalizeBackendOrigin(backendUrl: string): string {
  return backendUrl.replace(/\/api\/v1\/?$/u, '').replace(/\/$/u, '');
}

function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '/api/v1';
  }

  const backendUrl =
    typeof import.meta.env.VITE_BACKEND_URL === 'string' ? import.meta.env.VITE_BACKEND_URL : undefined;
  if (!backendUrl) {
    return '/api/v1';
  }

  return `${normalizeBackendOrigin(backendUrl)}/api/v1`;
}

function isAuthPagePath(pathname: string): boolean {
  return /\/(login|register)\/?$/u.test(pathname);
}

function isRefreshEndpoint(url: string | undefined): boolean {
  return url === undefined ? false : /\/auth\/refresh\/?$/u.test(url);
}

// Single-flight refresh: concurrent 401s share one POST /auth/refresh, then
// each retries its original request once. Retried requests are tagged so a
// second 401 falls through to the normal clear-auth + redirect path.
let refreshPromise: Promise<void> | undefined;

async function performTokenRefresh(): Promise<void> {
  if (refreshPromise === undefined) {
    refreshPromise = (async () => {
      try {
        await axiosInstance.post('/auth/refresh', undefined, {
          skipAuthRedirect: true,
          skipAuthRefresh: true,
        } as RequestConfigWithMeta);
      } finally {
        refreshPromise = undefined;
      }
    })();
  }

  return refreshPromise;
}

function redirectToLogin(): void {
  const pathname = globalThis.window?.location.pathname ?? '';
  const localeMatch = /^\/([^/]+)/u.exec(pathname);
  const locale = getLocale(localeMatch?.[1]);
  if (!isAuthPagePath(pathname)) {
    globalThis.window.location.href = getLocalePath(locale, '/login');
  }
}

function reportNonAuthError(status: number, message: string | undefined): void {
  if (status === 403) {
    toast.error(String(message ?? 'Access denied'));
  } else if (status === 429) {
    toast.warning('Too many requests. Please wait a moment.');
  } else if (status >= 500) {
    toast.error('A server error occurred. Please try again later.');
  }
}

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    useLoadingStore.getState().increment();
    return config;
  },
  async (error: AxiosError) => {
    useLoadingStore.getState().decrement();
    throw error;
  },
);

function shouldAttemptRefresh(status: number | undefined, requestConfig: RequestConfigWithMeta | undefined): boolean {
  return (
    status === 401 &&
    requestConfig !== undefined &&
    !requestConfig.skipAuthRefresh &&
    !requestConfig.retriedAfterRefresh &&
    !isRefreshEndpoint(requestConfig.url)
  );
}

axiosInstance.interceptors.response.use(
  async (response: AxiosResponse) => {
    useLoadingStore.getState().decrement();
    return response;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    useLoadingStore.getState().decrement();

    const status = error.response?.status;
    const requestConfig = error.config as RequestConfigWithMeta | undefined;

    if (shouldAttemptRefresh(status, requestConfig)) {
      try {
        await performTokenRefresh();
        const retryConfig: RequestConfigWithMeta = {...requestConfig!, retriedAfterRefresh: true};
        return await axiosInstance.request(retryConfig);
      } catch {
        // Fall through to the regular 401 handling below.
      }
    }

    if (status === 401) {
      useAuthStore.getState().clearAuth();
      if (!requestConfig?.skipAuthRedirect) {
        redirectToLogin();
      }

      throw error;
    }

    reportNonAuthError(status ?? 0, error.response?.data?.message);

    throw error;
  },
);
