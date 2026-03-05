import {type UserRole} from '../enums/user-role.enum';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};
