import axios, {type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig} from 'axios';
import {toast} from 'sonner';
import {useAuthStore} from '@/store/auth/auth.store';
import {useLoadingStore} from '@/store/loading/loading.store';

type ApiErrorBody = {
  message?: string;
  statusCode?: number;
};

export const axiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    useLoadingStore.getState().setIsLoading(true);
    return config;
  },
  async (error: AxiosError) => {
    useLoadingStore.getState().setIsLoading(false);
    throw error;
  },
);

axiosInstance.interceptors.response.use(
  async (response: AxiosResponse) => {
    useLoadingStore.getState().setIsLoading(false);
    return response;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    useLoadingStore.getState().setIsLoading(false);

    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      useAuthStore.getState().clearAuth();
      const pathname = globalThis.window?.location.pathname ?? '';
      if (!pathname.includes('/login')) {
        const locale = pathname.split('/')[1] ?? 'en';
        globalThis.window.location.href = `/${locale}/login`;
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
