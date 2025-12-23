/**
 * Server Actions for Authentication
 */

'use server';

import { redirect } from 'next/navigation';
import { createSession, deleteSession, getSession } from '@/lib/session';
import type { ApiResponse } from '@/types';
import { errorResponse, successResponse } from '@/utils/response-helpers';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login with email and password
 */
export async function login(
  credentials: LoginCredentials
): Promise<ApiResponse<{ email: string }>> {
  try {
    const { email, password } = credentials;

    // Validate input
    if (!email || !password) {
      return errorResponse('Email ve şifre gereklidir');
    }

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not configured in .env.local');
      return errorResponse('Sunucu yapılandırma hatası');
    }

    // Check credentials
    if (email !== adminEmail || password !== adminPassword) {
      return errorResponse('Geçersiz email veya şifre');
    }

    // Create session
    await createSession(email);

    return successResponse({ email });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Giriş yapılırken bir hata oluştu');
  }
}

/**
 * Logout and clear session
 */
export async function logout() {
  try {
    await deleteSession();
  } catch (error) {
    console.error('Logout error:', error);
  }

  redirect('/login');
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return {
    email: session.email,
    isAuthenticated: session.isAuthenticated,
  };
}
