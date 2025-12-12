import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Créer l'instance axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour les requêtes - Ajouter le token JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore server-side/localStorage access errors
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Helper to extract a message from an unknown error
type MaybeErrorData = { message?: string; error?: string } | undefined;
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<MaybeErrorData>;
    const data = axiosErr.response?.data as MaybeErrorData;
    return data?.message || data?.error || axiosErr.message || 'Une erreur est survenue';
  }

  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err) || String(err);
  } catch {
    return String(err);
  }
}

// Intercepteur pour les réponses - Gestion centralisée des erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<MaybeErrorData>) => {
    // Gestion des erreurs HTTP (side-effects comme logout)
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Token invalide ou expiré
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } catch {
            // ignore
          }

          // Rediriger vers la page de connexion si pas déjà dessus
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;

        case 403:
          console.error('Accès refusé:', data?.message || data?.error);
          break;

        case 404:
          console.error('Ressource non trouvée:', data?.message || data?.error);
          break;

        case 500:
          console.error('Erreur serveur:', data?.message || data?.error);
          break;

        default:
          console.error('Erreur:', data?.message || data?.error);
      }

      // Propager l'AxiosError pour que TanStack Query puisse y accéder
      return Promise.reject(error);
    } else if (error.request) {
      // Requête envoyée mais pas de réponse reçue
      console.error('Aucune réponse du serveur');
      return Promise.reject(error);
    } else {
      // Erreur lors de la configuration de la requête
      console.error('Erreur de configuration:', error.message);
      return Promise.reject(error);
    }
  }
);

// Helper pour extraire le message d'erreur
export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'Une erreur est survenue';
  
  if (typeof error === 'string') return error;
  
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }
  
  return 'Une erreur est survenue';
};

export { apiClient };
export default apiClient;
