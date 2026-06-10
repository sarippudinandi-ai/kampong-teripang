# 🔒 SECURITY IMPLEMENTATION GUIDE

## ✅ Security Features Implemented

### 1. **Admin Authentication**
- ✅ Bcrypt password hashing (10 rounds)
- ✅ HttpOnly cookies untuk session
- ✅ Secure session token generation
- ✅ Rate limiting pada login (5 attempts/minute)
- ✅ Password tidak lagi hardcoded di source code

**Location**: 
- `app/api/admin/verify/route.ts` - Verification endpoint
- `app/admin/page.tsx` - Admin login page
- `.env.local` - Password hash storage (NEVER commit to Git!)

**Usage**:
```bash
# Generate new password hash
node scripts/generate-hash.js "your-new-password"

# Copy output to .env.local
ADMIN_PASSWORD_HASH=$2b$10$...
```

---

### 2. **Input Validation & Sanitization**
- ✅ Zod schema validation untuk semua form inputs
- ✅ XSS protection via string sanitization
- ✅ Type-safe validation dengan TypeScript
- ✅ Custom error messages yang user-friendly

**Protected Endpoints**:
- `/api/booking` - Villa & tour bookings
- `/api/checkout` - Product purchases
- `/api/admin/verify` - Admin login

**Validation Rules**:
```typescript
// Nama: 3-100 chars, only letters & spaces
// Email: Valid email format
// WhatsApp: 10-15 digits, numbers only
// Check-in: Not in the past
// Check-out: After check-in
// Tamu: 1-20 people
// Catatan: Max 500 chars
```

---

### 3. **Rate Limiting**
- ✅ LRU Cache based rate limiter
- ✅ Per-IP tracking
- ✅ Automatic cleanup after TTL expires

**Limits**:
- Admin login: 5 attempts/minute per IP
- Booking: 5 requests/minute per IP
- Checkout: 5 requests/minute per IP

**Response on Rate Limit**:
```json
{
  "error": "Terlalu banyak permintaan. Silakan coba lagi dalam 1 menit.",
  "remaining": 0
}
```

---

### 4. **Security Headers**
- ✅ HSTS (Strict-Transport-Security)
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ CORS configuration for API routes

**Configuration**: `next.config.mjs`

---

### 5. **Middleware Protection**
- ✅ Route protection for /admin
- ✅ Cookie-based session verification
- ✅ Automatic request filtering

**Configuration**: `middleware.ts`

---

## 🚨 CRITICAL: Supabase RLS Setup

**⚠️ IMPORTANT**: Database masih UNPROTECTED! Segera enable Row Level Security:

### Step 1: Enable RLS
```sql
-- Jalankan di Supabase SQL Editor
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Policies
```sql
-- Public bisa READ availability
CREATE POLICY "Public can read availability"
ON availability FOR SELECT
USING (true);

-- Hanya authenticated users bisa INSERT/UPDATE availability
CREATE POLICY "Authenticated users can modify availability"
ON availability FOR ALL
USING (auth.role() = 'authenticated');

-- Hanya authenticated users bisa access transactions
CREATE POLICY "Authenticated users can access transactions"
ON transactions FOR ALL
USING (auth.role() = 'authenticated');
```

### Step 3: Create Admin User (Supabase Dashboard)
1. Go to Authentication → Users
2. Create new user dengan email admin Anda
3. Copy UID untuk future reference

---

## 🔐 Environment Variables Security

### ✅ Safe for Public (NEXT_PUBLIC_*)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (safe with RLS enabled)
NEXT_PUBLIC_BASE_URL=https://melamumbintanindonesia.com
```

### ❌ NEVER Expose (Server-only)
```env
ADMIN_PASSWORD_HASH=$2b$10$...
XENDIT_SECRET_KEY=xnd_...
XENDIT_WEBHOOK_TOKEN=...
DATABASE_URL=postgresql://... (if using direct connection)
```

### 🛡️ Best Practices
- ✅ Add `.env.local` to `.gitignore` (already done)
- ✅ Never commit `.env.local` to Git
- ✅ Use different passwords for dev/staging/production
- ✅ Rotate passwords every 90 days
- ✅ Store production secrets in Vercel Environment Variables

---

## 🔄 Password Rotation

When changing admin password:

1. Generate new hash:
```bash
node scripts/generate-hash.js "new-password-here"
```

2. Update `.env.local`:
```env
ADMIN_PASSWORD_HASH=$2b$10$NEW_HASH_HERE
```

3. Restart dev server:
```bash
npm run dev
```

4. For production, update Vercel env vars:
```bash
vercel env add ADMIN_PASSWORD_HASH
```

---

## 🚀 Pre-Deployment Checklist

### Security
- [ ] Enable RLS di Supabase untuk semua tables
- [ ] Create RLS policies (see above)
- [ ] Change default admin password
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Remove all `console.log` yang expose sensitive data
- [ ] Test rate limiting works
- [ ] Test admin login with wrong password (should fail)
- [ ] Test XSS protection (try `<script>alert('xss')</script>` in forms)

### Configuration
- [ ] Update `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Configure CORS allowed origins di `next.config.mjs`
- [ ] Set all Vercel environment variables
- [ ] Enable Vercel Analytics
- [ ] Setup error monitoring (Sentry recommended)

### Testing
- [ ] Test all booking flows
- [ ] Test admin panel operations
- [ ] Test rate limiting triggers correctly
- [ ] Verify security headers in production
- [ ] Run Lighthouse security audit
- [ ] Test on different devices & browsers

---

## 📊 Security Monitoring

### Recommended Tools
1. **Sentry** - Error & performance monitoring
2. **Vercel Analytics** - Traffic & performance
3. **Supabase Dashboard** - Database monitoring
4. **UptimeRobot** - Uptime monitoring (free tier)

### What to Monitor
- Failed login attempts (potential brute force)
- Rate limit hits (potential DDoS)
- Database connection errors
- API response times
- Error rates by endpoint

---

## 🆘 Security Incident Response

### If Credentials Compromised:

1. **Immediate Actions**:
   - Rotate all passwords immediately
   - Revoke Supabase API keys (regenerate)
   - Check database for unauthorized changes
   - Review Supabase logs for suspicious activity

2. **Investigation**:
   - Check Git history for accidentally committed secrets
   - Review Vercel deployment logs
   - Analyze access logs for unusual patterns

3. **Prevention**:
   - Scan repo with `git-secrets` or `trufflehog`
   - Enable 2FA on Supabase & Vercel accounts
   - Implement IP whitelisting if possible
   - Add audit logging for sensitive operations

---

## 🔗 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Security](https://vercel.com/docs/security)

---

## 📝 Changelog

### 2026-06-11 - Initial Security Implementation
- ✅ Implemented bcrypt password hashing
- ✅ Added rate limiting to all API routes
- ✅ Implemented Zod input validation
- ✅ Added XSS protection via sanitization
- ✅ Configured security headers
- ✅ Created middleware for route protection
- ✅ Removed hardcoded passwords from source code

### Next Steps
- [ ] Enable Supabase RLS
- [ ] Implement error monitoring
- [ ] Add API request logging
- [ ] Setup automated security scans

---

**Last Updated**: June 11, 2026  
**Maintained By**: Development Team  
**Security Contact**: admin@melamumbintanindonesia.com
