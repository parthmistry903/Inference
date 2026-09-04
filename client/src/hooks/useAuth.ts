import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, axiosInstance, getApiErrorMessage, type RetryConfig } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import type { ApiSuccess, User } from '../types';
import { queryClient } from '../services/queryClient';

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface RegisterResponse {
  user: User;
}

export function useAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, accessToken, isAuthenticated, setAuth, setUser, setAccessToken, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadUser(): Promise<void> {
      if (accessToken && user) {
        setIsLoading(false);
        return;
      }
      let token = accessToken;
      try {
        if (!token) {
          const refresh = await axiosInstance.post<ApiSuccess<{ accessToken: string }>>(
            '/auth/refresh',
            undefined,
            { skipAuthRedirect: true } as RetryConfig,
          );
          token = refresh.data.data.accessToken;
          if (!cancelled) setAccessToken(token);
        }
        const response = await api.get<{ user: User }>('/auth/me');
        if (!cancelled) setUser(response.user);
      } catch {
        if (!cancelled) {
          queryClient.clear();
          clearAuth();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadUser();
    return () => {
      cancelled = true;
    };
  }, [accessToken, clearAuth, setAccessToken, setUser, user]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await api.post<AuthResponse>('/auth/login', { email, password });
        queryClient.clear();
        setAuth(response.user, response.accessToken);
        toast('Signed in successfully', 'success');
        navigate('/dashboard');
      } catch (error) {
        toast(getApiErrorMessage(error), 'error');
        throw error;
      }
    },
    [navigate, setAuth, toast],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        await api.post<RegisterResponse>('/auth/register', { name, email, password });
        const response = await api.post<AuthResponse>('/auth/login', { email, password });
        queryClient.clear();
        setAuth(response.user, response.accessToken);
        toast('Account created successfully', 'success');
        navigate('/dashboard');
      } catch (error) {
        toast(getApiErrorMessage(error), 'error');
        throw error;
      }
    },
    [navigate, setAuth, toast],
  );

  const logout = useCallback(async () => {
    try {
      await api.post<{ message: string }>('/auth/logout');
      toast('Logged out successfully', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error), 'error');
    } finally {
      queryClient.clear();
      clearAuth();
      navigate('/login');
    }
  }, [clearAuth, navigate, toast]);

  return {
    user,
    isAuthenticated: isAuthenticated && Boolean(user && accessToken),
    isLoading,
    login,
    register,
    logout,
  };
}
