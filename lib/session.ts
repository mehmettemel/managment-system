/**
 * Session Management Utilities
 * Secure, encrypted cookie-based session management using iron-session
 */

import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface SessionData {
  email: string;
  isAuthenticated: boolean;
  createdAt: number;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long'; // Fallback for dev only

export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'admin-session-v2', // Changed name to avoid conflicts with old plain cookie
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
  ttl: 60 * 60 * 24 * 7, // 7 days (in seconds for iron-session v8+)
};

/**
 * Get the Iron Session object
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Create a new session
 */
export async function createSession(email: string) {
  const session = await getSession();
  session.email = email;
  session.isAuthenticated = true;
  session.createdAt = Date.now();
  await session.save();
}

/**
 * Delete current session
 */
export async function deleteSession() {
  const session = await getSession();
  session.destroy();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isAuthenticated === true;
}

/**
 * Require authentication or redirect to login
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect('/login');
  }
}
