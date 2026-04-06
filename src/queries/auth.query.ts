import { useMutation } from '@tanstack/react-query';
import { login, LoginPlatform } from '../api/auth.api';

type LoginInput = {
  email: string;
  password: string;
  fcmToken?: string | null;
  platform: LoginPlatform;
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
  });
};
