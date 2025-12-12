'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { useSocket } from '../../../../hooks/useSocket';
import { useSession, useLeaderboard } from '../../../../hooks/queries/useSessions';
import { Session, LeaderboardEntry } from '../../../../../../shared';

export default function TeacherSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { user } = useAuth(true, 'TEACHER');
  const { socket, isConnected } = useSocket();

  // Utiliser TanStack Query pour le chargement initial
  const { data: initialSession, isLoading: sessionLoading, refetch: refetchSession } = useSession(sessionId);
  const { data: initialLeaderboard = [], refetch: refetchLeaderboard } = useLeaderboard(sessionId);

  const [session, setSession] = useState<Session | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  // Initialiser avec les données de TanStack Query
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      setParticipantCount(initialSession.participations?.length || 0);
    }
  }, [initialSession]);

  useEffect(() => {
    if (initialLeaderboard.length > 0) {
      setLeaderboard(initialLeaderboard);
    }
  }, [initialLeaderboard]);

  useEffect(() => {
    if (socket && sessionId && isConnected) {
      socket.emit('join-session', { sessionId });

      socket.on('session-state', (data: Session) => {
        setSession(data);
        setParticipantCount(data.participations?.length || 0);
      });

      socket.on('session-started', () => {
        // Le quiz a démarré, recharger la session pour avoir le nouveau statut
        refetchSession();
      });

      socket.on('participant-joined', () => {
        // Recharger la session pour avoir les nouveaux participants
        refetchSession();
        refetchLeaderboard();
      });

      socket.on('answer-received', () => {
        refetchLeaderboard();
      });

      socket.on('question-broadcast', () => {
        // Recharger la session pour avoir le nouveau currentQuestion
        refetchSession();
        refetchLeaderboard();
      });

      socket.on('session-ended', (data: any) => {
        setLeaderboard(data.finalLeaderboard || []);
        // Recharger la session pour avoir le statut FINISHED
        refetchSession();
      });

      return () => {
        socket.off('session-state');
        socket.off('session-started');
        socket.off('participant-joined');
        socket.off('answer-received');
        socket.off('question-broadcast');
        socket.off('session-ended');
      };
    }
  }, [socket, sessionId, isConnected, refetchSession, refetchLeaderboard]);

  const handleCancelSession = () => {
    if (participantCount === 0) {
      // Pas de participants, juste rediriger
      router.push('/teacher/quizzes');
    } else {
      // Il y a des participants, notifier et rediriger
      if (socket) {
        socket.emit('cancel-session', { sessionId });
      }
      router.push('/teacher/quizzes');
    }
  };

  const handleStartSession = () => {
    if (socket) {
      socket.emit('start-session', { sessionId });
    }
  };

  const handleNextQuestion = () => {
    if (socket) {
      socket.emit('next-question', { sessionId });
    }
  };

  const handleEndSession = () => {
    if (socket && confirm('Êtes-vous sûr de vouloir terminer cette session ?')) {
      socket.emit('end-session', { sessionId });
    }
  };

  if (sessionLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Session non trouvée</div>;
  }

  const currentQuestionIndex = session.currentQuestion ?? 0;
  const totalQuestions = session.quiz?.questions?.length || 0;
  const hasMoreQuestions = currentQuestionIndex + 1 < totalQuestions;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #fafafa 0%, #f3f4f6 100%)' }}>
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1
              onClick={() => router.push('/dashboard')}
              className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600 cursor-pointer hover:scale-105 transition"
            >
              Kaskroot!
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contrôles */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-purple-100">
              <h2 className="text-3xl font-black text-gray-900 mb-4">
                📝 {session.quiz?.title || 'Quiz'}
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center border-2 border-purple-200">
                  <div className="text-3xl font-black text-purple-600">{session.code}</div>
                  <div className="text-sm text-gray-600 font-semibold">Code d'accès</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl text-center border-2 border-cyan-200">
                  <div className="text-3xl font-black text-cyan-600">{participantCount}</div>
                  <div className="text-sm text-gray-600 font-semibold">Participants</div>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-4 rounded-xl text-center border-2 border-violet-200">
                  <div className="text-3xl font-black text-violet-600">
                    {session.status === 'FINISHED' ? totalQuestions : currentQuestionIndex + 1}/{totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
              </div>

              {session.status === 'WAITING' && (
                <div className="space-y-4">
                  <p className="text-gray-600 text-center">
                    En attente des participants... Partagez le code <span className="font-bold text-blue-600">{session.code}</span>
                  </p>
                  <button
                    onClick={handleStartSession}
                    disabled={participantCount === 0}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black text-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Démarrer le quiz
                  </button>
                  <button
                    onClick={handleCancelSession}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    Quitter la session
                  </button>
                </div>
              )}

              {session.status === 'ACTIVE' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">
                      Question {currentQuestionIndex + 1}:
                    </p>
                    <p className="text-gray-700">
                      {session.quiz?.questions?.[currentQuestionIndex]?.text || 'Chargement...'}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    {hasMoreQuestions ? (
                      <button
                        onClick={handleNextQuestion}
                        className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl font-black hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                      >
                        Question suivante →
                      </button>
                    ) : (
                      <button
                        onClick={handleEndSession}
                        className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-black hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                      >
                        Terminer le quiz
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={handleCancelSession}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    Quitter la session
                  </button>
                </div>
              )}

              {session.status === 'FINISHED' && (
                <div className="text-center py-8">
                  <p className="text-2xl font-bold text-gray-900 mb-4">
                    Quiz terminé! 🎉
                  </p>
                  <button
                    onClick={() => router.push('/teacher/quizzes')}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-bold cursor-pointer"
                  >
                    Terminer la session
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Classement en direct */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-cyan-100">
              <h3 className="text-2xl font-black text-gray-900 mb-4">
                🏆 Classement
              </h3>
              {leaderboard.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Aucun score pour le moment
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl border-2 border-purple-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-700">
                          {entry.rank === 1 && '🥇'}
                          {entry.rank === 2 && '🥈'}
                          {entry.rank === 3 && '🥉'}
                          {entry.rank > 3 && `#${entry.rank}`}
                        </span>
                        <span className="font-medium text-gray-900">
                          {entry.userName}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {entry.score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
