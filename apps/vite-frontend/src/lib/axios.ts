import axios, {type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig} from 'axios';
import {toast} from 'sonner';
import {getLocale, getLocalePath} from '@/i18n/navigation.ts';
import {useAuthStore} from '@/store/auth/auth.store';
import {useLoadingStore} from '@/store/loading/loading.store';

type RequestConfigWithAuthRedirect = {
  skipAuthRedirect?: boolean;
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

axiosInstance.interceptors.response.use(
  async (response: AxiosResponse) => {
    useLoadingStore.getState().decrement();
    return response;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    useLoadingStore.getState().decrement();

    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      useAuthStore.getState().clearAuth();
      const pathname = globalThis.window?.location.pathname ?? '';
      const localeMatch = /^\/([^/]+)/u.exec(pathname);
      const locale = getLocale(localeMatch?.[1]);
      const requestConfig = error.config as RequestConfigWithAuthRedirect | undefined;
      if (!requestConfig?.skipAuthRedirect && !isAuthPagePath(pathname)) {
        globalThis.window.location.href = getLocalePath(locale, '/login');
      }

      throw error;
    }

    if (status === 403) {
      toast.error(String(message ?? 'Access denied'));
    } else if (status === 429) {
      toast.warning('Too many requests. Please wait a moment.');
    } else if (status !== undefined && status >= 500) {
      toast.error('A server error occurred. Please try again later.');
    }

    throw error;
  },
);
