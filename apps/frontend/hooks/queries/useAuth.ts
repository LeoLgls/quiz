import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import type { LoginRequest, RegisterRequest } from '../../../../shared';

// Hook pour la connexion
export function useLogin() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      return await authApi.login(data);
    },
    onSuccess: (response) => {
      // Sauvegarder dans localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Mettre à jour le store Zustand
      setUser(response.user);
      
      // Rediriger vers le dashboard
      router.push('/dashboard');
    },
    onError: (error: any) => {
      console.error('Erreur de connexion:', error);
    },
  });
}

// Hook pour l'inscription
export function useRegister() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      return await authApi.register(data);
    },
    onSuccess: (response) => {
      // Sauvegarder dans localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Mettre à jour le store Zustand
      setUser(response.user);
      
      // Rediriger vers le dashboard
      router.push('/dashboard');
    },
    onError: (error: any) => {
      console.error('Erreur d\'inscription:', error);
    },
  });
}

// Hook pour récupérer l'utilisateur connecté
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      return await authApi.getMe();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

// Hook pour la déconnexion
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // Pas d'appel API nécessaire, juste nettoyage local
      logout();
    },
    onSuccess: () => {
      // Invalider toutes les queries
      queryClient.clear();
      
      // Rediriger vers login
      router.push('/login');
    },
  });
}
