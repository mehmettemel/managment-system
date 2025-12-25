/**
 * Server Actions for Authentication
 */

'use server';

import { redirect } from 'next/navigation';
import { createSession, deleteSession, getSession } from '@/lib/session';
import type { ApiResponse } from '@/types';
import { errorResponse, successResponse } from '@/utils/response-helpers';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';

export interface LoginCredentials {
  email: string;
  password: string;
}

// Simple in-memory rate limiter
// Note: This resets on server restart/redeploy. For persistent rate limiting, use Redis.
const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

async function checkRateLimit(identifier: string): Promise<boolean> {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    rateLimitMap.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if block expired
  if (now - record.lastAttempt > BLOCK_DURATION_MS) {
    rateLimitMap.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  record.lastAttempt = now;
  return true;
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

    // Rate Limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const isAllowed = await checkRateLimit(ip);

    if (!isAllowed) {
      return errorResponse(
        'Çok fazla başarısız giriş denemesi. Lütfen 15 dakika bekleyin.'
      );
    }

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not configured in .env.local');
      return errorResponse('Sunucu yapılandırma hatası');
    }

    // Check email
    if (email !== adminEmail) {
      return errorResponse('Geçersiz email veya şifre');
    }

    // Check password (Supports both Hash and Plaintext for backward compatibility validation)
    // IMPORTANT: Production SHOULD use BCrypt hash
    let isPasswordValid = false;

    if (adminPassword.startsWith('$2a$') || adminPassword.startsWith('$2b$')) {
      // It looks like a bcrypt hash
      isPasswordValid = await bcrypt.compare(password, adminPassword);
    } else {
      // Fallback to plaintext comparison (Legacy)
      // TODO: Force hash in future
      isPasswordValid = password === adminPassword;
    }

    if (!isPasswordValid) {
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

  if (!session || !session.isAuthenticated) {
    return null;
  }

  return {
    email: session.email,
    isAuthenticated: session.isAuthenticated,
  };
}
