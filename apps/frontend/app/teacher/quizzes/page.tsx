'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useQuizzes, useDeleteQuiz } from '../../../hooks/queries/useQuizzes';
import { Plus, Edit, Trash2, Play } from 'lucide-react';

export default function TeacherQuizzesPage() {
  const { user, isLoading: authLoading } = useAuth(true, 'TEACHER');
  const router = useRouter();
  
  const { data: quizzes = [], isLoading, error } = useQuizzes();
  const deleteQuizMutation = useDeleteQuiz();

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      return;
    }

    deleteQuizMutation.mutate(id);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

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
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-100 to-cyan-100 px-4 py-2 rounded-full">
                <span className="text-gray-800 font-semibold">
                  👤 {user?.name} <span className="text-purple-600">•</span> Enseignant
                </span>
              </div>
              <button
                onClick={() => { router.push('/login'); }}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold cursor-pointer"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-black text-gray-900">Mes Quiz</h2>
          <button
            onClick={() => router.push('/teacher/quizzes/create')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all shadow-lg font-bold cursor-pointer"
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-purple-300">
            <div className="text-7xl mb-4">🎉</div>
            <p className="text-gray-600 text-lg mb-6 font-medium">
              Vous n'avez pas encore créé de quiz
            </p>
            <button
              onClick={() => router.push('/teacher/quizzes/create')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-bold cursor-pointer"
            >
              Créer mon premier quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-purple-100 hover:border-purple-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">📝</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-700 rounded-full text-sm font-bold">
                    {quiz.questions?.length || 0} Q
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">
                  {quiz.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2 font-medium">
                  {quiz.description || 'Sans description'}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/teacher/quizzes/${quiz.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold cursor-pointer"
                  >
                    <Edit size={16} />
                    Éditer
                  </button>
                  <button
                    onClick={() => router.push(`/teacher/sessions/create?quizId=${quiz.id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold cursor-pointer"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all cursor-pointer"
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
