import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken } from '../lib/jwt';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password || !name) {
      throw new AppError('Email, mot de passe et nom requis', 400);
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 409);
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'STUDENT',
      },
    });

    // Générer le token
    const token = generateToken(user);

    // Réponse sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription' });
    }
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Email et mot de passe requis', 400);
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Générer le token
    const token = generateToken(user);

    // Réponse sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la connexion' });
    }
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Non authentifié', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération du profil' });
    }
  }
};
