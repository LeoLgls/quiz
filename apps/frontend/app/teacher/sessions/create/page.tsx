'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { sessionApi, quizApi } from '../../../../lib/api';
import { Quiz } from '../../../../../../shared';

export default function CreateSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizIdParam = searchParams.get('quizId');
  const { user, isLoading: authLoading } = useAuth(true, 'TEACHER');
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState(quizIdParam || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      loadQuizzes();
    }
  }, [authLoading, user]);

  const loadQuizzes = async () => {
    try {
      const data = await quizApi.getMyQuizzes();
      setQuizzes(data.filter((q: Quiz) => q.questions && q.questions.length > 0));
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des quiz');
    }
  };

  const handleCreateSession = async () => {
    if (!selectedQuizId) {
      setError('Veuillez sélectionner un quiz');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const session = await sessionApi.createSession({ quizId: selectedQuizId });
      router.push(`/teacher/sessions/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la session');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(to bottom, #fafafa 0%, #f3f4f6 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600 mb-2">
            Créer une Session
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-6 border-2 border-purple-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sélectionner un quiz *
            </label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-900"
            >
              <option value="">-- Choisir un quiz --</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title} ({quiz.questions?.length || 0} questions)
                </option>
              ))}
            </select>
          </div>

          {quizzes.length === 0 && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl text-yellow-800 font-medium">
              ⚠️ Vous n'avez pas encore de quiz. Créez-en un d'abord!
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold cursor-pointer"
            >
              ← Annuler
            </button>
            <button
              onClick={handleCreateSession}
              disabled={isLoading || !selectedQuizId}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
            >
              {isLoading ? 'Création...' : 'Créer la session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
