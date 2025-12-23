/**
 * Session Management Utilities
 * Simple cookie-based session management for admin authentication
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIE_NAME = 'admin-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  email: string;
  isAuthenticated: boolean;
  createdAt: number;
}

/**
 * Create a new session
 */
export async function createSession(email: string) {
  const cookieStore = await cookies();

  const sessionData: SessionData = {
    email,
    isAuthenticated: true,
    createdAt: Date.now(),
  };

  // Store session data as JSON string
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Get current session
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const sessionData: SessionData = JSON.parse(sessionCookie.value);

    // Validate session
    if (!sessionData.isAuthenticated || !sessionData.email) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
}

/**
 * Delete current session
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session?.isAuthenticated === true;
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
