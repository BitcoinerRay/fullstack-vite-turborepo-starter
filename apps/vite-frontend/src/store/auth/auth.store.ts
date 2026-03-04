import {create} from 'zustand';
import {type UserDto} from '@next-nest-turbo-auth-boilerplate/shared';

type AuthStore = {
  user: UserDto | undefined;
  isAuthenticated: boolean;
  setUser: (user: UserDto | undefined) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: undefined,
  isAuthenticated: false,
  setUser(user): void {
    set({user, isAuthenticated: user !== undefined});
  },
  clearAuth(): void {
    set({user: undefined, isAuthenticated: false});
  },
}));
