import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { generateSessionCode } from '../lib/utils';

// Créer une session
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { quizId } = req.body;

    if (!quizId) {
      throw new AppError('Quiz ID requis', 400);
    }

    // Vérifier que le quiz existe et appartient à l'utilisateur
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      throw new AppError('Quiz non trouvé', 404);
    }
    if (quiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }
    if (quiz.questions.length === 0) {
      throw new AppError('Le quiz doit contenir au moins une question', 400);
    }

    // Générer un code unique
    let code = generateSessionCode();
    let existingSession = await prisma.session.findUnique({ where: { code } });
    
    // Régénérer si le code existe déjà
    while (existingSession) {
      code = generateSessionCode();
      existingSession = await prisma.session.findUnique({ where: { code } });
    }

    const session = await prisma.session.create({
      data: {
        code,
        quizId,
        status: 'WAITING',
      },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la création de la session' });
    }
  }
};

// Obtenir une session par ID
export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
        participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            answers: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la session' });
    }
  }
};

// Rejoindre une session via code
export const joinSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { code } = req.body;

    if (!code) {
      throw new AppError('Code requis', 400);
    }

    const session = await prisma.session.findUnique({
      where: { code },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    if (session.status === 'FINISHED') {
      throw new AppError('Cette session est terminée', 400);
    }

    // Vérifier si l'utilisateur a déjà rejoint
    const existingParticipation = await prisma.participation.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: req.user.userId,
        },
      },
    });

    if (existingParticipation) {
      res.json({
        success: true,
        data: {
          session,
          participation: existingParticipation,
        },
      });
      return;
    }

    // Créer la participation
    const participation = await prisma.participation.create({
      data: {
        sessionId: session.id,
        userId: req.user.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        session,
        participation,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la connexion à la session' });
    }
  }
};

// Démarrer une session
export const startSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        quiz: true,
      },
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    if (session.quiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }

    if (session.status !== 'WAITING') {
      throw new AppError('La session a déjà démarré ou est terminée', 400);
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
        currentQuestion: 0,
      },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
        participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors du démarrage de la session' });
    }
  }
};

// Passer à la question suivante
export const nextQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    if (session.quiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }

    if (session.status !== 'ACTIVE') {
      throw new AppError('La session n\'est pas active', 400);
    }

    const currentQuestionIndex = session.currentQuestion ?? 0;
    const nextQuestionIndex = currentQuestionIndex + 1;

    // Vérifier s'il reste des questions
    if (nextQuestionIndex >= session.quiz.questions.length) {
      throw new AppError('Plus de questions disponibles', 400);
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        currentQuestion: nextQuestionIndex,
      },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors du passage à la question suivante' });
    }
  }
};

// Terminer une session
export const endSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        quiz: true,
      },
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    if (session.quiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }

    if (session.status === 'FINISHED') {
      throw new AppError('La session est déjà terminée', 400);
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        status: 'FINISHED',
        finishedAt: new Date(),
      },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
        participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            answers: true,
          },
          orderBy: {
            score: 'desc',
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la fin de la session' });
    }
  }
};

// Soumettre une réponse
export const submitAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { sessionId, questionId, answer, timeToAnswer } = req.body;

    if (!sessionId || !questionId || answer === undefined) {
      throw new AppError('Session ID, Question ID et réponse requis', 400);
    }

    // Vérifier la session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Session non trouvée', 404);
    }

    if (session.status !== 'ACTIVE') {
      throw new AppError('La session n\'est pas active', 400);
    }

    // Vérifier la participation
    const participation = await prisma.participation.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: req.user.userId,
        },
      },
    });

    if (!participation) {
      throw new AppError('Vous n\'avez pas rejoint cette session', 403);
    }

    // Vérifier si l'utilisateur a déjà répondu à cette question
    const existingAnswer = await prisma.answer.findUnique({
      where: {
        participationId_questionId: {
          participationId: participation.id,
          questionId,
        },
      },
    });

    if (existingAnswer) {
      throw new AppError('Vous avez déjà répondu à cette question', 400);
    }

    // Trouver la question
    const question = session.quiz.questions.find(q => q.id === questionId);
    if (!question) {
      throw new AppError('Question non trouvée', 404);
    }

    // Vérifier la réponse
    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    // Créer la réponse
    const createdAnswer = await prisma.answer.create({
      data: {
        participationId: participation.id,
        questionId,
        answer,
        isCorrect,
        timeToAnswer: timeToAnswer || null,
      },
    });

    // Mettre à jour le score si correct
    if (isCorrect) {
      await prisma.participation.update({
        where: { id: participation.id },
        data: {
          score: {
            increment: question.points,
          },
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        answer: createdAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la soumission de la réponse' });
    }
  }
};

// Obtenir le classement d'une session
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const participations = await prisma.participation.findMany({
      where: { sessionId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
    });

    const leaderboard = participations.map((p, index) => ({
      rank: index + 1,
      userId: p.user.id,
      userName: p.user.name,
      score: p.score,
    }));

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du classement' });
  }
};
