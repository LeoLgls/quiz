import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { sessionApi } from '../../lib/api';
import type { 
  Session, 
  CreateSessionRequest,
  JoinSessionRequest,
} from '../../../../shared';

// Query keys
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters: any) => [...sessionKeys.lists(), { filters }] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
  leaderboard: (id: string) => [...sessionKeys.all, 'leaderboard', id] as const,
};

// Hook pour récupérer une session par ID
export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: async () => {
      return await sessionApi.getSession(id);
    },
    enabled: !!id,
    staleTime: 1000 * 30, // 30 secondes (sessions en temps réel)
  });
}

// Hook pour récupérer le leaderboard
export function useLeaderboard(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.leaderboard(sessionId),
    queryFn: async () => {
      return await sessionApi.getLeaderboard(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 1000 * 10, // 10 secondes
  });
}

// Hook pour créer une session
export function useCreateSession() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionRequest) => {
      return await sessionApi.createSession(data);
    },
    onSuccess: (session) => {
      // Invalider les sessions
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      
      // Rediriger vers la session créée
      router.push(`/teacher/sessions/${session.id}`);
    },
    onError: (error: any) => {
      console.error('Erreur création session:', error);
    },
  });
}

// Hook pour rejoindre une session
export function useJoinSession() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: JoinSessionRequest) => {
      return await sessionApi.joinSession(data);
    },
    onSuccess: (result) => {
      // Rediriger vers la session
      router.push(`/student/session/${result.session.id}`);
    },
    onError: (error: any) => {
      console.error('Erreur rejoindre session:', error);
    },
  });
}

// Hook pour démarrer une session
export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      return await sessionApi.startSession(sessionId);
    },
    onSuccess: (session) => {
      // Invalider la session pour refresh
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(session.id) });
    },
    onError: (error: any) => {
      console.error('Erreur démarrage session:', error);
    },
  });
}

// Hook pour passer à la question suivante
export function useNextQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      return await sessionApi.nextQuestion(sessionId);
    },
    onSuccess: (session) => {
      // Invalider la session et le leaderboard
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(session.id) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.leaderboard(session.id) });
    },
    onError: (error: any) => {
      console.error('Erreur question suivante:', error);
    },
  });
}

// Hook pour terminer une session
export function useEndSession() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      return await sessionApi.endSession(sessionId);
    },
    onSuccess: (session) => {
      // Invalider la session et le leaderboard
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(session.id) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.leaderboard(session.id) });
    },
    onError: (error: any) => {
      console.error('Erreur fin session:', error);
    },
  });
}
