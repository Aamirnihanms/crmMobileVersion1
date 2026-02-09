import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth.api';

type LoginInput = {
  email: string;
  password: string;
};

export const useLogin = () => {
  return useMutation({
    mutationFn: ({ email, password }: LoginInput) =>
      login(email, password),
  });
};
