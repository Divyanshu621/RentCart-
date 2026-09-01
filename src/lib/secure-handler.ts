/**
 * Secure API Response Handler
 * 
 * Ensures all API responses follow a consistent, safe format.
 * Never exposes internal errors, stack traces, or database details to clients.
 */

import { NextResponse } from 'next/server';
import { securityLogger } from './security-logger';

/**
 * Create a safe error response.
 * Internal errors are logged but never exposed to the client.
 */
export function safeError(
  error: unknown,
  context: string = 'API',
  userId: string | null = null,
  defaultStatus: number = 500
): NextResponse {
  // Log the actual error server-side for debugging
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log high-severity errors
  if (defaultStatus >= 500) {
    securityLogger.error(`${context}_ERROR`, context, userId, {
      errorType: error?.constructor?.name || 'Unknown',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
    });
  }

  // Determine safe status and message for the client
  const status = getSafeStatus(error, defaultStatus);
  const message = getSafeMessage(error, defaultStatus);

  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Create a validation error response (400)
 */
export function validationError(message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 400 }
  );
}

/**
 * Create an unauthorized response (401)
 */
export function unauthorized(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Authentication required' },
    { status: 401 }
  );
}

/**
 * Create a forbidden response (403)
 */
export function forbidden(message: string = 'Access denied'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}

/**
 * Create a not found response (404)
 */
export function notFound(message: string = 'Resource not found'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 404 }
  );
}

/**
 * Create a success response
 */
export function success<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, ...data as object }, { status });
}

/**
 * Get safe HTTP status from error
 */
function getSafeStatus(error: unknown, defaultStatus: number): number {
  // Handle Prisma unique constraint errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string };
    if (prismaError.code === 'P2002') return 409; // Unique constraint violation
    if (prismaError.code === 'P2025') return 404; // Record not found
    if (prismaError.code === 'P2003') return 400; // Foreign key constraint
  }

  return defaultStatus;
}

/**
 * Get safe error message (never exposes internals in production)
 */
function getSafeMessage(error: unknown, defaultStatus: number): string {
  // In development, show actual messages for debugging
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) return error.message;
  }

  // Check for known safe errors we can forward
  if (error instanceof Error) {
 // Unique constraint
    if (error.message.includes('Unique constraint')) return 'A record with this value already exists';
    if (error.message.includes('not found')) return 'Resource not found';
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string };
    if (prismaError.code === 'P2002') return 'A record with this value already exists';
    if (prismaError.code === 'P2025') return 'Resource not found';
    if (prismaError.code === 'P2003') return 'Referenced resource does not exist';
  }

  // Generic safe messages
  if (defaultStatus === 400) return 'Invalid request';
  if (defaultStatus === 404) return 'Resource not found';
  return 'Something went wrong. Please try again.';
}
