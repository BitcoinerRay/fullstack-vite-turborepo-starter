import {type AxiosRequestConfig} from 'axios';
import {type UserDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {axiosInstance} from '@/lib/axios';

type RequestConfigWithAuthRedirect = AxiosRequestConfig & {
  skipAuthRedirect?: boolean;
};

export async function getMeApi(): Promise<UserDto> {
  const requestConfig: RequestConfigWithAuthRedirect = {skipAuthRedirect: true};
  const {data} = await axiosInstance.get<UserDto>('/users/me', requestConfig);
  return data;
}
