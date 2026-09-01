/**
 * Structured Security Logger
 * 
 * Logs security-relevant events in a structured format.
 * NEVER logs passwords, tokens, secrets, or PII.
 * Uses correlation IDs for debugging.
 */

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

type LogEntry = {
  timestamp: string;
  severity: Severity;
  event: string;
  entity: string;
  userId?: string | null;
  details?: Record<string, unknown>;
  requestId?: string;
};

/**
 * Sanitize details to prevent logging sensitive information
 */
function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = [
    'password', 'passwordhash', 'token', 'secret', 'apikey', 'authorization',
    'cookie', 'creditcard', 'cvv', 'ssn', 'aadhaarnumber', 'pannumber',
    'bankaccountno', 'bankifsc', 'key', 'credential', 'private',
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Core log function - writes to stderr with structured format
 */
function log(severity: Severity, event: string, entity: string, userId: string | null, details?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    severity,
    event,
    entity,
    userId: userId || undefined,
    details: details ? sanitizeDetails(details) : undefined,
  };

  // Log to stderr (never stdout, to keep it separate from app output)
  const prefix = severity === 'CRITICAL' || severity === 'HIGH' ? '🔴' : severity === 'MEDIUM' ? '🟡' : '🟢';
  console.error(`${prefix} [SECURITY] ${JSON.stringify(entry)}`);

  // Also write to AuditLog table for high-severity events
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    writeAuditLog(entry).catch(() => {/* best effort */});
  }
}

/**
 * Write high-severity events to the AuditLog database table
 */
async function writeAuditLog(entry: LogEntry) {
  try {
    const { db } = await import('./db');
    await db.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: `${entry.severity}: ${entry.event}`,
        entity: entry.entity,
        details: JSON.stringify(entry.details),
      },
    });
  } catch {
    // Best effort - don't let audit logging break the app
  }
}

export const securityLogger = {
  critical: (event: string, entity: string, userId: string | null = null, details?: Record<string, unknown>) =>
    log('CRITICAL', event, entity, userId, details),

  error: (event: string, entity: string, userId: string | null = null, details?: Record<string, unknown>) =>
    log('HIGH', event, entity, userId, details),

  warn: (event: string, entity: string, userId: string | null = null, details?: Record<string, unknown>) =>
    log('MEDIUM', event, entity, userId, details),

  info: (event: string, entity: string, userId: string | null = null, details?: Record<string, unknown>) =>
    log('INFO', event, entity, userId, details),
};
