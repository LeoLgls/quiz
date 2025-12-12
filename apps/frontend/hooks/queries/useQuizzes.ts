import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { quizApi } from '../../lib/api';
import type { 
  Quiz, 
  CreateQuizRequest, 
  UpdateQuizRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest
} from '../../../../shared';

// Query keys
export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (filters: any) => [...quizKeys.lists(), { filters }] as const,
  details: () => [...quizKeys.all, 'detail'] as const,
  detail: (id: string) => [...quizKeys.details(), id] as const,
};

// Hook pour récupérer tous les quiz
export function useQuizzes() {
  return useQuery({
    queryKey: quizKeys.lists(),
    queryFn: async () => {
      return await quizApi.getMyQuizzes();
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook pour récupérer un quiz par ID
export function useQuiz(id: string) {
  return useQuery({
    queryKey: quizKeys.detail(id),
    queryFn: async () => {
      return await quizApi.getQuizById(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook pour créer un quiz
export function useCreateQuiz() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuizRequest) => {
      return await quizApi.createQuiz(data);
    },
    onSuccess: () => {
      // Invalider la liste des quiz pour forcer un refresh
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      
      // Rediriger vers la liste des quiz
      router.push('/teacher/quizzes');
    },
    onError: (error: any) => {
      console.error('Erreur création quiz:', error);
    },
  });
}

// Hook pour mettre à jour un quiz
export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQuizRequest }) => {
      return await quizApi.updateQuiz(id, data);
    },
    onSuccess: (data, variables) => {
      // Invalider le quiz spécifique et la liste
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Erreur mise à jour quiz:', error);
    },
  });
}

// Hook pour supprimer un quiz
export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await quizApi.deleteQuiz(id);
    },
    onSuccess: () => {
      // Invalider la liste des quiz
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Erreur suppression quiz:', error);
    },
  });
}

// Hook pour ajouter une question
export function useAddQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, data }: { quizId: string; data: CreateQuestionRequest }) => {
      return await quizApi.addQuestion(quizId, data);
    },
    onSuccess: (data, variables) => {
      // Invalider le quiz pour voir la nouvelle question
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(variables.quizId) });
    },
    onError: (error: any) => {
      console.error('Erreur ajout question:', error);
    },
  });
}

// Hook pour mettre à jour une question
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, data }: { questionId: string; data: UpdateQuestionRequest }) => {
      return await quizApi.updateQuestion(questionId, data);
    },
    onSuccess: () => {
      // Invalider tous les quiz car on ne connaît pas le quizId facilement
      queryClient.invalidateQueries({ queryKey: quizKeys.all });
    },
    onError: (error: any) => {
      console.error('Erreur mise à jour question:', error);
    },
  });
}

// Hook pour supprimer une question
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: string) => {
      await quizApi.deleteQuestion(questionId);
    },
    onSuccess: () => {
      // Invalider tous les quiz
      queryClient.invalidateQueries({ queryKey: quizKeys.all });
    },
    onError: (error: any) => {
      console.error('Erreur suppression question:', error);
    },
  });
}
