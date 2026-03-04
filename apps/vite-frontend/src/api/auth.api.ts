import {type AuthResponseDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {axiosInstance} from '@/lib/axios';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
};

export async function loginApi(payload: LoginPayload): Promise<AuthResponseDto> {
  const {data} = await axiosInstance.post<AuthResponseDto>('/auth/login', payload);
  return data;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponseDto> {
  const {data} = await axiosInstance.post<AuthResponseDto>('/auth/register', payload);
  return data;
}

export async function logoutApi(): Promise<void> {
  await axiosInstance.post('/auth/logout');
}
