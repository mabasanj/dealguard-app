import { apiClient } from '../api-client';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  image?: string;
  isVerified: boolean;
  identityVerified: boolean;
  createdAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'BUYER' | 'SELLER';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  idNumber?: string;
  passportNumber?: string;
  country?: string;
  businessName?: string;
  businessRegistration?: string;
  bankAccount?: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return apiClient.post('/auth/register', data);
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  getProfile: async (): Promise<{ user: User }> => {
    return apiClient.get('/auth/profile');
  },

  updateProfile: async (data: ProfileUpdateData): Promise<{ user: User; message: string }> => {
    return apiClient.put('/auth/profile', data);
  },

  verifyEmail: async (): Promise<{ message: string }> => {
    return apiClient.post('/auth/verify-email', {});
  },

  logout: () => {
    apiClient.removeToken();
  },

  setAuthToken: (token: string) => {
    apiClient.setToken(token);
  },
};

// Backward-compatible alias used by existing pages.
export const authService = authApi;