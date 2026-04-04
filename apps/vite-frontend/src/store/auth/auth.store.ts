import {create} from 'zustand';
import {type UserDto} from '@next-nest-turbo-auth-boilerplate/shared';

export type AuthSessionStatus = 'loading' | 'authenticated' | 'guest';

type AuthStore = {
  user: UserDto | undefined;
  sessionStatus: AuthSessionStatus;
  isAuthenticated: boolean;
  setUser: (user: UserDto | undefined) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: undefined,
  sessionStatus: 'loading',
  isAuthenticated: false,
  setUser(user): void {
    set({
      user,
      isAuthenticated: user !== undefined,
      sessionStatus: user === undefined ? 'guest' : 'authenticated',
    });
  },
  clearAuth(): void {
    set({user: undefined, sessionStatus: 'guest', isAuthenticated: false});
  },
}));
