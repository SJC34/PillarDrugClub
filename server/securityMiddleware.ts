import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { createSecurityEvent } from './auditLogger';

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    createSecurityEvent(req, {
      eventType: 'rate_limit_exceeded',
      severity: 'medium',
      details: { path: req.path, method: req.method },
    }).catch(console.error);
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.',
  handler: (req, res) => {
    createSecurityEvent(req, {
      eventType: 'auth_rate_limit_exceeded',
      email: req.body?.email,
      severity: 'high',
      details: { path: req.path, attempts: 'max_exceeded' },
    }).catch(console.error);
    
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked. Please try again in 15 minutes.',
    });
  },
});

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.fda.gov", "https://clinicaltables.nlm.nih.gov"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;

export async function checkAccountLockout(email: string): Promise<boolean> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) return false;

  if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
    return true;
  }

  if (user.accountLockedUntil && new Date(user.accountLockedUntil) <= new Date()) {
    await db
      .update(users)
      .set({
        accountLockedUntil: null,
        failedLoginAttempts: 0,
      })
      .where(eq(users.id, user.id));
  }

  return false;
}

export async function recordFailedLogin(email: string, req: Request): Promise<void> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    await createSecurityEvent(req, {
      eventType: 'failed_login',
      email,
      severity: 'medium',
      details: { reason: 'user_not_found' },
    });
    return;
  }

  const failedAttempts = (user.failedLoginAttempts || 0) + 1;
  const shouldLockout = failedAttempts >= MAX_FAILED_ATTEMPTS;

  await db
    .update(users)
    .set({
      failedLoginAttempts: failedAttempts,
      accountLockedUntil: shouldLockout
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
        : null,
    })
    .where(eq(users.id, user.id));

  await createSecurityEvent(req, {
    userId: user.id,
    eventType: shouldLockout ? 'account_lockout' : 'failed_login',
    email,
    severity: shouldLockout ? 'high' : 'medium',
    details: {
      failedAttempts,
      lockedUntil: shouldLockout ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
    },
  });
}

export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      accountLockedUntil: null,
    })
    .where(eq(users.id, userId));
}

export function validateSessionTimeout(req: Request, res: Response, next: NextFunction) {
  // Skip session validation for public endpoints (sitemap, robots.txt, health checks, etc.)
  const publicPaths = ['/sitemap.xml', '/robots.txt', '/health', '/api/ping'];
  if (publicPaths.some(path => req.path === path)) {
    return next();
  }
  
  // Only validate session if authentication middleware is available
  if (typeof (req as any).isAuthenticated === 'function' && (req as any).isAuthenticated() && req.session) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    const TIMEOUT_MS = 30 * 60 * 1000;

    if (now - lastActivity > TIMEOUT_MS) {
      (req as any).logout((err: any) => {
        if (err) console.error('Logout error:', err);
        
        createSecurityEvent(req, {
          userId: (req.user as any)?.id,
          eventType: 'session_timeout',
          severity: 'low',
          details: { lastActivity: new Date(lastActivity) },
        }).catch(console.error);
        
        res.status(401).json({
          error: 'Session expired',
          message: 'Your session has expired. Please log in again.',
        });
      });
      return;
    }

    req.session.lastActivity = now;
  }

  next();
}

export function requireSecurePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  const commonPasswords = [
    'password123',
    'admin123456',
    'qwerty123456',
    '123456789012',
    'welcome12345',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

declare module 'express-session' {
  interface SessionData {
    lastActivity?: number;
  }
}
