import { http } from './http';

export type LoginPlatform = 'web' | 'android' | 'ios' | 'unknown';

type LoginPayload = {
  email: string;
  password: string;
  fcmToken?: string | null;
  platform: LoginPlatform;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: {
    uid: string;
    full_name: string;
    email: string;
    phone?: string | null;
    whatsapp_number?: string | null;
    profile_picture?: string | null;
    role: string;
    role_id?: string;
    is_superuser?: boolean;
    groups_details?: unknown[];
    owned_groups?: unknown[];
  };
  permissions: Record<string, unknown>;
};

export const login = async ({
  email,
  password,
  fcmToken,
  platform,
}: LoginPayload): Promise<LoginResponse> => {
  const res = await http.post('/auth/login/', {
    email,
    password,
    fcm_token: fcmToken ?? null,
    platform,
  });

  console.log('Login response:', res);

  return res.data;
};
