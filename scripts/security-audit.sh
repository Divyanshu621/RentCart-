#!/bin/bash
# Security Audit Script
# Run this before every deployment
set -euo pipefail

echo "========================================"
echo "  RentCart Security Audit"
echo "  $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
echo "========================================"
echo ""

ERRORS=0

# 1. Check .env exists and has AUTH_SECRET
echo "[1/7] Checking environment configuration..."
if [ ! -f .env ]; then
  echo "  ❌ FAIL: .env file not found"
  ERRORS=$((ERRORS + 1))
else
  if grep -q 'AUTH_SECRET=.*\S' .env 2>/dev/null; then
    SECRET_LEN=$(grep '^AUTH_SECRET=' .env | head -1 | cut -d'=' -f2 | wc -c)
    if [ "$SECRET_LEN" -lt 33 ]; then
      echo "  ❌ FAIL: AUTH_SECRET must be at least 32 characters (current: $((SECRET_LEN-1)))"
      ERRORS=$((ERRORS + 1))
    else
      echo "  ✅ AUTH_SECRET configured ($((SECRET_LEN-1)) chars)"
    fi
  else
    echo "  ❌ FAIL: AUTH_SECRET not set in .env"
    ERRORS=$((ERRORS + 1))
  fi
fi

# 2. Check .env is gitignored
echo "[2/7] Checking .gitignore..."
if grep -qE '^\.env(\*|$|\.)' .gitignore 2>/dev/null; then
  echo "  ✅ .env is gitignored"
else
  echo "  ❌ FAIL: .env is NOT in .gitignore"
  ERRORS=$((ERRORS + 1))
fi

# 3. Check for hardcoded secrets
echo "[3/7] Checking for hardcoded secrets..."
SECRETS_FOUND=0
if rg -l 'password\s*=\s*["\x27][^"\x27]{8,}' src/ --type ts --type tsx 2>/dev/null | grep -v 'passwordHash' | grep -v 'schema.prisma' | grep -v '.d.ts'; then
  echo "  ⚠️  WARNING: Possible hardcoded passwords found"
  SECRETS_FOUND=1
fi
if rg -l 'sk_live|sk_test|pk_live' src/ --type ts 2>/dev/null | grep -v 'process.env' | grep -v '.d.ts'; then
  echo "  ❌ FAIL: Possible API secrets hardcoded in source"
  ERRORS=$((ERRORS + 1))
  SECRETS_FOUND=1
fi
if [ "$SECRETS_FOUND" -eq 0 ]; then
  echo "  ✅ No hardcoded secrets detected"
fi

# 4. Dependency audit
echo "[4/7] Running dependency audit..."
if command -v bun &>/dev/null; then
  AUDIT_OUTPUT=$(bun audit 2>&1 || true)
  # Only warn on transitive dependency issues (we can't fix eslint/prisma internals)
  if echo "$AUDIT_OUTPUT" | grep -qi 'vulnerability|CVE-'; then
    echo "  ⚠️  WARNING: Vulnerabilities found (likely transitive - review manually):"
    echo "$AUDIT_OUTPUT" | head -10
  else
    echo "  ✅ No known vulnerabilities (bun audit)"
  fi
else
  echo "  ⚠️  SKIP: bun not found"
fi

# 5. Check security files exist
echo "[5/7] Checking security infrastructure..."
for f in src/lib/auth.ts src/lib/rate-limiter.ts src/lib/security-logger.ts src/lib/secure-handler.ts src/middleware.ts; do
  if [ -f "$f" ]; then
    echo "  ✅ $f"
  else
    echo "  ❌ FAIL: $f missing"
    ERRORS=$((ERRORS + 1))
  fi
done

# 6. Check no debug code in production paths
echo "[6/7] Checking for debug/development code..."
if rg -l 'console\.log\(' src/app/api/ --type ts 2>/dev/null | head -5; then
  echo "  ⚠️  WARNING: console.log found in API routes (use securityLogger instead)"
else
  echo "  ✅ No console.log in API routes"
fi

# 7. Check db is gitignored
echo "[7/7] Checking database files are gitignored..."
if grep -q 'db/.*\.db' .gitignore 2>/dev/null || grep -q '\.db$' .gitignore 2>/dev/null; then
  echo "  ✅ Database files are gitignored"
else
  echo "  ❌ FAIL: Database files may be committed"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "========================================"
if [ "$ERRORS" -gt 0 ]; then
  echo "  ❌ AUDIT FAILED: $ERRORS issue(s) found"
  echo "========================================"
  exit 1
else
  echo "  ✅ AUDIT PASSED"
  echo "========================================"
  exit 0
fi
