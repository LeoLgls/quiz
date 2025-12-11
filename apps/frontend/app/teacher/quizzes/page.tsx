'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { quizApi } from '../../../lib/api';
import { Quiz } from '../../../../../shared';
import { Plus, Edit, Trash2, Play } from 'lucide-react';

export default function TeacherQuizzesPage() {
  const { user, isLoading: authLoading } = useAuth(true, 'TEACHER');
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      loadQuizzes();
    }
  }, [authLoading, user]);

  const loadQuizzes = async () => {
    try {
      const data = await quizApi.getMyQuizzes();
      setQuizzes(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      return;
    }

    try {
      await quizApi.deleteQuiz(id);
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

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
            <span className="text-gray-700">
              {user?.name}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Mes Quiz</h2>
          <button
            onClick={() => router.push('/teacher/quizzes/create')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            <Plus size={20} />
            Créer un quiz
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              Vous n'avez pas encore créé de quiz
            </p>
            <button
              onClick={() => router.push('/teacher/quizzes/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Créer mon premier quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {quiz.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {quiz.description || 'Aucune description'}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  {quiz.questions?.length || 0} question(s)
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/teacher/quizzes/${quiz.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Edit size={16} />
                    Éditer
                  </button>
                  <button
                    onClick={() => router.push(`/teacher/sessions/create?quizId=${quiz.id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
