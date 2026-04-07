import {beforeEach, describe, expect, it} from 'vitest';
import {type UserDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {useAuthStore} from './auth.store';

const sampleUser: UserDto = {
  id: 'user-1',
  email: 'user@example.com',
  role: UserRole.USER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({user: undefined, isAuthenticated: false, sessionStatus: 'loading'});
  });

  it('starts in the loading session state with no user', () => {
    expect(useAuthStore.getState()).toMatchObject({
      user: undefined,
      isAuthenticated: false,
      sessionStatus: 'loading',
    });
  });

  it('marks the session as authenticated when a user is set', () => {
    useAuthStore.getState().setUser(sampleUser);

    expect(useAuthStore.getState()).toMatchObject({
      user: sampleUser,
      isAuthenticated: true,
      sessionStatus: 'authenticated',
    });
  });

  it('transitions to guest when setUser is called with undefined', () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().setUser(undefined);

    expect(useAuthStore.getState()).toMatchObject({
      user: undefined,
      isAuthenticated: false,
      sessionStatus: 'guest',
    });
  });

  it('clearAuth wipes the user and forces guest status', () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState()).toMatchObject({
      user: undefined,
      isAuthenticated: false,
      sessionStatus: 'guest',
    });
  });
});
