import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiError, ApiSuccess } from '../types';
import { queryClient } from './queryClient';
/* DEMO-ONLY:START */
import { DEMO_MODE } from '../demo/demoConfig';
import { demoAdapter } from '../demo/adapter';
/* DEMO-ONLY:END */

export interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
  skipAuthRedirect?: boolean;
}

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  withCredentials: true,
});

/* DEMO-ONLY:START — delete this block to talk to the real API again. */
if (DEMO_MODE) {
  axiosInstance.defaults.adapter = demoAdapter;
}
/* DEMO-ONLY:END */

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const config = error.config as RetryConfig | undefined;
    if (error.response?.status !== 401 || !config) {
      return Promise.reject(error);
    }

    if (config.skipAuthRedirect) {
      return Promise.reject(error);
    }

    if (config._retry || config.url?.includes('/auth/refresh') || config.url?.includes('/auth/login')) {
      queryClient.clear();
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    config._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push((token: string) => {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
          resolve(axiosInstance(config));
        });
      });
    }

    isRefreshing = true;
    try {
      const response = await axiosInstance.post<ApiSuccess<{ accessToken: string }>>('/auth/refresh');
      const newToken = response.data.data.accessToken;
      useAuthStore.getState().setAccessToken(newToken);
      onRefreshed(newToken);
      isRefreshing = false;
      
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(config);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      queryClient.clear();
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  },
);

async function unwrap<T>(request: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  const response = await request;
  return response.data.data;
}

async function unwrapWithMeta<T>(request: Promise<{ data: ApiSuccess<T> }>): Promise<ApiSuccess<T>> {
  const response = await request;
  return response.data;
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(axiosInstance.get<ApiSuccess<T>>(url, config)),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => unwrap<T>(axiosInstance.post<ApiSuccess<T>>(url, data, config)),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => unwrap<T>(axiosInstance.put<ApiSuccess<T>>(url, data, config)),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => unwrap<T>(axiosInstance.patch<ApiSuccess<T>>(url, data, config)),
  delete: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(axiosInstance.delete<ApiSuccess<T>>(url, config)),
  getWithMeta: <T>(url: string, config?: AxiosRequestConfig) => unwrapWithMeta<T>(axiosInstance.get<ApiSuccess<T>>(url, config)),
};

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data.error.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
