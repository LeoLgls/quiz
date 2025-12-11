'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { useSocket } from '../../../../hooks/useSocket';
import { sessionApi } from '../../../../lib/api';
import { Session, Question, LeaderboardEntry, SessionStatus } from '../../../../../../shared';

export default function StudentSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { user } = useAuth(true, 'STUDENT');
  const { socket, isConnected } = useSocket();
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  useEffect(() => {
    if (socket && sessionId && isConnected) {
      // Rejoindre la session via WebSocket
      socket.emit('join-session', { sessionId });

      // Écouter les événements
      socket.on('session-state', (data: Session) => {
        setSession(data);
        setIsLoading(false);
      });

      socket.on('session-started', ({ session }: { session: Session }) => {
        setSession(session);
      });

      socket.on('question-broadcast', (data: any) => {
        setCurrentQuestion(data.question);
        setTimeLeft(data.timeLimit);
        setHasAnswered(false);
        setAnswer('');
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        setIsSubmitting(false);
      });

      socket.on('question-ended', (data: any) => {
        setLeaderboard(data.leaderboard);
        setCurrentQuestion(null);
      });

      socket.on('session-ended', (data: any) => {
        setLeaderboard(data.finalLeaderboard);
        setSession(prev => prev ? { ...prev, status: SessionStatus.FINISHED } : null);
        setCurrentQuestion(null);
      });

      socket.on('answer-submitted', () => {
        // La réponse a été soumise, on attend la prochaine question automatiquement
        setHasAnswered(true);
        setIsSubmitting(false);
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
        setErrorMessage(error.message || 'Une erreur est survenue');
        setIsSubmitting(false);
        setTimeout(() => setErrorMessage(''), 5000);
      });

      return () => {
        socket.off('session-state');
        socket.off('session-started');
        socket.off('question-broadcast');
        socket.off('question-ended');
        socket.off('session-ended');
        socket.off('answer-submitted');
        socket.off('error');
      };
    }
  }, [socket, sessionId, isConnected]);

  useEffect(() => {
    if (timeLeft > 0 && currentQuestion && !hasAnswered) {
      const timer = setInterval(() => {
        setTimeLeft(t => Math.max(0, t - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, currentQuestion, hasAnswered]);

  const loadSession = async () => {
    try {
      const data = await sessionApi.getSession(sessionId);
      setSession(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (!socket || !currentQuestion || !answer.trim() || hasAnswered || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    socket.emit('submit-answer', {
      sessionId,
      questionId: currentQuestion.id,
      answer: answer.trim(),
      timeToAnswer: currentQuestion.timeLimit ? currentQuestion.timeLimit - timeLeft : undefined,
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Session non trouvée</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {session.quiz?.title || 'Quiz'}
            </h1>
            <div className="flex items-center justify-center gap-4 text-gray-600">
              <span className="px-4 py-2 bg-blue-100 rounded-full font-semibold">
                Code: {session.code}
              </span>
              <span className={`px-4 py-2 rounded-full font-semibold ${
                session.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                session.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {session.status === 'WAITING' && 'En attente'}
                {session.status === 'ACTIVE' && 'En cours'}
                {session.status === 'FINISHED' && 'Terminé'}
              </span>
            </div>
          </div>

          {session.status === 'WAITING' && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">
                En attente du démarrage du quiz par l'enseignant...
              </p>
              <div className="animate-pulse text-4xl">⏳</div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          {session.status === 'ACTIVE' && currentQuestion && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Question {questionNumber} sur {totalQuestions}
                </span>
                <span className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                  {timeLeft}s
                </span>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {currentQuestion.text}
                </h2>

                {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
                  <div className="space-y-3">
                    {(currentQuestion.options as string[]).map((option, index) => (
                      <button
                        key={`${currentQuestion.id}-option-${index}`}
                        onClick={() => setAnswer(String(index))}
                        disabled={hasAnswered}
                        className={`w-full p-4 text-left rounded-lg border-2 transition text-gray-900 font-medium ${
                          answer === String(index)
                            ? 'border-blue-600 bg-blue-100'
                            : 'border-gray-300 hover:border-blue-400 bg-white'
                        } ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type !== 'MULTIPLE_CHOICE' && (
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={hasAnswered}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Votre réponse..."
                  />
                )}
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || hasAnswered || isSubmitting}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasAnswered ? '✓ Réponse envoyée' : isSubmitting ? 'Envoi en cours...' : 'Valider ma réponse'}
              </button>
            </div>
          )}

          {session.status === 'ACTIVE' && !currentQuestion && !hasAnswered && (
            <div className="text-center py-12">
              <div className="animate-pulse text-4xl mb-4">⏳</div>
              <p className="text-xl text-gray-600">
                En attente de la prochaine question...
              </p>
            </div>
          )}

          {session.status === 'ACTIVE' && !currentQuestion && leaderboard.length > 0 && (
            <div className="py-8">
              <h2 className="text-2xl font-bold text-center mb-6">Classement actuel</h2>
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.userId === user?.id ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-700">#{entry.rank}</span>
                      <span className="font-semibold">{entry.userName}</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.status === 'FINISHED' && leaderboard.length > 0 && (
            <div className="py-8">
              <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">Quiz terminé! 🎉</h2>
              <p className="text-center text-gray-600 mb-8">Classement final</p>
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.userId === user?.id ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold">
                        {entry.rank === 1 && '🥇'}
                        {entry.rank === 2 && '🥈'}
                        {entry.rank === 3 && '🥉'}
                        {entry.rank > 3 && `#${entry.rank}`}
                      </span>
                      <span className="font-semibold text-gray-900">{entry.userName}</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{entry.score} pts</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full mt-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Retour au tableau de bord
              </button>
            </div>
          )}

          {session.status === 'FINISHED' && leaderboard.length === 0 && (
            <div className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Quiz terminé! 🎉</h2>
              <p className="text-gray-600 mb-8">Merci d'avoir participé!</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Retour à l'accueil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
