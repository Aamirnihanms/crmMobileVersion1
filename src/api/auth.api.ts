import { http } from './http';

export type LoginResponse = {
  access: string;
  refresh: string;
  user: {
    email: string;
    full_name: string;
    role: string;
    uid: string;
  };
  permissions: Record<string, any>;
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const res = await http.post('/auth/login/', {
    email,
    password,
  });

  return res.data;
};
