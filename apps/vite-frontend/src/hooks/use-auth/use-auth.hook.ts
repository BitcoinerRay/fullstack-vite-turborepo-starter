import {useCallback, useEffect} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {type AuthResponseDto, type UserDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {getMeApi} from '@/api/user.api';
import {loginApi, logoutApi, registerApi} from '@/api/auth.api';
import {useAuthStore} from '@/store/auth/auth.store';

export const ME_QUERY_KEY = ['users', 'me'] as const;

export function useAuthSessionBootstrap(): void {
  const {setUser, clearAuth} = useAuthStore();

  const {data, isError} = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMeApi,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    } else if (isError) {
      clearAuth();
    }
  }, [data, isError, setUser, clearAuth]);
}

export function useAuthSession(): {user: UserDto | undefined; isAuthenticated: boolean; sessionStatus: string} {
  const {user, isAuthenticated, sessionStatus} = useAuthStore();
  return {user, isAuthenticated, sessionStatus};
}

export function useLogin(): {
  login: (email: string, password: string) => Promise<void>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const {mutateAsync, isPending} = useMutation({
    async mutationFn({email, password}: {email: string; password: string}) {
      return loginApi({email, password});
    },
    async onSuccess(result: AuthResponseDto) {
      queryClient.setQueryData(ME_QUERY_KEY, result.user);
    },
  });

  // Depend only on mutateAsync (stable across renders) so consumers can put
  // login() into effect deps without triggering re-runs each render.
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      await mutateAsync({email, password});
    },
    [mutateAsync],
  );

  return {login, isPending};
}

export function useRegister(): {
  register: (email: string, password: string) => Promise<void>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const {mutateAsync, isPending} = useMutation({
    async mutationFn({email, password}: {email: string; password: string}) {
      return registerApi({email, password});
    },
    async onSuccess(result: AuthResponseDto) {
      queryClient.setQueryData(ME_QUERY_KEY, result.user);
    },
  });

  const register = useCallback(
    async (email: string, password: string): Promise<void> => {
      await mutateAsync({email, password});
    },
    [mutateAsync],
  );

  return {register, isPending};
}

export function useLogout(): {logout: () => Promise<void>; isPending: boolean} {
  const {clearAuth} = useAuthStore();
  const queryClient = useQueryClient();

  const {mutateAsync, isPending} = useMutation({
    mutationFn: logoutApi,
    onSuccess() {
      clearAuth();
      queryClient.removeQueries({queryKey: ME_QUERY_KEY});
    },
  });

  const logout = useCallback(async (): Promise<void> => {
    await mutateAsync();
  }, [mutateAsync]);

  return {logout, isPending};
}
