import { apiClient } from '../api-client';
import { 
  Session, 
  CreateSessionRequest,
  JoinSessionRequest,
  SubmitAnswerRequest,
  LeaderboardEntry,
  Participation
} from '../../../../shared';

export const sessionApi = {
  // Créer une session
  createSession: async (data: CreateSessionRequest): Promise<Session> => {
    const response = await apiClient.post<{ success: boolean; data: Session }>(
      '/sessions',
      data
    );
    return response.data.data;
  },

  // Obtenir une session par ID
  getSession: async (id: string): Promise<Session> => {
    const response = await apiClient.get<{ success: boolean; data: Session }>(
      `/sessions/${id}`
    );
    return response.data.data;
  },

  // Rejoindre une session
  joinSession: async (data: JoinSessionRequest): Promise<{ session: Session; participation: Participation }> => {
    const response = await apiClient.post<{ 
      success: boolean; 
      data: { session: Session; participation: Participation } 
    }>('/sessions/join', data);
    return response.data.data;
  },

  // Démarrer une session (enseignant)
  startSession: async (id: string): Promise<Session> => {
    const response = await apiClient.post<{ success: boolean; data: Session }>(
      `/sessions/${id}/start`
    );
    return response.data.data;
  },

  // Passer à la question suivante (enseignant)
  nextQuestion: async (id: string): Promise<Session> => {
    const response = await apiClient.post<{ success: boolean; data: Session }>(
      `/sessions/${id}/next`
    );
    return response.data.data;
  },

  // Terminer une session (enseignant)
  endSession: async (id: string): Promise<Session> => {
    const response = await apiClient.post<{ success: boolean; data: Session }>(
      `/sessions/${id}/end`
    );
    return response.data.data;
  },

  // Soumettre une réponse
  submitAnswer: async (data: SubmitAnswerRequest & { sessionId: string }): Promise<{
    answer: any;
    isCorrect: boolean;
    points: number;
  }> => {
    const response = await apiClient.post<{ 
      success: boolean; 
      data: { answer: any; isCorrect: boolean; points: number } 
    }>('/sessions/answer', data);
    return response.data.data;
  },

  // Obtenir le classement
  getLeaderboard: async (id: string): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<{ success: boolean; data: LeaderboardEntry[] }>(
      `/sessions/${id}/leaderboard`
    );
    return response.data.data;
  },
};
