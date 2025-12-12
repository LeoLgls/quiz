'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { useQuizzes } from '../../../../hooks/queries/useQuizzes';
import { useCreateSession } from '../../../../hooks/queries/useSessions';
import { getErrorMessage } from '../../../../lib/api-client';

export default function CreateSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizIdParam = searchParams.get('quizId');
  const { user, isLoading: authLoading } = useAuth(true, 'TEACHER');
  const { data: allQuizzes = [], isLoading: quizzesLoading, error: quizzesError } = useQuizzes();
  const createSessionMutation = useCreateSession();
  
  const [selectedQuizId, setSelectedQuizId] = useState(quizIdParam || '');
  const [validationError, setValidationError] = useState('');

  const quizzes = allQuizzes.filter((q) => q.questions && q.questions.length > 0);

  const handleCreateSession = async () => {
    if (!selectedQuizId) {
      setValidationError('Veuillez sélectionner un quiz');
      return;
    }

    setValidationError('');
    createSessionMutation.mutate(
      { quizId: selectedQuizId },
      {
        onSuccess: (session) => {
          router.push(`/teacher/sessions/${session.id}`);
        },
      }
    );
  };

  if (authLoading || quizzesLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  const displayError = validationError || (quizzesError ? getErrorMessage(quizzesError) : '') || (createSessionMutation.isError ? getErrorMessage(createSessionMutation.error) : '');

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(to bottom, #fafafa 0%, #f3f4f6 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600 mb-2">
            Créer une Session
          </h1>
        </div>

        {displayError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {displayError}
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
              disabled={createSessionMutation.isPending || !selectedQuizId}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
            >
              {createSessionMutation.isPending ? 'Création...' : 'Créer la session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
