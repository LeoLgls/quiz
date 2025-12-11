import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center max-w-4xl px-6">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Quiz App
        </h1>
        <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
          Créez des quiz interactifs en temps réel et participez à des sessions de questions dynamiques.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg hover:shadow-xl"
          >
            Inscription
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pour les Enseignants</h3>
            <p className="text-gray-600">
              Créez et gérez vos quiz, lancez des sessions en direct et suivez les résultats
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Temps Réel</h3>
            <p className="text-gray-600">
              Diffusion instantanée des questions et synchronisation de tous les participants
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pour les Étudiants</h3>
            <p className="text-gray-600">
              Rejoignez des sessions, répondez aux questions et consultez votre classement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
