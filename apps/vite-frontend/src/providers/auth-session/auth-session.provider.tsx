import {useAuthSessionBootstrap} from '@/hooks/use-auth/use-auth.hook';

export function AuthSessionProvider(): null {
  useAuthSessionBootstrap();

  return null;
}
