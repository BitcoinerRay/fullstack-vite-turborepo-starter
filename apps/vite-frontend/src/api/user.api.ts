import {type UserDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {axiosInstance} from '@/lib/axios';

export async function getMeApi(): Promise<UserDto> {
  const {data} = await axiosInstance.get<UserDto>('/users/me');
  return data;
}
