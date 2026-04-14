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

export type ChangePasswordPayload = {
  confirm_password: string;
  current_password: string;
  new_password: string;
};

export type ForgotPasswordSendOTPPayload = {
  email: string;
};

export type ForgotPasswordVerifyOTPPayload = {
  email: string;
  otp: string;
};

export type ForgotPasswordResetPayload = {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
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

export const changePassword = async (payload: ChangePasswordPayload) => {
  const res = await http.post('/change/password/', payload);
  return res.data;
};

export const sendForgotPasswordOTP = async (payload: ForgotPasswordSendOTPPayload) => {
  const res = await http.post('/auth/forgot-password/send-otp/', payload);
  return res.data;
};

export const verifyForgotPasswordOTP = async (payload: ForgotPasswordVerifyOTPPayload) => {
  const res = await http.post('/auth/forgot-password/verify-otp/', payload);
  return res.data;
};

export const resetForgotPassword = async (payload: ForgotPasswordResetPayload) => {
  const res = await http.post('/auth/forgot-password/reset-password/', payload);
  return res.data;
};
