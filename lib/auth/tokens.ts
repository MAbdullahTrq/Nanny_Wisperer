/**
 * Token service for shortlist, CV, interview, chat. T5.3 — JWT with 7-day expiry.
 */

import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';

export type TokenType = 'shortlist' | 'cv' | 'interview' | 'chat';

export interface TokenPayload {
  type: TokenType;
  shortlistId?: string;
  matchId?: string;
  hostId?: string;
  nannyId?: string;
  roomId?: string;
  exp?: number;
  iat?: number;
}

const DEFAULT_EXPIRY_DAYS = 7;
const SECRET = config.auth.jwtSecret || config.auth.nextAuthSecret || 'fallback-token-secret-change-in-production';

export function generateToken(type: TokenType, payload: Omit<TokenPayload, 'type' | 'exp' | 'iat'>): string {
  const exp = Math.floor(Date.now() / 1000) + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60;
  const full: TokenPayload = { type, ...payload, exp };
  return jwt.sign(full, SECRET, { algorithm: 'HS256' });
}

export function validateToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    if (!decoded.type || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function generateShortlistToken(shortlistId: string, hostId?: string): string {
  return generateToken('shortlist', { shortlistId, hostId });
}

export function generateCvToken(matchId: string, shortlistId?: string, hostId?: string, nannyId?: string): string {
  return generateToken('cv', { matchId, shortlistId, hostId, nannyId });
}

export function generateInterviewToken(matchId: string, hostId?: string, nannyId?: string): string {
  return generateToken('interview', { matchId, hostId, nannyId });
}

export function generateChatToken(roomId: string, hostId?: string, nannyId?: string): string {
  return generateToken('chat', { roomId, hostId, nannyId });
}
