import { useMutation } from '@tanstack/react-query';
import {
  changePassword,
  ChangePasswordPayload,
  ForgotPasswordResetPayload,
  ForgotPasswordSendOTPPayload,
  ForgotPasswordVerifyOTPPayload,
  login,
  LoginPlatform,
  resetForgotPassword,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
} from '../api/auth.api';

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

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  });
};

export const useSendForgotPasswordOTP = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordSendOTPPayload) => sendForgotPasswordOTP(payload),
  });
};

export const useVerifyForgotPasswordOTP = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordVerifyOTPPayload) => verifyForgotPasswordOTP(payload),
  });
};

export const useResetForgotPassword = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordResetPayload) => resetForgotPassword(payload),
  });
};
