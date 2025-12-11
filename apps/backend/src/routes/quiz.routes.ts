import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// Routes Quiz - Enseignants seulement
router.get('/', authorize('TEACHER'), quizController.getMyQuizzes);
router.get('/:id', authorize('TEACHER'), quizController.getQuizById);
router.post('/', authorize('TEACHER'), quizController.createQuiz);
router.put('/:id', authorize('TEACHER'), quizController.updateQuiz);
router.delete('/:id', authorize('TEACHER'), quizController.deleteQuiz);

// Routes Questions - Enseignants seulement
router.post('/:quizId/questions', authorize('TEACHER'), quizController.addQuestion);
router.put('/questions/:questionId', authorize('TEACHER'), quizController.updateQuestion);
router.delete('/questions/:questionId', authorize('TEACHER'), quizController.deleteQuestion);

export default router;
