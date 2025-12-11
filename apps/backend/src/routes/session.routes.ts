import { Router } from 'express';
import * as sessionController from '../controllers/session.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// Routes Session
router.post('/', authorize('TEACHER'), sessionController.createSession);
router.get('/:id', sessionController.getSession);
router.post('/join', sessionController.joinSession);
router.post('/:id/start', authorize('TEACHER'), sessionController.startSession);
router.post('/:id/next', authorize('TEACHER'), sessionController.nextQuestion);
router.post('/:id/end', authorize('TEACHER'), sessionController.endSession);

// Routes Réponses
router.post('/answer', sessionController.submitAnswer);

// Routes Classement
router.get('/:id/leaderboard', sessionController.getLeaderboard);

export default router;
