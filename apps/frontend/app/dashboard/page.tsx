'use client';

import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth';

export default function DashboardPage() {
  const { user, isLoading } = useAuth(true);
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">Quiz App</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {user.name} ({user.role === 'TEACHER' ? 'Enseignant' : 'Étudiant'})
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {user.role === 'TEACHER' && (
            <>
              <div
                onClick={() => router.push('/teacher/quizzes')}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes Quiz</h2>
                <p className="text-gray-600">
                  Créer, modifier et gérer vos quiz
                </p>
              </div>
              <div
                onClick={() => router.push('/teacher/sessions')}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sessions</h2>
                <p className="text-gray-600">
                  Lancer et gérer des sessions de quiz en direct
                </p>
              </div>
            </>
          )}
          {user.role === 'STUDENT' && (
            <div
              onClick={() => router.push('/student/join')}
              className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-blue-500"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Rejoindre un Quiz</h2>
              <p className="text-gray-600">
                Entrer un code pour participer à un quiz
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
