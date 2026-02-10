import axios from 'axios';
import { getToken } from '../utils/token';

export const http = axios.create({
  baseURL: 'https://api.crm.dev.luminartechnohub.com/api', 
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Swallow token errors so requests can proceed unauthenticated.
  }
  return config;
});
