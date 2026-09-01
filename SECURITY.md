# Security Architecture Document

## Overview

This application implements a defense-in-depth security architecture. Security is enforced at multiple layers: network, middleware, API, business logic, and database.

---

## 1. Authentication Architecture

### Session Management
- **JWT Library**: Uses `jose` (RFC 7519 compliant) for token signing and verification
- **Signing Algorithm**: HS256 (HMAC-SHA256)
- **Secret**: Loaded from `AUTH_SECRET` environment variable (minimum 32 characters)
- **Session Duration**: 7 days
- **Token Storage**: HttpOnly cookies (primary) + Bearer header (API access)
- **Session Persistence**: Sessions stored in database (Session table) with token hashes
- **Session Invalidation**: Server-side via database — tokens can be revoked immediately

### Password Security
- **Hashing**: bcrypt with 12 salt rounds (bcryptjs library)
- **Policy**: Minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
- **Storage**: Only password hashes stored; plaintext passwords are never logged or stored
- **Google OAuth Users**: Random 128+ character passwords generated and hashed

### Brute-Force Protection
- **Rate Limiting**: 5 login attempts per 15 minutes (per email)
- **IP Rate Limiting**: 5 attempts per 15 minutes (per IP)
- **Account Lockout**: Automatic after 5 failed attempts with retry-after header
- **Tracking**: All login attempts recorded in LoginAttempt table

### Cookie Security
- `httpOnly: true` — JavaScript cannot access session tokens
- `sameSite: 'lax'` — CSRF mitigation
- `secure: true` in production — Only sent over HTTPS
- `path: '/'` with explicit domain in production

---

## 2. Authorization Architecture

### Role-Based Access Control (RBAC)
- **Roles**: CUSTOMER, OWNER, ADMIN, SUPER_ADMIN
- **Enforcement**: Roles are ALWAYS fetched from the database on each request — never from JWT claims or client input
- **Admin Routes**: Separate `/api/admin/*` paths with admin-only middleware

### Resource Ownership (IDOR Prevention)
- Every protected endpoint verifies: "Does this authenticated user own this resource?"
- Examples:
  - `PATCH /api/products/:id` — Verifies `product.ownerId === session.userId`
  - `POST /api/rentals/:id/cancel` — Verifies `rental.customerId === session.userId`
  - `PATCH /api/notifications` — Scoped query with `userId: session.userId`
  - `GET /api/kyc/status` — Verifies `kyc.userId === session.userId`

### API Authorization Flow
```
1. Extract token from cookie/header
2. Verify JWT signature with AUTH_SECRET
3. Check session exists in database (not revoked/expired)
4. Fetch user from database to get current role
5. Check role permissions for the endpoint
6. Check resource ownership if applicable
7. Execute business logic
```

---

## 3. Data Protection

### Sensitive Data
- Aadhaar numbers, PAN numbers, bank details stored in SellerKyc table
- KYC document uploads stored in private directory (gitignored)
- Database file itself is gitignored

### Data at Rest
- SQLite database with file-level access controls
- Database query logging disabled in production

### Data in Transit
- All API responses include `Strict-Transport-Security` header in production
- HttpOnly cookies prevent token access via JavaScript

---

## 4. Secrets Management

### Environment Variables
All secrets loaded from environment:
- `AUTH_SECRET` — JWT signing key (32+ chars, crypto-random)
- `GOOGLE_CLIENT_SECRET` — OAuth secret (never exposed to client)
- `RAZORPAY_KEY_SECRET` — Payment gateway secret
- `DATABASE_URL` — Database connection string

### Protections
- `.env*` in `.gitignore` (except `.env.example`)
- `.env.example` contains only placeholder comments
- No secrets in frontend code
- No secrets in version control

---

## 5. API Security

### Input Validation
- **Library**: Zod v4 for all request bodies
- **Coverage**: Every POST/PUT/PATCH endpoint has Zod schemas
- **Validation**: Type checking, string length limits, numeric ranges, enum whitelists
- **Strict Mode**: Most schemas use `.strict()` to reject unknown fields

### Rate Limiting
| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Login/Register | 5 req | 15 min |
| Registration | 3 req | 1 hour |
| General API | 60 req | 1 min |
| Payment | 10 req | 1 min |
| File Upload | 5 req | 1 min |
| Admin | 120 req | 1 min |
| Search | 30 req | 1 min |
| Coupon | 20 req | 1 min |

### Error Handling
- **Production**: Generic "Something went wrong" messages
- **Development**: Detailed error messages for debugging
- **Prisma Errors**: Mapped to appropriate HTTP status codes (404, 409, 400)
- **Stack Traces**: NEVER sent to clients
- **Database Errors**: NEVER exposed

---

## 6. Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS enforcement (prod) |
| `Content-Security-Policy` | See middleware.ts | XSS prevention |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing prevention |
| `X-Frame-Options` | `DENY` | Clickjacking prevention |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage prevention |
| `Permissions-Policy` | Restricted | Browser feature restriction |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection |
| `Cache-Control` | `no-store` | API response caching prevention |

---

## 7. CSRF Protection

### Implementation
- `SameSite: 'lax'` on all cookies
- Origin/Referer header validation on all state-changing API requests in production
- Content Security Policy with `form-action 'self'`
- `X-Frame-Options: DENY` prevents clickjacking

---

## 8. CORS Configuration

- Allowed origins configured via `ALLOWED_ORIGINS` environment variable
- Default: same origin only
- Middleware validates Origin header against allowed list
- Credentials supported for same-origin requests

---

## 9. File Upload Security

### Validations
- **Size Limits**: Product 5MB, Profile 2MB, KYC 10MB
- **MIME Types**: Whitelisted per category (JPEG, PNG, WebP, GIF, PDF)
- **Magic Byte Verification**: File content checked against claimed MIME type
- **Filename Sanitization**: Server-generated filenames (UUID-based), never user-provided
- **Path Traversal Prevention**: `..`, `/`, `\` rejected in filenames
- **Rate Limiting**: 5 uploads per minute per user
- **Authentication Required**: All uploads require valid session

### Storage
- Product images: `public/uploads/products/`
- Profile images: `public/uploads/profiles/`
- KYC documents: `public/uploads/kyc/` (gitignored)

---

## 10. Payment Security

### Razorpay Integration
- HMAC-SHA256 signature verification on payment completion
- Server-side verification — client cannot claim payment success
- Webhook endpoint verifies provider signatures
- Idempotency check prevents duplicate payment processing
- Transaction IDs include crypto-random components

### Simulated Payments
- **Completely disabled in production** — returns 403
- Only available in development mode
- All simulated transaction IDs prefixed with `DEV-`

### Security Flow
```
Client → Razorpay Checkout → Payment Provider
                                    ↓
                              Webhook (signature verified)
                                    ↓
                              Backend Verification
                                    ↓
                              Update Order
```

---

## 11. Logging & Audit Trail

### Security Logger (`src/lib/security-logger.ts`)
- Structured JSON logging to stderr
- Severity levels: CRITICAL, HIGH, MEDIUM, LOW, INFO
- PII auto-redaction (passwords, tokens, secrets, Aadhaar, PAN, bank details)
- High-severity events automatically written to AuditLog database table

### Audited Events
- Login success/failure
- Registration
- Payment processing
- Admin actions
- File uploads
- Session creation/destruction
- Rate limit violations
- IDOR attempts
- CSRF violations

### What is NEVER Logged
- Passwords or password hashes
- Session tokens
- API secrets
- KYC document content
- Full bank account numbers
- CVV or payment card details

---

## 12. Google OAuth Security

### Real OAuth Flow (when configured)
1. Server generates authorization URL with state parameter (nonce + timestamp)
2. User authenticates with Google
3. Google redirects with authorization code
4. Server exchanges code for tokens (using CLIENT_SECRET, server-to-server)
5. Server fetches user info from Google
6. Server verifies `verified_email: true`
7. Server creates/finds user account
8. Server creates session with httpOnly cookie

### Demo Mode
- **REMOVED** — The POST demo endpoint no longer creates sessions without verification
- Returns 503 "Google OAuth not configured" when credentials are missing
- Prevents impersonation of any email address

### Security Notes
- Google Client ID is non-secret by design (it identifies the app, not authenticates it)
- Google Client Secret is NEVER exposed to the client
- `google_auth_success` cookie changed from `httpOnly: false` to `httpOnly: true`

---

## 13. Production Deployment Requirements

### Required Environment Variables
```env
AUTH_SECRET=<32+ character random string>
DATABASE_URL=<your database URL>
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
RAZORPAY_KEY_ID=<your key>
RAZORPAY_KEY_SECRET=<your secret>
```

### Checklist Before Going Live
- [ ] Set strong `AUTH_SECRET` (32+ chars, crypto-random)
- [ ] Configure `ALLOWED_ORIGINS` to production domain only
- [ ] Configure Razorpay with real keys
- [ ] Disable `ignoreBuildErrors` (already done)
- [ ] Enable `reactStrictMode` (already done)
- [ ] Set up HTTPS (TLS termination at load balancer/reverse proxy)
- [ ] Configure `COOKIE_DOMAIN` for production
- [ ] Set up database backups
- [ ] Remove/rotate all seed user passwords
- [ ] Enable database encryption at rest
- [ ] Set up log aggregation and monitoring
- [ ] Configure WAF (Web Application Firewall)
- [ ] Run `npm audit` / `bun audit` and fix vulnerabilities

---

## 14. Security Testing

### OWASP Top 10 Coverage
| Risk | Status | Mitigation |
|------|--------|------------|
| Broken Access Control | ✅ Fixed | RBAC + ownership checks on all endpoints |
| Cryptographic Failures | ✅ Fixed | bcrypt 12 rounds, env-based JWT secret |
| Injection | ✅ Fixed | Zod validation + Prisma parameterized queries |
| Insecure Design | ✅ Fixed | Security-first architecture |
| Security Misconfiguration | ✅ Fixed | Security headers, no debug in prod |
| Vulnerable Components | ⚠️ Monitor | Run `bun audit` regularly |
| Auth Failures | ✅ Fixed | Rate limiting, brute-force protection |
| Data Integrity Failures | ✅ Fixed | Payment signature verification |
| Logging Failures | ✅ Fixed | Structured security logging + audit trail |
| SSRF | ✅ Fixed | Path traversal prevention, file type validation |

---

## 15. Incident Response

### Detection
- Security logger writes to stderr with structured JSON
- High/Critical events written to AuditLog database table
- Rate limit violations logged

### Response Steps
1. Check `AuditLog` table for the affected user/entity
2. Check stderr logs for `[SECURITY]` entries
3. If account compromise suspected: use `destroyAllUserSessions(userId)` to revoke all sessions
4. If credential leak suspected: rotate `AUTH_SECRET` (invalidates ALL sessions)
5. If payment fraud suspected: check `Payment` table for anomalous transactions

### Session Revocation
All sessions for a user can be revoked server-side:
```typescript
import { destroyAllUserSessions } from '@/lib/auth';
await destroyAllUserSessions(userId);
```

---

## 16. Backup & Recovery

### Database Backups
- SQLite database file should be backed up regularly
- Backup files should be encrypted
- Backup retention: 30 days minimum
- Test restoration periodically

### Recovery
1. Stop the application
2. Restore database from backup
3. Verify data integrity
4. Rotate `AUTH_SECRET` (invalidates all existing sessions)
5. Restart the application

---

## 17. Password Reset Flow

### Request Reset
- POST `/api/auth/password-reset` with `{ email }`
- Rate limited: 3 requests per hour per IP
- Anti-enumeration: Always returns 200 with same message regardless of email existence
- Token: 64-character hex string, expires in 1 hour
- In development: token returned in response for testing
- In production: token sent via email (implementation pending email service)

### Confirm Reset
- POST `/api/auth/password-reset/confirm` with `{ token, newPassword }`
- Validates token exists, unused, and not expired
- Password policy: min 8 chars, 1 uppercase, 1 number, 1 special character
- On success: destroys ALL user sessions (force re-login)
- Token marked as used (single-use)

### Security Properties
- Tokens are single-use and time-limited
- Password change invalidates all sessions
- No email enumeration possible
- Brute-force protection via rate limiting

---

## 18. Session Rotation

### Mechanism
- POST `/api/auth/rotate-session` creates a new session and destroys the old one
- Old token is verified and destroyed atomically
- New HttpOnly cookie is set with the new token

### Use Cases
- After privilege elevation (e.g., user becomes OWNER)
- After security-sensitive actions
- Periodic rotation for long-lived sessions
- After password change (automatic via `destroyAllUserSessions`)

---

## 19. Payment Webhook Security

### Razorpay Webhook
- Endpoint: POST `/api/payments/webhook`
- Signature verification: HMAC-SHA256 with `RAZORPAY_KEY_SECRET`
- Constant-time comparison via `crypto.timingSafeEqual` (prevents timing attacks)
- Raw body verification (prevents body parsing attacks)
- Always returns 200 (Razorpay retries on non-200)
- Idempotency: checks `transactionId` before processing
- Events handled: `payment.captured`, `payment.failed`

### Webhook Security Properties
- No client-side access to webhook secret
- Signature verified before any processing
- Failed signatures logged as CRITICAL security events
- Idempotent processing prevents double-crediting

---

## 20. Multi-Factor Authentication (MFA) Architecture

### Schema Support
- `mfaEnabled` boolean field on User model
- `mfaSecret` field for TOTP secret storage
- Designed for TOTP-based MFA (e.g., Google Authenticator)

### Implementation Status
- ✅ Database schema ready
- ⬜ MFA setup endpoint (planned)
- ⬜ MFA verification on login (planned)
- ⬜ Recovery codes (planned)

### Email Verification
- `emailVerified` boolean field on User model
- Schema ready for verification token flow
- Planned: verification email on registration

---

## 21. Security Audit Script

### Automated Checks
- Run: `bash scripts/security-audit.sh`
- Checks: AUTH_SECRET strength, .gitignore coverage, hardcoded secrets, dependency vulnerabilities, security file existence, debug code detection
- Returns exit code 1 on failures (suitable for CI/CD)

### CI/CD Integration
```yaml
# Example GitHub Actions step
- name: Security Audit
  run: bash scripts/security-audit.sh
```

---

*Last updated: Generated automatically during security implementation*
*Framework: Next.js 16 with App Router*
*Runtime: Node.js / Bun*
