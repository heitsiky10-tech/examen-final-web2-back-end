import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AuthenticatedUser } from '../models/User';

dotenv.config();

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];

if (!SECRET) throw new Error('JWT_SECRET is required in the environment');
const secret: string = SECRET;

export const signAccessToken = (user: AuthenticatedUser): string =>
  jwt.sign(user, secret, { expiresIn: EXPIRES_IN });

export const verifyAccessToken = (token: string): AuthenticatedUser => {
  const { id, name, email, role } = jwt.verify(token, secret) as AuthenticatedUser;
  return { id, name, email, role };
};