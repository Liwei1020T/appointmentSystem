# 🚀 Deployment Checklist

**String Service Platform**
**Version:** 2.0
**Last Updated:** 2026-01-27
**Stack:** Next.js 14 + Prisma + PostgreSQL + NextAuth.js

---

> ⚠️ **Architecture Note:** This project uses **Prisma ORM + PostgreSQL + NextAuth.js** (NOT Supabase). All database operations go through Prisma, and authentication is handled by NextAuth.js v5.

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup ✅

- [ ] PostgreSQL 15 instance running (Docker or managed service)
- [ ] Create database and user with appropriate permissions
- [ ] Run Prisma schema push: `npm run db:push`
- [ ] Run database seed: `npm run db:seed`
- [ ] Verify all 13 tables created correctly

```bash
# Initialize database
npm run db:push
npm run db:seed

# Verify with Prisma Studio
npm run db:studio
```

---

### 2. Environment Variables 🔐

- [ ] Create `.env` file with all required variables:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@host:5432/string_db"

# NextAuth (Required)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# App Configuration
UPLOAD_DIR="./public/uploads"
```

- [ ] Generate secure NEXTAUTH_SECRET:
  ```bash
  openssl rand -base64 32
  ```

- [ ] For production, set environment variables in hosting platform (Vercel/Railway/etc.)

---

### 3. TNG QR Code Setup 📱

- [ ] Generate real TNG QR code from TNG eWallet app
- [ ] Save as high-quality PNG (recommended: 800x800px)
- [ ] Place file at: `public/images/tng-qr-code.png`

**File Location:**
```
public/
  images/
    tng-qr-code.png  ← REQUIRED (your actual QR code)
```

---

### 4. Build & Test 🧪

- [ ] Run production build: `npm run build`
- [ ] Fix any TypeScript errors: `npm run type-check`
- [ ] Fix any ESLint warnings: `npm run lint`
- [ ] Run test suite: `npm run test:run`
- [ ] Test on mobile devices (responsive design)

```bash
npm run build
npm run start
```

---

### 5. User Flow Testing 👤

**Customer Journey:**

- [ ] Create test user account at `/signup`
- [ ] Login with credentials
- [ ] Create test order at `/booking`
- [ ] Navigate to payment section
- [ ] See TNG QR code displayed correctly
- [ ] Upload payment receipt
- [ ] Verify payment status shows "pending"

**Admin Journey:**

- [ ] Promote user to admin:
  ```sql
  UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com';
  ```
- [ ] Login to admin dashboard at `/admin`
- [ ] Navigate to pending payments
- [ ] View uploaded receipt
- [ ] Approve/reject payment
- [ ] Verify order status updates correctly

---

### 6. Database Verification 🗃️

After completing test transactions:

```sql
-- Check user records
SELECT id, email, role, "createdAt" FROM "User" LIMIT 10;

-- Check order records
SELECT id, status, "totalAmount", "createdAt" FROM "Order" ORDER BY "createdAt" DESC LIMIT 10;

-- Check payment records
SELECT id, "orderId", amount, status, "createdAt" FROM "Payment" ORDER BY "createdAt" DESC LIMIT 10;
```

---

### 7. Security Audit 🔒

- [ ] All API routes check authentication via `requireAuth()`
- [ ] Admin routes verify `role === 'admin'`
- [ ] File uploads restricted to images only
- [ ] File size limits enforced (5MB max)
- [ ] Passwords hashed with bcrypt
- [ ] HTTPS enabled in production
- [ ] Environment variables not exposed to client

---

### 8. Performance Check ⚡

- [ ] Images optimized with Sharp
- [ ] Database queries use proper indexes
- [ ] API responses cached where appropriate
- [ ] Static assets served efficiently
- [ ] Rate limiting enabled for auth routes

---

## 🎯 Go-Live Checklist

### Final Steps Before Launch:

1. **Backup Database**
   ```bash
   pg_dump -h your-db-host -U postgres -d string_db > backup-$(date +%Y%m%d).sql
   ```

2. **Monitor Setup**
   - [ ] Error tracking configured (Sentry recommended)
   - [ ] Health check endpoint working: `/api/health`
   - [ ] Log aggregation set up

3. **DNS & SSL**
   - [ ] Domain configured
   - [ ] SSL certificate active
   - [ ] NEXTAUTH_URL matches production domain

---

## 📊 Post-Deployment Monitoring

### Week 1:

- [ ] Monitor error logs daily
- [ ] Track payment success rate
- [ ] Check admin verification time
- [ ] Collect user feedback
- [ ] Verify all notifications working

### Week 2-4:

- [ ] Analyze payment completion time
- [ ] Optimize slow queries
- [ ] Update documentation with learnings
- [ ] Address user feedback

---

## 🆘 Troubleshooting

### Common Issues:

**Database Connection Fails:**
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Verify network/firewall rules

**Authentication Issues:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches actual URL
- Clear browser cookies and retry

**QR Code Not Displaying:**
- Check file exists at `public/images/tng-qr-code.png`
- Verify file permissions
- Clear browser cache

**Build Fails:**
- Run `npm run type-check` for TypeScript errors
- Check for missing environment variables
- Verify all dependencies installed

---

## ✅ Sign-Off

- [ ] Development team tested
- [ ] All core flows working
- [ ] Security review passed
- [ ] Documentation complete
- [ ] Stakeholders notified

**Deployed By:** _______________
**Date:** _______________
**Version:** _______________

---

**🎉 Ready for Production!**
