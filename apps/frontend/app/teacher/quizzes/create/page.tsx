'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { quizApi } from '../../../../lib/api';
import { QuestionType } from '../../../../../../shared';

export default function CreateQuizPage() {
  const { user, isLoading: authLoading } = useAuth(true, 'TEACHER');
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'MULTIPLE_CHOICE' as QuestionType,
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        timeLimit: 30,
        order: questions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Créer le quiz
      const quiz = await quizApi.createQuiz({
        title: formData.title,
        description: formData.description,
      });

      // Ajouter les questions
      for (const question of questions) {
        await quizApi.addQuestion(quiz.id, {
          text: question.text,
          type: question.type,
          options: question.type === 'MULTIPLE_CHOICE' ? question.options : undefined,
          correctAnswer: question.correctAnswer,
          points: question.points,
          order: question.order,
          timeLimit: question.timeLimit,
        });
      }

      router.push('/teacher/quizzes');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du quiz');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Créer un quiz</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informations générales</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du quiz *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ex: Quiz de mathématiques"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                  placeholder="Description du quiz..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ajouter une question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      required
                      value={q.text}
                      onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Texte de la question"
                    />

                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="MULTIPLE_CHOICE">QCM</option>
                      <option value="TRUE_FALSE">Vrai/Faux</option>
                      <option value="TEXT">Texte libre</option>
                    </select>

                    {q.type === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Options:</label>
                        {q.options.map((opt: string, optIndex: number) => (
                          <input
                            key={optIndex}
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...q.options];
                              newOptions[optIndex] = e.target.value;
                              updateQuestion(index, 'options', newOptions);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder={`Option ${optIndex + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    <input
                      type="text"
                      required
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Réponse correcte"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600">Points</label>
                        <input
                          type="number"
                          min="1"
                          value={isNaN(q.points) ? '' : q.points}
                          onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Temps (sec)</label>
                        <input
                          type="number"
                          min="5"
                          value={isNaN(q.timeLimit) ? '' : q.timeLimit}
                          onChange={(e) => updateQuestion(index, 'timeLimit', parseInt(e.target.value) || 30)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || questions.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Création...' : 'Créer le quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
