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
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #fafafa 0%, #f3f4f6 100%)' }}>
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">
              Kaskroot!
            </h1>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-100 to-cyan-100 px-4 py-2 rounded-full">
                <span className="text-gray-800 font-semibold">
                  👤 {user.name} <span className="text-purple-600">•</span> {user.role === 'TEACHER' ? 'Enseignant' : 'Étudiant'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold cursor-pointer"
              >
                Se déconnecter
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
                className="group relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-purple-200 hover:border-purple-400 hover:scale-[1.02] overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-transparent rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition"></div>
                <div className="relative">
                  <div className="text-5xl mb-3">📚</div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Mes Quiz</h2>
                  <p className="text-gray-600 font-medium">
                    Créer et gérer vos quiz interactifs
                  </p>
                </div>
              </div>
              <div
                onClick={() => router.push('/teacher/sessions')}
                className="group relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-cyan-200 hover:border-cyan-400 hover:scale-[1.02] overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400 to-transparent rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition"></div>
                <div className="relative">
                  <div className="text-5xl mb-3">🌐</div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Sessions</h2>
                  <p className="text-gray-600 font-medium">
                    Animer des quiz en ligne
                  </p>
                </div>
              </div>
            </>
          )}
          {user.role === 'STUDENT' && (
            <div
              onClick={() => router.push('/student/join')}
              className="group relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-purple-200 hover:border-purple-400 hover:scale-[1.02] overflow-hidden md:col-span-2 max-w-2xl mx-auto"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-transparent rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition"></div>
              <div className="relative text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-4xl font-black text-gray-900 mb-3">Rejoindre un Quiz</h2>
                <p className="text-gray-600 font-medium text-lg">
                  Entrez un code d'accès pour participer
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
