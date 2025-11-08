import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { auditLogs, securityEvents, type InsertAuditLog, type InsertSecurityEvent } from '@shared/schema';
import { UAParser } from 'ua-parser-js';

export interface AuditLogData {
  userId?: string;
  actionType: string;
  resourceType?: string;
  resourceId?: string;
  phiAccessed?: boolean;
  details?: Record<string, any>;
}

export interface SecurityEventData {
  userId?: string;
  eventType: string;
  email?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
}

function getDeviceInfo(userAgent: string) {
  const parser = new UAParser(userAgent);
  return {
    browser: parser.getBrowser(),
    os: parser.getOS(),
    device: parser.getDevice(),
  };
}

export async function createAuditLog(
  req: Request,
  data: AuditLogData
): Promise<void> {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                      req.socket.remoteAddress || 
                      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const auditLogData: InsertAuditLog = {
      userId: data.userId,
      actionType: data.actionType,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      ipAddress,
      userAgent,
      deviceInfo: getDeviceInfo(userAgent),
      phiAccessed: data.phiAccessed || false,
      details: data.details,
    };

    await db.insert(auditLogs).values(auditLogData);
  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
  }
}

export async function createSecurityEvent(
  req: Request,
  data: SecurityEventData
): Promise<void> {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                      req.socket.remoteAddress || 
                      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const securityEventData: InsertSecurityEvent = {
      userId: data.userId,
      eventType: data.eventType,
      email: data.email,
      ipAddress,
      userAgent,
      severity: data.severity || 'medium',
      resolved: false,
      details: data.details,
    };

    await db.insert(securityEvents).values(securityEventData);
  } catch (error) {
    console.error('❌ Failed to create security event:', error);
  }
}

export function auditMiddleware(
  actionType: string,
  resourceType?: string,
  phiAccessed: boolean = false
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (data: any) {
      const user = req.user as any;
      
      createAuditLog(req, {
        userId: user?.id,
        actionType,
        resourceType,
        resourceId: req.params.id || req.params.userId,
        phiAccessed,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode,
        },
      }).catch(err => console.error('Audit log error:', err));
      
      return originalJson(data);
    };
    
    next();
  };
}

export const PHI_ROUTES = [
  '/api/user/profile',
  '/api/user/medications',
  '/api/user/prescriptions',
  '/api/user/refills',
  '/api/user/address',
  '/api/admin/users',
  '/api/prescriptions',
  '/api/refills',
];

export function isPHIRoute(path: string): boolean {
  return PHI_ROUTES.some(route => path.startsWith(route));
}

export function autoAuditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
    const phiAccessed = isPHIRoute(req.path);
    const user = req.user as any;
    
    // CRITICAL: Log BOTH authenticated AND unauthenticated PHI access attempts
    // HIPAA regulators care most about unauthorized access attempts
    if (phiAccessed) {
      const actionMap: Record<string, string> = {
        GET: 'view',
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete',
      };
      
      const action = actionMap[req.method] || 'access';
      
      // Capture response after it's sent
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        createAuditLog(req, {
          userId: user?.id || undefined, // May be undefined for unauthorized attempts
          actionType: user ? `${action}_${req.path.replace(/\//g, '_')}` : `unauthorized_${action}_attempt`,
          phiAccessed: true,
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            authenticated: !!user,
            statusCode: res.statusCode,
            success: res.statusCode < 400,
          },
        }).catch(err => console.error('Auto-audit error:', err));
        
        return originalJson(data);
      };
    } else if (user) {
      // Log authenticated non-PHI requests for admin actions
      const actionMap: Record<string, string> = {
        GET: 'view',
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete',
      };
      
      const action = actionMap[req.method] || 'access';
      
      createAuditLog(req, {
        userId: user.id,
        actionType: `${action}_${req.path.replace(/\//g, '_')}`,
        phiAccessed: false,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
        },
      }).catch(err => console.error('Auto-audit error:', err));
    }
  }
  
  next();
}
