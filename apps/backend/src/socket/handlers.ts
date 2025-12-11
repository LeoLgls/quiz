import { Server, Socket } from 'socket.io';
import { verifyToken } from '../lib/jwt';
import prisma from '../lib/prisma';

interface AuthSocket extends Socket {
  userId?: string;
  sessionId?: string;
}

export const setupWebSocket = (io: Server) => {
  // Middleware d'authentification pour Socket.IO
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    socket.userId = decoded.userId;
    next();
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Rejoindre une session
    socket.on('join-session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        socket.sessionId = sessionId;
        socket.join(`session:${sessionId}`);

        // Récupérer la session
        const session = await prisma.session.findUnique({
          where: { id: sessionId },
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

        if (!session) {
          socket.emit('error', { message: 'Session non trouvée' });
          return;
        }

        // Envoyer l'état de la session
        socket.emit('session-state', session);

        // Notifier les autres participants
        socket.to(`session:${sessionId}`).emit('participant-joined', {
          userId: socket.userId,
        });

        console.log(`User ${socket.userId} joined session ${sessionId}`);
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Erreur lors de la connexion à la session' });
      }
    });

    // Quitter une session
    socket.on('leave-session', (data: { sessionId: string }) => {
      const { sessionId } = data;
      socket.leave(`session:${sessionId}`);
      socket.to(`session:${sessionId}`).emit('participant-left', {
        userId: socket.userId,
      });
      console.log(`User ${socket.userId} left session ${sessionId}`);
    });

    // Démarrer une session (enseignant uniquement)
    socket.on('start-session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        const session = await prisma.session.findUnique({
          where: { id: sessionId },
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
          socket.emit('error', { message: 'Session non trouvée' });
          return;
        }

        // Vérifier que l'utilisateur est le créateur
        if (session.quiz.creatorId !== socket.userId) {
          socket.emit('error', { message: 'Accès refusé' });
          return;
        }

        // Mettre à jour la session
        const updatedSession = await prisma.session.update({
          where: { id: sessionId },
          data: {
            status: 'ACTIVE',
            startedAt: new Date(),
            currentQuestion: 0,
          },
        });

        // Diffuser aux participants
        io.to(`session:${sessionId}`).emit('session-started', {
          session: updatedSession,
        });

        // Envoyer la première question
        if (session.quiz.questions.length > 0) {
          const firstQuestion = session.quiz.questions[0];
          io.to(`session:${sessionId}`).emit('question-broadcast', {
            question: {
              id: firstQuestion.id,
              text: firstQuestion.text,
              type: firstQuestion.type,
              options: firstQuestion.options,
              order: firstQuestion.order,
              points: firstQuestion.points,
            },
            timeLimit: firstQuestion.timeLimit || 30,
            questionNumber: 1,
            totalQuestions: session.quiz.questions.length,
          });
        }

        console.log(`Session ${sessionId} started`);
      } catch (error) {
        console.error('Error starting session:', error);
        socket.emit('error', { message: 'Erreur lors du démarrage de la session' });
      }
    });

    // Passer à la question suivante (enseignant uniquement)
    socket.on('next-question', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        const session = await prisma.session.findUnique({
          where: { id: sessionId },
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
          socket.emit('error', { message: 'Session non trouvée' });
          return;
        }

        if (session.quiz.creatorId !== socket.userId) {
          socket.emit('error', { message: 'Accès refusé' });
          return;
        }

        const currentIndex = session.currentQuestion ?? 0;
        const previousQuestion = session.quiz.questions[currentIndex];

        // Envoyer les résultats de la question précédente
        if (previousQuestion) {
          const leaderboard = await getSessionLeaderboard(sessionId);
          io.to(`session:${sessionId}`).emit('question-ended', {
            questionId: previousQuestion.id,
            correctAnswer: previousQuestion.correctAnswer,
            leaderboard,
          });
        }

        const nextIndex = currentIndex + 1;

        // Vérifier s'il reste des questions
        if (nextIndex >= session.quiz.questions.length) {
          socket.emit('error', { message: 'Plus de questions disponibles' });
          return;
        }

        // Mettre à jour la session
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            currentQuestion: nextIndex,
          },
        });

        // Envoyer la prochaine question
        const nextQuestion = session.quiz.questions[nextIndex];
        io.to(`session:${sessionId}`).emit('question-broadcast', {
          question: {
            id: nextQuestion.id,
            text: nextQuestion.text,
            type: nextQuestion.type,
            options: nextQuestion.options,
            order: nextQuestion.order,
            points: nextQuestion.points,
          },
          timeLimit: nextQuestion.timeLimit || 30,
          questionNumber: nextIndex + 1,
          totalQuestions: session.quiz.questions.length,
        });

        console.log(`Session ${sessionId} moved to question ${nextIndex + 1}`);
      } catch (error) {
        console.error('Error moving to next question:', error);
        socket.emit('error', { message: 'Erreur lors du passage à la question suivante' });
      }
    });

    // Soumettre une réponse
    socket.on('submit-answer', async (data: { 
      sessionId: string; 
      questionId: string; 
      answer: string; 
      timeToAnswer?: number 
    }) => {
      try {
        const { sessionId, questionId, answer, timeToAnswer } = data;

        // Vérifier la participation
        const participation = await prisma.participation.findUnique({
          where: {
            sessionId_userId: {
              sessionId,
              userId: socket.userId!,
            },
          },
        });

        if (!participation) {
          socket.emit('error', { message: 'Vous n\'avez pas rejoint cette session' });
          return;
        }

        // Vérifier si déjà répondu
        const existingAnswer = await prisma.answer.findUnique({
          where: {
            participationId_questionId: {
              participationId: participation.id,
              questionId,
            },
          },
        });

        if (existingAnswer) {
          socket.emit('error', { message: 'Vous avez déjà répondu à cette question' });
          return;
        }

        // Trouver la question et la session
        const question = await prisma.question.findUnique({
          where: { id: questionId },
        });

        if (!question) {
          socket.emit('error', { message: 'Question non trouvée' });
          return;
        }

        const session = await prisma.session.findUnique({
          where: { id: sessionId },
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
          socket.emit('error', { message: 'Session non trouvée' });
          return;
        }

        // Vérifier la réponse
        let isCorrect = false;
        
        if (question.type === 'MULTIPLE_CHOICE' && question.options) {
          // Pour les QCM, la réponse est l'index de l'option sélectionnée
          const selectedIndex = parseInt(answer);
          const options = question.options as string[];
          if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < options.length) {
            const selectedOption = options[selectedIndex];
            isCorrect = selectedOption.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
          }
        } else {
          // Pour les autres types de questions, comparaison directe
          isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        }

        // Créer la réponse
        await prisma.answer.create({
          data: {
            participationId: participation.id,
            questionId,
            answer,
            isCorrect,
            timeToAnswer: timeToAnswer || null,
          },
        });

        // Mettre à jour le score
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

        // Confirmer la soumission (sans dire si c'est correct)
        socket.emit('answer-submitted', {
          questionId,
        });

        // Notifier le professeur qu'une réponse a été reçue
        socket.to(`session:${sessionId}`).emit('answer-received', {
          participationId: participation.id,
          userId: socket.userId,
        });

        // Passer automatiquement à la question suivante
        const currentIndex = session.currentQuestion ?? 0;
        const nextIndex = currentIndex + 1;

        if (nextIndex < session.quiz.questions.length) {
          // Il y a une question suivante
          const nextQuestion = session.quiz.questions[nextIndex];

          // Mettre à jour l'index de la question courante
          await prisma.session.update({
            where: { id: sessionId },
            data: { currentQuestion: nextIndex },
          });

          // Envoyer la prochaine question à tout le monde
          io.to(`session:${sessionId}`).emit('question-broadcast', {
            question: {
              id: nextQuestion.id,
              text: nextQuestion.text,
              type: nextQuestion.type,
              options: nextQuestion.options,
              order: nextQuestion.order,
              points: nextQuestion.points,
            },
            timeLimit: nextQuestion.timeLimit || 30,
            questionNumber: nextIndex + 1,
            totalQuestions: session.quiz.questions.length,
          });
        } else {
          // C'était la dernière question - terminer la session
          await prisma.session.update({
            where: { id: sessionId },
            data: {
              status: 'FINISHED',
              finishedAt: new Date(),
            },
          });

          const finalLeaderboard = await getSessionLeaderboard(sessionId);

          io.to(`session:${sessionId}`).emit('session-ended', {
            finalLeaderboard,
          });
        }

        console.log(`Answer submitted by ${socket.userId} for question ${questionId}`);
      } catch (error) {
        console.error('Error submitting answer:', error);
        socket.emit('error', { message: 'Erreur lors de la soumission de la réponse' });
      }
    });

    // Terminer une session (enseignant uniquement)
    socket.on('end-session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: {
            quiz: true,
          },
        });

        if (!session) {
          socket.emit('error', { message: 'Session non trouvée' });
          return;
        }

        if (session.quiz.creatorId !== socket.userId) {
          socket.emit('error', { message: 'Accès refusé' });
          return;
        }

        // Mettre à jour la session
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            status: 'FINISHED',
            finishedAt: new Date(),
          },
        });

        // Obtenir le classement final
        const finalLeaderboard = await getSessionLeaderboard(sessionId);

        // Diffuser la fin de session
        io.to(`session:${sessionId}`).emit('session-ended', {
          finalLeaderboard,
        });

        console.log(`Session ${sessionId} ended`);
      } catch (error) {
        console.error('Error ending session:', error);
        socket.emit('error', { message: 'Erreur lors de la fin de la session' });
      }
    });

    // Annuler/Quitter une session (enseignant uniquement)
    socket.on('cancel-session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: {
            quiz: true,
          },
        });

        if (!session) {
          socket.emit('error', { message: 'Session non trouvée' });
          return;
        }

        if (session.quiz.creatorId !== socket.userId) {
          socket.emit('error', { message: 'Accès refusé' });
          return;
        }

        // Mettre à jour la session comme annulée
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            status: 'FINISHED',
            finishedAt: new Date(),
          },
        });

        // Notifier tous les participants que la session a été annulée
        io.to(`session:${sessionId}`).emit('session-cancelled', {
          message: 'L\'enseignant a mis fin à la session.',
        });

        console.log(`Session ${sessionId} cancelled by teacher`);
      } catch (error) {
        console.error('Error cancelling session:', error);
        socket.emit('error', { message: 'Erreur lors de l\'annulation de la session' });
      }
    });

    // Déconnexion
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      if (socket.sessionId) {
        socket.to(`session:${socket.sessionId}`).emit('participant-disconnected', {
          userId: socket.userId,
        });
      }
    });
  });
};

// Fonction helper pour obtenir le classement
async function getSessionLeaderboard(sessionId: string) {
  const participations = await prisma.participation.findMany({
    where: { sessionId },
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

  return participations.map((p, index) => ({
    rank: index + 1,
    userId: p.user.id,
    userName: p.user.name,
    score: p.score,
  }));
}
