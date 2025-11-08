import api from './api';
import type { LoginRequest, LoginResponse, User, UpdateUserRequest, ApiResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async getProfile(): Promise<{ user: User }> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(data: UpdateUserRequest): Promise<{ user: User }> {
    const response = await api.put<ApiResponse & { user: User }>('/auth/profile', data);
    return response.data;
  },

  async updatePassword(password: string): Promise<void> {
    await api.put<ApiResponse>('/auth/profile/password', { password });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setStoredAuth(token: string, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};
