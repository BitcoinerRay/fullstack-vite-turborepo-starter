import {type User} from '@next-nest-turbo-auth-boilerplate/db';
import {UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';

const user: User = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: 'stored-password-hash',
  role: UserRole.USER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const userDto = {
  id: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

describe('UsersController', () => {
  const usersService = {
    findById: jest.fn(async () => user),
    toDto: jest.fn(() => userDto),
  } as unknown as UsersService;

  const controller = new UsersController(usersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the current user dto from the payload subject', async () => {
    await expect(
      controller.getMe({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
    ).resolves.toEqual(userDto);

    expect(usersService.findById).toHaveBeenCalledWith(user.id);
    expect(usersService.toDto).toHaveBeenCalledWith(user);
  });
});
