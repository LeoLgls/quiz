import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        message: 'Token manquant ou invalide' 
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ 
        success: false, 
        message: 'Token invalide ou expiré' 
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur d\'authentification' 
    });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Accès refusé - Rôle insuffisant' 
      });
      return;
    }

    next();
  };
};
