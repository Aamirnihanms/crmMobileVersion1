import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import { getToken } from '../utils/token';

export const http = axios.create({
  baseURL: 'https://api.crm.dev.luminartechnohub.com/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(async (config) => {
  console.log(`🚀 Calling API: ${config.method?.toUpperCase()} ${config.url}`);
  try {
    // ❌ Skip token for login endpoint
    if (config.url?.includes('/login')) {
      return config;
    }

    const token = await getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
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
    const status = error.response?.data?.status;
    const errorMessage = error.response?.data?.error;

    if (status === 'expired' || errorMessage?.includes('expired')) {
      console.warn('⚠️ Session expired. Logging out...');
      await useAuthStore.getState().logout();
    }

    console.error(
      `❌ API Error [${error.config?.method?.toUpperCase()} ${error.config?.url}]:`,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);
