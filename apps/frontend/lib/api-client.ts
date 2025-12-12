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
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses - Gestion centralisée des erreurs
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ message?: string; error?: string }>) => {
    // Gestion des erreurs HTTP
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token invalide ou expiré
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Rediriger vers la page de connexion si pas déjà dessus
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Accès refusé
          console.error('Accès refusé:', data.message || data.error);
          break;
          
        case 404:
          // Ressource non trouvée
          console.error('Ressource non trouvée:', data.message || data.error);
          break;
          
        case 500:
          // Erreur serveur
          console.error('Erreur serveur:', data.message || data.error);
          break;
          
        default:
          console.error('Erreur:', data.message || data.error);
      }
      
      // Retourner un message d'erreur formaté
      return Promise.reject({
        status,
        message: data.message || data.error || 'Une erreur est survenue',
      });
    } else if (error.request) {
      // Requête envoyée mais pas de réponse reçue
      console.error('Aucune réponse du serveur');
      return Promise.reject({
        status: 0,
        message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
      });
    } else {
      // Erreur lors de la configuration de la requête
      console.error('Erreur de configuration:', error.message);
      return Promise.reject({
        status: 0,
        message: error.message || 'Une erreur est survenue',
      });
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
