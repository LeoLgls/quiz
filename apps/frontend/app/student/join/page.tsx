'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { sessionApi } from '../../../lib/api';

export default function JoinSessionPage() {
  const { user, isLoading: authLoading } = useAuth(true, 'STUDENT');
  const router = useRouter();
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { session } = await sessionApi.joinSession({ code: code.toUpperCase() });
      router.push(`/student/session/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion à la session');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Rejoindre un Quiz
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Entrez le code fourni par votre enseignant
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center text-2xl font-bold tracking-widest uppercase text-gray-900"
              placeholder="ABC123"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Connexion...' : 'Rejoindre'}
          </button>
        </form>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full mt-4 text-gray-600 hover:text-gray-800 transition"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}
