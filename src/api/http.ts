import axios from 'axios';
import { getToken } from '../utils/token';

export const http = axios.create({
  baseURL: 'https://api.crm.dev.luminartechnohub.com/api', 
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
