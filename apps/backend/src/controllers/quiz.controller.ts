import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

// Obtenir tous les quiz de l'utilisateur connecté
export const getMyQuizzes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const quizzes = await prisma.quiz.findMany({
      where: { creatorId: req.user.userId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des quiz' });
    }
  }
};

// Obtenir un quiz par ID
export const getQuizById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new AppError('Quiz non trouvé', 404);
    }

    // Vérifier que l'utilisateur est le créateur
    if (req.user && quiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération du quiz' });
    }
  }
};

// Créer un quiz
export const createQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { title, description } = req.body;

    if (!title) {
      throw new AppError('Le titre est requis', 400);
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        creatorId: req.user.userId,
      },
      include: {
        questions: true,
      },
    });

    res.status(201).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la création du quiz' });
    }
  }
};

// Mettre à jour un quiz
export const updateQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { id } = req.params;
    const { title, description } = req.body;

    // Vérifier que le quiz existe et appartient à l'utilisateur
    const existingQuiz = await prisma.quiz.findUnique({ where: { id } });
    if (!existingQuiz) {
      throw new AppError('Quiz non trouvé', 404);
    }
    if (existingQuiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du quiz' });
    }
  }
};

// Supprimer un quiz
export const deleteQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { id } = req.params;

    // Vérifier que le quiz existe et appartient à l'utilisateur
    const existingQuiz = await prisma.quiz.findUnique({ 
      where: { id },
      include: {
        sessions: {
          include: {
            participations: {
              include: {
                answers: true,
              },
            },
          },
        },
      }
    });
    
    if (!existingQuiz) {
      throw new AppError('Quiz non trouvé', 404);
    }
    if (existingQuiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }

    // Supprimer en cascade : Answers -> Participations -> Sessions -> Quiz
    for (const session of existingQuiz.sessions) {
      // Supprimer toutes les réponses de chaque participation
      for (const participation of session.participations) {
        await prisma.answer.deleteMany({
          where: { participationId: participation.id }
        });
      }
      
      // Supprimer toutes les participations de la session
      await prisma.participation.deleteMany({
        where: { sessionId: session.id }
      });
    }

    // Supprimer toutes les sessions du quiz
    await prisma.session.deleteMany({
      where: { quizId: id }
    });

    // Supprimer le quiz (les questions seront supprimées en cascade grâce au schéma)
    await prisma.quiz.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Quiz supprimé avec succès',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Delete quiz error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la suppression du quiz',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

// Ajouter une question à un quiz
export const addQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { quizId } = req.params;
    const { text, type, options, correctAnswer, points, order, timeLimit } = req.body;

    // Vérifier que le quiz existe et appartient à l'utilisateur
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      throw new AppError('Quiz non trouvé', 404);
    }
    if (quiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }

    // Validation
    if (!text || !type || !correctAnswer) {
      throw new AppError('Texte, type et réponse correcte requis', 400);
    }

    const question = await prisma.question.create({
      data: {
        quizId,
        text,
        type,
        options: options || null,
        correctAnswer,
        points: points || 1,
        order: order || 0,
        timeLimit: timeLimit || null,
      },
    });

    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de la question' });
    }
  }
};

// Mettre à jour une question
export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { questionId } = req.params;
    const { text, type, options, correctAnswer, points, order, timeLimit } = req.body;

    // Vérifier que la question existe et que l'utilisateur est le créateur du quiz
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });

    if (!existingQuestion) {
      throw new AppError('Question non trouvée', 404);
    }
    if (existingQuestion.quiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(text && { text }),
        ...(type && { type }),
        ...(options !== undefined && { options }),
        ...(correctAnswer && { correctAnswer }),
        ...(points !== undefined && { points }),
        ...(order !== undefined && { order }),
        ...(timeLimit !== undefined && { timeLimit }),
      },
    });

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la question' });
    }
  }
};

// Supprimer une question
export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const { questionId } = req.params;

    // Vérifier que la question existe et que l'utilisateur est le créateur du quiz
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });

    if (!existingQuestion) {
      throw new AppError('Question non trouvée', 404);
    }
    if (existingQuestion.quiz.creatorId !== req.user.userId) {
      throw new AppError('Accès refusé', 403);
    }

    await prisma.question.delete({ where: { id: questionId } });

    res.json({
      success: true,
      message: 'Question supprimée avec succès',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la question' });
    }
  }
};
