import {useEffect} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {type UserDto} from '@next-nest-turbo-auth-boilerplate/shared';
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

  const mutation = useMutation({
    async mutationFn({email, password}: {email: string; password: string}) {
      return loginApi({email, password});
    },
    async onSuccess(result) {
      queryClient.setQueryData(ME_QUERY_KEY, result.user);
    },
  });

  return {
    async login(email: string, password: string): Promise<void> {
      await mutation.mutateAsync({email, password});
    },
    isPending: mutation.isPending,
  };
}

export function useRegister(): {
  register: (email: string, password: string) => Promise<void>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    async mutationFn({email, password}: {email: string; password: string}) {
      return registerApi({email, password});
    },
    async onSuccess(result) {
      queryClient.setQueryData(ME_QUERY_KEY, result.user);
    },
  });

  return {
    async register(email: string, password: string): Promise<void> {
      await mutation.mutateAsync({email, password});
    },
    isPending: mutation.isPending,
  };
}

export function useLogout(): {logout: () => Promise<void>; isPending: boolean} {
  const {clearAuth} = useAuthStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logoutApi,
    onSuccess() {
      clearAuth();
      queryClient.removeQueries({queryKey: ME_QUERY_KEY});
    },
  });

  return {
    async logout(): Promise<void> {
      await mutation.mutateAsync();
    },
    isPending: mutation.isPending,
  };
}
