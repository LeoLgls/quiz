'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { useSocket } from '../../../../hooks/useSocket';
import { sessionApi } from '../../../../lib/api';
import { Session, LeaderboardEntry } from '../../../../../../shared';

export default function TeacherSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { user } = useAuth(true, 'TEACHER');
  const { socket, isConnected } = useSocket();
  
  const [session, setSession] = useState<Session | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  useEffect(() => {
    if (socket && sessionId && isConnected) {
      socket.emit('join-session', { sessionId });

      socket.on('session-state', (data: Session) => {
        setSession(data);
        setParticipantCount(data.participations?.length || 0);
        setIsLoading(false);
      });

      socket.on('participant-joined', () => {
        loadSession();
      });

      socket.on('answer-received', () => {
        loadLeaderboard();
      });

      socket.on('question-broadcast', () => {
        loadSession();
        loadLeaderboard();
      });

      socket.on('session-ended', (data: any) => {
        setLeaderboard(data.finalLeaderboard || []);
        loadSession();
      });

      return () => {
        socket.off('session-state');
        socket.off('participant-joined');
        socket.off('answer-received');
        socket.off('question-broadcast');
        socket.off('session-ended');
      };
    }
  }, [socket, sessionId, isConnected]);

  const loadSession = async () => {
    try {
      const data = await sessionApi.getSession(sessionId);
      setSession(data);
      setParticipantCount(data.participations?.length || 0);
      if (data.status !== 'WAITING') {
        loadLeaderboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await sessionApi.getLeaderboard(sessionId);
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Session non trouvée</div>;
  }

  const currentQuestionIndex = session.currentQuestion ?? 0;
  const totalQuestions = session.quiz?.questions?.length || 0;
  const hasMoreQuestions = currentQuestionIndex + 1 < totalQuestions;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 
              onClick={() => router.push('/dashboard')}
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition"
            >
              Quiz App
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contrôles */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {session.quiz?.title || 'Quiz'}
              </h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{session.code}</div>
                  <div className="text-sm text-gray-600">Code d'accès</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{participantCount}</div>
                  <div className="text-sm text-gray-600">Participants</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">
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
                    className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Démarrer le quiz
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
                        className="flex-1 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                      >
                        Question suivante →
                      </button>
                    ) : (
                      <button
                        onClick={handleEndSession}
                        className="flex-1 py-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
                      >
                        Terminer le quiz
                      </button>
                    )}
                  </div>
                </div>
              )}

              {session.status === 'FINISHED' && (
                <div className="text-center py-8">
                  <p className="text-2xl font-bold text-gray-900 mb-4">
                    Quiz terminé! 🎉
                  </p>
                  <button
                    onClick={() => router.push('/teacher/quizzes')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Retour aux quiz
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Classement en direct */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Classement en direct
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
