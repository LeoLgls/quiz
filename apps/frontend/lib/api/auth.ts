import { apiClient } from '../api-client';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  User 
} from '../../../shared';

export const authApi = {
  // Inscription
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      data
    );
    return response.data.data;
  },

  // Connexion
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/login',
      data
    );
    return response.data.data;
  },

  // Récupérer le profil de l'utilisateur connecté
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  },
};
