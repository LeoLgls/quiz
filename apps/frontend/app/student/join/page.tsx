'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useJoinSession } from '../../../hooks/queries/useSessions';
import { getErrorMessage } from '../../../lib/api-client';

export default function JoinSessionPage() {
  const { user, isLoading: authLoading } = useAuth(true, 'STUDENT');
  const router = useRouter();
  const joinMutation = useJoinSession();
  
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate(
      { code: code.toUpperCase() },
      {
        onSuccess: ({ session }) => {
          router.push(`/student/session/${session.id}`);
        },
      }
    );
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 relative z-10">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-violet-600 to-cyan-600 mb-2">
            Rejoindre un Quiz
          </h1>
          <p className="text-gray-600 font-medium">
            Entre le code fourni par ton prof
          </p>
        </div>

        {joinMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {getErrorMessage(joinMutation.error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Code d'accès
            </label>
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-50 to-cyan-50 border-3 border-purple-300 rounded-2xl focus:outline-none focus:border-purple-500 focus:shadow-lg transition-all text-center text-3xl font-black tracking-[0.3em] uppercase text-gray-900 placeholder:text-gray-400"
              placeholder="ABC123"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={joinMutation.isPending || code.length !== 6}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-4 rounded-2xl font-black text-lg hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
          >
            {joinMutation.isPending ? 'Connexion...' : 'C\'est parti !'}
          </button>
        </form>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full mt-4 text-gray-600 hover:text-purple-600 transition font-semibold cursor-pointer"
        >
          ← Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}
