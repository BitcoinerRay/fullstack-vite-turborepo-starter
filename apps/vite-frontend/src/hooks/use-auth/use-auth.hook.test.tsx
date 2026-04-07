import {type JSX, type ReactNode} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {type AuthResponseDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {ME_QUERY_KEY, useLogin, useLogout, useRegister} from './use-auth.hook';
import {useAuthStore} from '@/store/auth/auth.store';

vi.mock('@/api/auth.api', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  logoutApi: vi.fn(),
}));

vi.mock('@/api/user.api', () => ({
  getMeApi: vi.fn(),
}));

const {loginApi, registerApi, logoutApi} = await import('@/api/auth.api');
const loginMock = vi.mocked(loginApi);
const registerMock = vi.mocked(registerApi);
const logoutMock = vi.mocked(logoutApi);

const sampleAuthResponse: AuthResponseDto = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    role: UserRole.USER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  accessToken: 'signed-token',
};

function createWrapper(client: QueryClient): (props: {readonly children: ReactNode}) => JSX.Element {
  function Wrapper({children}: {readonly children: ReactNode}): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return Wrapper;
}

describe('use-auth hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({user: undefined, isAuthenticated: false, sessionStatus: 'loading'});
    queryClient = new QueryClient({defaultOptions: {queries: {retry: false}, mutations: {retry: false}}});
  });

  it('useLogin caches the user under ME_QUERY_KEY on success', async () => {
    loginMock.mockResolvedValue(sampleAuthResponse);
    const {result} = renderHook(() => useLogin(), {wrapper: createWrapper(queryClient)});

    await act(async () => {
      await result.current.login('user@example.com', 'password123');
    });

    expect(loginMock).toHaveBeenCalledWith({email: 'user@example.com', password: 'password123'});
    expect(queryClient.getQueryData(ME_QUERY_KEY)).toEqual(sampleAuthResponse.user);
  });

  it('useRegister caches the user under ME_QUERY_KEY on success', async () => {
    registerMock.mockResolvedValue(sampleAuthResponse);
    const {result} = renderHook(() => useRegister(), {wrapper: createWrapper(queryClient)});

    await act(async () => {
      await result.current.register('user@example.com', 'password123');
    });

    expect(registerMock).toHaveBeenCalledWith({email: 'user@example.com', password: 'password123'});
    expect(queryClient.getQueryData(ME_QUERY_KEY)).toEqual(sampleAuthResponse.user);
  });

  it('useLogout clears auth store and removes the cached user query', async () => {
    queryClient.setQueryData(ME_QUERY_KEY, sampleAuthResponse.user);
    useAuthStore.getState().setUser(sampleAuthResponse.user);
    logoutMock.mockResolvedValue(undefined);
    const {result} = renderHook(() => useLogout(), {wrapper: createWrapper(queryClient)});

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
    expect(queryClient.getQueryData(ME_QUERY_KEY)).toBeUndefined();
    expect(useAuthStore.getState().sessionStatus).toBe('guest');
  });
});
