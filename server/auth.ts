import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'agemar_governanca_secret_2026';

export interface JwtPayload {
  id: string;
  networkLogin: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Editor' | 'Visualizador';
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  try {
    const token = header.slice(7);
    (req as any).user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const user = (req as any).user as JwtPayload;
    if (user.role !== 'Administrador') {
      res.status(403).json({ error: 'Acesso restrito a administradores.' });
      return;
    }
    next();
  });
}
