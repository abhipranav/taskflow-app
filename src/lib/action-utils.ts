/**
 * Server Action Utilities
 * Standardized wrappers for server actions with logging, error handling, and security
 */

import { auth } from "@/auth";
import { logger, getErrorMessage } from "@/lib/logger";
import { checkRateLimit, getClientIdentifier, sanitizeInput, isValidUUID } from "@/lib/security";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface ActionContext {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
}

/**
 * Wraps a server action with authentication, logging, and error handling
 */
export async function withAuth<TInput, TOutput>(
  actionName: string,
  input: TInput,
  handler: (input: TInput, ctx: ActionContext) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  const startTime = performance.now();
  
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      logger.warn(`${actionName} unauthorized attempt`);
      return { success: false, error: "Please sign in to continue" };
    }
    
    const ctx: ActionContext = {
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
    };
    
    logger.debug(`${actionName} started`, { userId: ctx.userId, action: actionName });
    
    const result = await handler(input, ctx);
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`${actionName} completed`, { userId: ctx.userId, action: actionName, duration });
    
    return { success: true, data: result };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.error(`${actionName} failed`, error, { action: actionName, duration });
    
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Wraps a server action that doesn't require authentication
 */
export async function withLogging<TInput, TOutput>(
  actionName: string,
  input: TInput,
  handler: (input: TInput) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  const startTime = performance.now();
  
  try {
    logger.debug(`${actionName} started`);
    
    const result = await handler(input);
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`${actionName} completed`, { action: actionName, duration });
    
    return { success: true, data: result };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.error(`${actionName} failed`, error, { action: actionName, duration });
    
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Rate-limited action wrapper
 */
export async function withRateLimit<TInput, TOutput>(
  actionName: string,
  input: TInput,
  handler: (input: TInput, ctx: ActionContext) => Promise<TOutput>,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<ActionResult<TOutput>> {
  try {
    const identifier = await getClientIdentifier();
    const { allowed, resetIn } = checkRateLimit(`${actionName}:${identifier}`, {
      maxRequests,
      windowSeconds,
    });
    
    if (!allowed) {
      logger.warn(`${actionName} rate limited`, { metadata: { identifier } });
      return { 
        success: false, 
        error: `Too many requests. Please wait ${resetIn} seconds.` 
      };
    }
    
    return withAuth(actionName, input, handler);
  } catch (error) {
    logger.error(`${actionName} rate limit check failed`, error);
    return withAuth(actionName, input, handler);
  }
}

/**
 * Validation helpers
 */
export function validateRequired(
  fields: Record<string, unknown>,
  required: string[]
): string | null {
  for (const field of required) {
    if (fields[field] === undefined || fields[field] === null || fields[field] === "") {
      return `${field} is required`;
    }
  }
  return null;
}

export function validateUUID(id: string, fieldName: string = "ID"): string | null {
  if (!isValidUUID(id)) {
    return `Invalid ${fieldName} format`;
  }
  return null;
}

export function validateStringLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): string | null {
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (trimmed.length > max) {
    return `${fieldName} must be less than ${max} characters`;
  }
  return null;
}

/**
 * Sanitize and validate common inputs
 */
export function sanitizeTitle(title: string): string {
  return sanitizeInput(title).slice(0, 500);
}

export function sanitizeDescription(desc: string): string {
  return sanitizeInput(desc).slice(0, 10000);
}

/**
 * Type guard for error handling
 */
export function isActionError<T>(result: ActionResult<T>): result is { success: false; error: string } {
  return !result.success;
}
