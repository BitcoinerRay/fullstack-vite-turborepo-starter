import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig} from 'axios';
import {toast} from 'sonner';
import {type UserDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {axiosInstance} from './axios';
import {useAuthStore} from '@/store/auth/auth.store';
import {useLoadingStore} from '@/store/loading/loading.store';

type WindowLike = {location: {pathname: string; href: string}};

function setWindowPathname(pathname: string): void {
  const fakeWindow: WindowLike = {location: {pathname, href: ''}};
  Object.defineProperty(globalThis, 'window', {
    value: fakeWindow,
    configurable: true,
    writable: true,
  });
}

function getWindowHref(): string {
  return (globalThis.window as unknown as WindowLike).location.href;
}

const sampleUser: UserDto = {
  id: 'u1',
  email: 'a@b.c',
  role: UserRole.USER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const toastError = vi.mocked(toast.error);
const toastWarning = vi.mocked(toast.warning);

function buildResponseError(
  status: number,
  message?: string,
  requestConfig: Partial<InternalAxiosRequestConfig> & {
    skipAuthRedirect?: boolean;
    skipAuthRefresh?: boolean;
    retriedAfterRefresh?: boolean;
  } = {},
): AxiosError {
  const config: InternalAxiosRequestConfig = {
    headers: new AxiosHeaders(),
    ...requestConfig,
  };
  const response: AxiosResponse = {
    status,
    statusText: '',
    headers: {},
    config,
    data: {message, statusCode: status},
  };
  return new AxiosError('request failed', String(status), config, undefined, response);
}

function getRequestSuccessHandler(): (config: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig> {
  const handler = (axiosInstance.interceptors.request as unknown as {handlers: Array<{fulfilled: unknown}>}).handlers[0]
    ?.fulfilled;
  return handler as (config: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig>;
}

function getResponseHandlers(): {
  fulfilled: (response: AxiosResponse) => Promise<AxiosResponse>;
  rejected: (error: AxiosError) => Promise<never>;
} {
  const entry = (axiosInstance.interceptors.response as unknown as {handlers: Array<{fulfilled: unknown; rejected: unknown}>})
    .handlers[0];
  return {
    fulfilled: entry?.fulfilled as (response: AxiosResponse) => Promise<AxiosResponse>,
    rejected: entry?.rejected as (error: AxiosError) => Promise<never>,
  };
}

describe('axios interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLoadingStore.setState({pendingRequests: 0, isLoading: false});
    useAuthStore.setState({user: undefined, isAuthenticated: false, sessionStatus: 'loading'});
    setWindowPathname('/en/dashboard');
  });

  it('increments the loading counter on request and decrements on response', async () => {
    const requestHandler = getRequestSuccessHandler();
    const config: InternalAxiosRequestConfig = {headers: new AxiosHeaders()};
    await requestHandler(config);
    expect(useLoadingStore.getState().pendingRequests).toBe(1);

    const {fulfilled} = getResponseHandlers();
    const response: AxiosResponse = {status: 200, statusText: 'OK', headers: {}, config, data: {}};
    await fulfilled(response);
    expect(useLoadingStore.getState().pendingRequests).toBe(0);
  });

  it('clears auth and redirects to the localized login when retried request still 401s', async () => {
    useAuthStore.getState().setUser(sampleUser);
    const {rejected} = getResponseHandlers();
    const error = buildResponseError(401, 'unauthorized', {retriedAfterRefresh: true});

    await expect(rejected(error)).rejects.toBe(error);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getWindowHref()).toBe('/en/login');
  });

  it('does not redirect on 401 when skipAuthRedirect is set', async () => {
    const {rejected} = getResponseHandlers();
    const error = buildResponseError(401, 'unauthorized', {skipAuthRedirect: true, skipAuthRefresh: true});

    await expect(rejected(error)).rejects.toBe(error);
    expect(getWindowHref()).toBe('');
  });

  it('does not redirect on 401 when already on the login page', async () => {
    setWindowPathname('/en/login');
    const {rejected} = getResponseHandlers();
    const error = buildResponseError(401, 'unauthorized', {retriedAfterRefresh: true});

    await expect(rejected(error)).rejects.toBe(error);
    expect(getWindowHref()).toBe('');
  });

  it('toasts an error message on 403', async () => {
    const {rejected} = getResponseHandlers();
    const error = buildResponseError(403, 'forbidden');

    await expect(rejected(error)).rejects.toBe(error);
    expect(toastError).toHaveBeenCalledWith('forbidden');
  });

  it('toasts a warning on 429', async () => {
    const {rejected} = getResponseHandlers();
    const error = buildResponseError(429);

    await expect(rejected(error)).rejects.toBe(error);
    expect(toastWarning).toHaveBeenCalledWith('Too many requests. Please wait a moment.');
  });

  it('toasts an error on 5xx responses', async () => {
    const {rejected} = getResponseHandlers();
    const error = buildResponseError(503);

    await expect(rejected(error)).rejects.toBe(error);
    expect(toastError).toHaveBeenCalledWith('A server error occurred. Please try again later.');
  });

  it('attempts a refresh and retries the original request on a fresh 401', async () => {
    const postSpy = vi.spyOn(axiosInstance, 'post').mockResolvedValue({data: {}});
    const retryResponse: AxiosResponse = {status: 200, statusText: 'OK', headers: {}, config: {headers: new AxiosHeaders()}, data: {ok: true}};
    const requestSpy = vi.spyOn(axiosInstance, 'request').mockResolvedValue(retryResponse);

    const {rejected} = getResponseHandlers();
    const error = buildResponseError(401, 'unauthorized', {url: '/users/me'});

    await expect(rejected(error)).resolves.toBe(retryResponse);

    expect(postSpy).toHaveBeenCalledWith('/auth/refresh', undefined, expect.objectContaining({skipAuthRefresh: true, skipAuthRedirect: true}));
    expect(requestSpy).toHaveBeenCalledWith(expect.objectContaining({url: '/users/me', retriedAfterRefresh: true}));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getWindowHref()).toBe('');
  });

  it('falls through to clear-auth and redirect when refresh fails', async () => {
    useAuthStore.getState().setUser(sampleUser);
    vi.spyOn(axiosInstance, 'post').mockRejectedValue(new Error('refresh failed'));

    const {rejected} = getResponseHandlers();
    const error = buildResponseError(401, 'unauthorized', {url: '/users/me'});

    await expect(rejected(error)).rejects.toBe(error);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getWindowHref()).toBe('/en/login');
  });

  it('does not attempt to refresh when the failing request is itself /auth/refresh', async () => {
    const postSpy = vi.spyOn(axiosInstance, 'post');
    const {rejected} = getResponseHandlers();
    const error = buildResponseError(401, 'unauthorized', {url: '/auth/refresh'});

    await expect(rejected(error)).rejects.toBe(error);
    expect(postSpy).not.toHaveBeenCalled();
  });
});
