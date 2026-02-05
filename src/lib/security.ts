/**
 * Security utilities for TaskFlow
 * Rate limiting, input sanitization, and protection helpers
 */

import { headers } from "next/headers";

// ============================================
// Rate Limiting (In-Memory for development)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowSeconds: 60,
};

/**
 * Check if a request should be rate limited
 * Returns true if the request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = `rate:${identifier}`;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Start new window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowSeconds,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Get client identifier for rate limiting
 * Uses IP address with fallback
 */
export async function getClientIdentifier(): Promise<string> {
  try {
    const headersList = await headers();
    return (
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitize user input for safe storage
 * Removes null bytes and control characters
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars
    .trim();
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// ============================================
// SQL Injection Prevention
// ============================================

/**
 * Check for potential SQL injection patterns
 * Note: Always use parameterized queries - this is an additional safety layer
 */
export function hasSqlInjectionPatterns(input: string): boolean {
  const patterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(--|#|\/\*)/,
    /(\bor\b|\band\b).*[=<>]/gi,
    /['";]/,
  ];
  return patterns.some(pattern => pattern.test(input));
}

// ============================================
// Content Security
// ============================================

/**
 * Validate file upload type
 */
export function isAllowedFileType(
  mimeType: string,
  allowedTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/markdown",
  ]
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function isAllowedFileSize(
  bytes: number,
  maxBytes: number = 10 * 1024 * 1024 // 10MB default
): boolean {
  return bytes > 0 && bytes <= maxBytes;
}

// ============================================
// CSRF Protection Helper
// ============================================

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate request origin matches allowed origins
 */
export async function validateOrigin(allowedOrigins?: string[]): Promise<boolean> {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin");
    const host = headersList.get("host");

    if (!origin || !host) return false;

    const defaults = [
      `http://${host}`,
      `https://${host}`,
      "http://localhost:3000",
      "https://localhost:3000",
    ];

    const allowed = allowedOrigins ? [...defaults, ...allowedOrigins] : defaults;
    return allowed.some(o => origin.startsWith(o));
  } catch {
    return false;
  }
}

// ============================================
// Error Sanitization
// ============================================

/**
 * Sanitize error for client response
 * Removes sensitive info in production
 */
export function sanitizeErrorForClient(
  error: unknown,
  isDevelopment: boolean = process.env.NODE_ENV === "development"
): string {
  if (isDevelopment && error instanceof Error) {
    return error.message;
  }

  // Generic messages for production
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("unauthorized") || message.includes("auth")) {
      return "Authentication required";
    }
    if (message.includes("forbidden") || message.includes("permission")) {
      return "You don't have permission to perform this action";
    }
    if (message.includes("not found")) {
      return "The requested resource was not found";
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return "Invalid input provided";
    }
  }

  return "An unexpected error occurred. Please try again.";
}

// ============================================
// Action Security Wrapper
// ============================================

export interface SecureActionOptions {
  /** Require authentication */
  requireAuth?: boolean;
  /** Rate limit configuration */
  rateLimit?: RateLimitConfig;
  /** Validate request origin */
  validateOrigin?: boolean;
}

/**
 * Create a secure action wrapper with built-in protections
 */
export function createSecureAction<TInput, TOutput>(
  handler: (input: TInput, userId?: string) => Promise<TOutput>,
  options: SecureActionOptions = {}
) {
  return async (input: TInput): Promise<TOutput> => {
    // Rate limiting check
    if (options.rateLimit) {
      const identifier = await getClientIdentifier();
      const { allowed, resetIn } = checkRateLimit(identifier, options.rateLimit);
      if (!allowed) {
        throw new Error(`Rate limited. Please try again in ${resetIn} seconds.`);
      }
    }

    // Origin validation
    if (options.validateOrigin) {
      const isValid = await validateOrigin();
      if (!isValid) {
        throw new Error("Invalid request origin");
      }
    }

    return handler(input);
  };
}
