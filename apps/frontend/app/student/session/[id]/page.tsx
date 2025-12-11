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
  const [quizTitle, setQuizTitle] = useState<string>('');
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

      socket.on('session-cancelled', (data: any) => {
        // L'enseignant a annulé la session
        alert(data.message || 'L\'enseignant a mis fin à la session.');
        router.push('/dashboard');
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
        socket.off('session-cancelled');
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
      if (data.quiz?.title) {
        setQuizTitle(data.quiz.title);
      }
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
    <div className="min-h-screen relative overflow-hidden p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/30">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600 mb-3">
              {quizTitle || 'Quiz'}
            </h1>
            <div className="flex items-center justify-center gap-4 text-gray-600">
              <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-cyan-100 rounded-full font-bold text-purple-700">
                {session.code}
              </span>
              <span className={`px-4 py-2 rounded-full font-bold ${
                session.status === 'WAITING' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800' :
                session.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' :
                'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800'
              }`}>
                {session.status === 'WAITING' && 'En attente'}
                {session.status === 'ACTIVE' && 'En cours'}
                {session.status === 'FINISHED' && 'Terminé'}
              </span>
            </div>
          </div>

          {session.status === 'WAITING' && (
            <div className="text-center py-12">
              <div className="text-7xl mb-6 animate-float">⏳</div>
              <p className="text-xl text-gray-700 mb-4 font-medium">
                En attente du démarrage...
              </p>
              <p className="text-gray-500">Le prof va bientôt lancer le quiz !</p>
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
                <span className="text-sm font-bold text-gray-600">
                  📝 Question {questionNumber}/{totalQuestions}
                </span>
                <span className={`text-3xl font-black ${
                  timeLeft <= 5 ? 'text-red-600 animate-pulse scale-110' : 
                  timeLeft <= 10 ? 'text-orange-500' : 
                  'text-purple-600'
                }`}>
                  ⏱️ {timeLeft}s
                </span>
              </div>

              <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-cyan-50 p-6 rounded-2xl border-2 border-purple-200">
                <h2 className="text-2xl font-black text-gray-900 mb-4">
                  {currentQuestion.text}
                </h2>

                {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
                  <div className="space-y-3">
                    {(currentQuestion.options as string[]).map((option, index) => (
                      <button
                        key={`${currentQuestion.id}-option-${index}`}
                        onClick={() => setAnswer(String(index))}
                        disabled={hasAnswered}
                        className={`w-full p-4 text-left rounded-xl border-3 transition-all text-gray-900 font-bold ${
                          answer === String(index)
                            ? 'border-purple-600 bg-gradient-to-r from-purple-100 to-cyan-100 shadow-lg scale-[1.02]'
                            : 'border-gray-300 hover:border-purple-400 hover:shadow-md bg-white'
                        } ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}`}
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
                    className="w-full px-4 py-3 bg-white border-3 border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 focus:shadow-lg transition-all text-gray-900 font-medium placeholder:text-gray-400"
                    placeholder="Tape ta réponse ici..."
                  />
                )}
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || hasAnswered || isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-2xl font-black text-lg hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {hasAnswered ? 'Réponse envoyée !' : isSubmitting ? 'Envoi...' : 'Valider ma réponse'}
              </button>
            </div>
          )}

          {session.status === 'ACTIVE' && !currentQuestion && !hasAnswered && (
            <div className="text-center py-12">
              <div className="text-5xl mb-6 animate-float">⏳</div>
              <p className="text-xl text-gray-700 font-medium">
                En attente de la prochaine question...
              </p>
            </div>
          )}

          {session.status === 'ACTIVE' && !currentQuestion && leaderboard.length > 0 && (
            <div className="py-8">
              <h2 className="text-3xl font-black text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">Classement actuel</h2>
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      entry.userId === user?.id ? 'bg-gradient-to-r from-purple-100 to-cyan-100 border-3 border-purple-400 shadow-lg' : 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-gray-700">#{entry.rank}</span>
                      <span className="font-bold">{entry.userName}</span>
                    </div>
                    <span className="text-xl font-black text-purple-600">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.status === 'FINISHED' && leaderboard.length > 0 && (
            <div className="py-8">
              <h2 className="text-4xl font-black text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">Quiz terminé !</h2>
              <p className="text-center text-gray-600 mb-8 font-medium">Classement final</p>
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      entry.userId === user?.id ? 'bg-gradient-to-r from-purple-100 to-cyan-100 border-3 border-purple-400 shadow-lg' : 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black">
                        {entry.rank === 1 && '🥇'}
                        {entry.rank === 2 && '🥈'}
                        {entry.rank === 3 && '🥉'}
                        {entry.rank > 3 && `#${entry.rank}`}
                      </span>
                      <span className="font-bold text-gray-900">{entry.userName}</span>
                    </div>
                    <span className="text-2xl font-black text-purple-600">{entry.score} pts</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full mt-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl font-black hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                ← Retour au tableau de bord
              </button>
            </div>
          )}

          {session.status === 'FINISHED' && leaderboard.length === 0 && (
            <div className="py-12 text-center">
              <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">Quiz terminé !</h2>
              <p className="text-gray-600 mb-8 font-medium">Merci d'avoir participé!</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl font-black hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                ← Retour à l'accueil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
