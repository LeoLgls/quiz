import { apiClient } from '../api-client';
import { 
  Quiz, 
  CreateQuizRequest, 
  UpdateQuizRequest,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest
} from '../../../../shared';

export const quizApi = {
  // Obtenir tous mes quiz
  getMyQuizzes: async (): Promise<Quiz[]> => {
    const response = await apiClient.get<{ success: boolean; data: Quiz[] }>('/quizzes');
    return response.data.data;
  },

  // Obtenir un quiz par ID
  getQuizById: async (id: string): Promise<Quiz> => {
    const response = await apiClient.get<{ success: boolean; data: Quiz }>(`/quizzes/${id}`);
    return response.data.data;
  },

  // Créer un quiz
  createQuiz: async (data: CreateQuizRequest): Promise<Quiz> => {
    const response = await apiClient.post<{ success: boolean; data: Quiz }>('/quizzes', data);
    return response.data.data;
  },

  // Mettre à jour un quiz
  updateQuiz: async (id: string, data: UpdateQuizRequest): Promise<Quiz> => {
    const response = await apiClient.put<{ success: boolean; data: Quiz }>(
      `/quizzes/${id}`,
      data
    );
    return response.data.data;
  },

  // Supprimer un quiz
  deleteQuiz: async (id: string): Promise<void> => {
    await apiClient.delete(`/quizzes/${id}`);
  },

  // Ajouter une question
  addQuestion: async (quizId: string, data: CreateQuestionRequest): Promise<Question> => {
    const response = await apiClient.post<{ success: boolean; data: Question }>(
      `/quizzes/${quizId}/questions`,
      data
    );
    return response.data.data;
  },

  // Mettre à jour une question
  updateQuestion: async (questionId: string, data: UpdateQuestionRequest): Promise<Question> => {
    const response = await apiClient.put<{ success: boolean; data: Question }>(
      `/quizzes/questions/${questionId}`,
      data
    );
    return response.data.data;
  },

  // Supprimer une question
  deleteQuestion: async (questionId: string): Promise<void> => {
    await apiClient.delete(`/quizzes/questions/${questionId}`);
  },
};
