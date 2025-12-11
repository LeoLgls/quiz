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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Créer une session</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un quiz *
            </label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              Vous n'avez pas encore de quiz avec des questions. Créez-en un d'abord!
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateSession}
              disabled={isLoading || !selectedQuizId}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Création...' : 'Créer la session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
