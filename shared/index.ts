// Enums
export enum Role {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  TEXT = 'TEXT'
}

export enum SessionStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED'
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}

// Quiz Types
export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  creatorId: string;
  creator?: User;
  questions?: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
}

// Question Types
export interface Question {
  id: string;
  quizId: string;
  text: string;
  type: QuestionType;
  options: string[] | null;
  correctAnswer: string;
  points: number;
  order: number;
  timeLimit: number | null;
  createdAt: Date;
}

export interface CreateQuestionRequest {
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  points?: number;
  order: number;
  timeLimit?: number;
}

export interface UpdateQuestionRequest {
  text?: string;
  type?: QuestionType;
  options?: string[];
  correctAnswer?: string;
  points?: number;
  order?: number;
  timeLimit?: number;
}

// Session Types
export interface Session {
  id: string;
  code: string;
  quizId: string;
  quiz?: Quiz;
  status: SessionStatus;
  currentQuestion: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  participations?: Participation[];
}

export interface CreateSessionRequest {
  quizId: string;
}

// Participation Types
export interface Participation {
  id: string;
  sessionId: string;
  userId: string;
  user?: User;
  score: number;
  joinedAt: Date;
  answers?: Answer[];
}

export interface JoinSessionRequest {
  code: string;
}

// Answer Types
export interface Answer {
  id: string;
  participationId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  answeredAt: Date;
  timeToAnswer: number | null;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string;
  timeToAnswer?: number;
}

// WebSocket Events Types
export interface SocketEvents {
  // Client -> Server
  JOIN_SESSION: { sessionId: string; userId: string };
  SUBMIT_ANSWER: { sessionId: string; questionId: string; answer: string; timeToAnswer?: number };
  
  // Server -> Client
  SESSION_STARTED: { session: Session };
  QUESTION_BROADCAST: { question: Question; timeLimit: number };
  ANSWER_RECEIVED: { participationId: string };
  QUESTION_ENDED: { questionId: string; correctAnswer: string; leaderboard: LeaderboardEntry[] };
  SESSION_ENDED: { finalLeaderboard: LeaderboardEntry[] };
  PARTICIPANT_JOINED: { participant: Participation };
  ERROR: { message: string };
}

// Leaderboard Types
export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  rank: number;
}

// Statistics Types
export interface QuizStatistics {
  totalParticipants: number;
  averageScore: number;
  questionsStats: QuestionStatistics[];
}

export interface QuestionStatistics {
  questionId: string;
  questionText: string;
  correctAnswers: number;
  totalAnswers: number;
  averageTime: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
