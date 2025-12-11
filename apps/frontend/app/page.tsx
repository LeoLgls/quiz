import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
      <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '4s' }}></div>

      <div className="text-center max-w-4xl px-6 relative z-10">
        <h1 className="text-7xl font-black text-white mb-4 drop-shadow-2xl">
          Kaskroot!
        </h1>
        <p className="text-2xl text-white/90 mb-12 max-w-2xl mx-auto font-medium drop-shadow-lg">
          Créez des quiz interactifs en temps réel et participez à des sessions de questions dynamiques.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Link
            href="/login"
            className="px-10 py-5 bg-white text-purple-700 rounded-2xl font-black text-lg hover:shadow-2xl hover:scale-105 transition-all shadow-xl cursor-pointer"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-3 border-white/30 rounded-2xl font-black text-lg hover:shadow-2xl hover:scale-105 transition-all shadow-xl cursor-pointer"
          >
            Inscription
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/30 hover:scale-105 transition-all">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600 mb-3">Pour les Enseignants</h3>
            <p className="text-gray-600 font-medium">
              Créez et gérez vos quiz, lancez des sessions en direct et suivez les résultats
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/30 hover:scale-105 transition-all">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 mb-3">Temps Réel</h3>
            <p className="text-gray-600 font-medium">
              Diffusion instantanée des questions et synchronisation de tous les participants
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/30 hover:scale-105 transition-all">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600 mb-3">Pour les Étudiants</h3>
            <p className="text-gray-600 font-medium">
              Rejoignez des sessions, répondez aux questions et consultez votre classement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
