import axios from 'axios';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { getToken } from '../utils/token';
import { API_CONFIG } from '../config/api.config';
import { getErrorMessage } from '../utils/error';

export const http = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(async (config) => {
  console.log(`🚀 Calling API: ${config.method?.toUpperCase()} ${config.url}`);
  try {
    // ❌ Skip token for login endpoint
    if (config.url?.includes('/login')) {
      return config;
    }

    // 1. Try getting token from in-memory store (fast & reliable on iOS)
    let token = useAuthStore.getState().token;

    // 2. Fallback to SecureStore if memory is empty but we should be logged in
    if (!token && useAuthStore.getState().isLoggedIn) {
      console.warn('⚠️ Token missing from memory, attempting SecureStore recovery...');
      token = await getToken();
      if (token) {
        useAuthStore.getState().setToken(token);
      }
    }

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } else if (useAuthStore.getState().isLoggedIn) {
      console.error(`❌ Missing Auth Token for protected route: ${config.url}`);
    }
  } catch (err) {
    console.error('❌ Interceptor Auth Error:', err);
  }
  return config;
}, (error) => {
  console.error('❌ API Request Error:', error);
  return Promise.reject(error);
});

http.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const errorMessage = getErrorMessage(error);

    // Handle session expiration
    if (status === 401 || data?.status === 'expired' || data?.error?.includes('expired')) {
      console.warn('⚠️ Session expired. Logging out...');
      if (!error.config?.url?.includes('/auth/logout/')) {
        await useAuthStore.getState().logout(true);
      }
      // Only show alert if it's not a background fetch or if you want it everywhere
      // Usually, 401 logout is enough, but an alert can clarify why.
      return Promise.reject(error);
    }

    // Global Error Alert (Handled by React Query's MutationCache now)
    // We skip alerts here to prevent duplicate error popups.
    const isSilent = error.config?.silent; 
    const isGet = error.config?.method?.toLowerCase() === 'get';
    

    console.error(
      `❌ API Error [${error.config?.method?.toUpperCase()} ${error.config?.url}]:`,
      data || error.message
    );
    return Promise.reject(error);
  }
);
