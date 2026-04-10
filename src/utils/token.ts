import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';


const TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export type StoredAuthUser = {
  uid?: string;
  email?: string;
  full_name?: string;
  phone?: string | null;
  whatsapp_number?: string | null;
  profile_picture?: string | null;
  role?: string;
  role_id?: string;
  is_superuser?: boolean;
  groups_details?: unknown[];
  owned_groups?: unknown[];
};

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const deleteToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const saveAuthUser = async (user: StoredAuthUser | null) => {
  if (!user) {
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
    return;
  }
  await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user));
};

export const getAuthUser = async (): Promise<StoredAuthUser | null> => {
  const raw = await SecureStore.getItemAsync(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
    return null;
  }
};

export const deleteAuthUser = async () => {
  await SecureStore.deleteItemAsync(AUTH_USER_KEY);
};

export const getUserIdFromToken = async (): Promise<number | null> => {
  const token = await getToken();
  if (!token) return null;

  try {
    const decoded: { user_id: number } = jwtDecode(token);
    return decoded.user_id;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
