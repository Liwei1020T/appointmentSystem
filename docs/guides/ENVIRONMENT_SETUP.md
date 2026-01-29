# Environment Variables Setup Guide

**String Service Platform**
**Last Updated:** 2026-01-27
**Stack:** Next.js 14 + Prisma + PostgreSQL + NextAuth.js

---

## Required Environment Variables

Create a `.env` file in the project root with the following variables:

### Database Configuration (Required)

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/string_db"
```

**Setup Steps:**
1. Start PostgreSQL via Docker: `docker-compose up -d`
2. Or use a managed PostgreSQL service (Railway, Supabase, Neon, etc.)
3. Update the connection string with your credentials

### Authentication (Required)

```bash
# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret-key"
```

**Setup Steps:**
1. Set `NEXTAUTH_URL` to your application URL (localhost for dev, domain for prod)
2. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
3. Copy the generated secret to `NEXTAUTH_SECRET`

### File Upload (Optional)

```bash
# Directory for user uploads (defaults to ./public/uploads)
UPLOAD_DIR="./public/uploads"
```

---

## Complete Environment Variables Reference

### Core Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `NEXTAUTH_URL` | ✅ Yes | - | Application URL |
| `NEXTAUTH_SECRET` | ✅ Yes | - | NextAuth encryption secret |
| `NEXTAUTH_SECRET_ALT` | ❌ No | - | Fallback secret for migration |
| `NODE_ENV` | ❌ No | `development` | Environment mode |

### Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | ❌ No | `String Service` | Application name |
| `NEXT_PUBLIC_APP_URL` | ❌ No | `http://localhost:3000` | Public app URL |
| `UPLOAD_DIR` | ❌ No | `./public/uploads` | Upload directory path |
| `MAX_FILE_SIZE` | ❌ No | `5242880` | Max upload size (5MB) |

### Payment Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_TNG_QR_CODE_URL` | ❌ No | - | TNG QR code image URL |
| `TNG_MERCHANT_ID` | ❌ No | - | TNG merchant ID |
| `TNG_API_KEY` | ❌ No | - | TNG API key |
| `TNG_CALLBACK_SECRET` | ❌ No | - | TNG webhook secret |
| `PAYMENT_TIMEOUT_MINUTES` | ❌ No | `1440` | Payment timeout (24h) |

### Cron & Automation

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CRON_SECRET` | ❌ No | - | Cron job authentication |
| `ORDER_PAYMENT_TIMEOUT_HOURS` | ❌ No | `24` | Order auto-cancel timeout |

### SMS Configuration (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMS_PROVIDER` | ❌ No | - | SMS provider (twilio) |
| `TWILIO_ACCOUNT_SID` | ❌ No | - | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | ❌ No | - | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ❌ No | - | Twilio sender number |

### Push Notifications (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ❌ No | - | Web push public key |
| `VAPID_PRIVATE_KEY` | ❌ No | - | Web push private key |
| `VAPID_SUBJECT` | ❌ No | - | Web push contact email |

### Business Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REFERRAL_REWARD_POINTS` | ❌ No | `50` | Points for referral |
| `LOW_STOCK_THRESHOLD` | ❌ No | `5` | Low stock alert threshold |
| `DEFAULT_TENSION` | ❌ No | `26` | Default string tension |
| `MAX_RACKETS_PER_ORDER` | ❌ No | `5` | Max rackets per order |

---

## Full .env.example

```bash
# ===========================================
# Core Configuration (Required)
# ===========================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/string_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret-key-here"

# ===========================================
# Application Settings
# ===========================================
NEXT_PUBLIC_APP_NAME="String Service"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# ===========================================
# File Upload
# ===========================================
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="5242880"

# ===========================================
# Payment Configuration
# ===========================================
NEXT_PUBLIC_TNG_QR_CODE_URL="/images/tng-qr-code.png"
# TNG_MERCHANT_ID=""
# TNG_API_KEY=""
# TNG_CALLBACK_SECRET=""
PAYMENT_TIMEOUT_MINUTES="1440"

# ===========================================
# Cron & Automation
# ===========================================
CRON_SECRET="your-cron-secret-here"
ORDER_PAYMENT_TIMEOUT_HOURS="24"

# ===========================================
# SMS Configuration (Optional)
# ===========================================
# SMS_PROVIDER="twilio"
# TWILIO_ACCOUNT_SID=""
# TWILIO_AUTH_TOKEN=""
# TWILIO_PHONE_NUMBER=""

# ===========================================
# Push Notifications (Optional)
# ===========================================
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
# VAPID_PRIVATE_KEY=""
# VAPID_SUBJECT="mailto:admin@example.com"

# ===========================================
# Business Configuration
# ===========================================
REFERRAL_REWARD_POINTS="50"
LOW_STOCK_THRESHOLD="5"
DEFAULT_TENSION="26"
MAX_RACKETS_PER_ORDER="5"
```

---

## Environment Configuration by Environment

### Development (.env)

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/string_db"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-change-in-production"

# Optional
NODE_ENV="development"
```

### Production (.env.production)

```bash
# Database (use your production database URL)
DATABASE_URL="postgresql://user:password@your-host:5432/string_db?sslmode=require"

# Auth (use your production domain)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-a-secure-secret-for-production"

# Optional
NODE_ENV="production"
```

---

## Quick Start

```bash
# 1. Copy example environment file
cp .env.example .env

# 2. Edit .env with your values
nano .env  # or use your preferred editor

# 3. Start database
docker-compose up -d

# 4. Push schema to database
npm run db:push

# 5. Seed initial data
npm run db:seed

# 6. Start development server
npm run dev
```

---

## Verification

After configuration, verify everything works:

```bash
# Check database connection
npm run db:studio  # Opens Prisma Studio

# Verify build
npm run build

# Run tests
npm test
```

---

## Production Deployment Checklist

- [ ] PostgreSQL database provisioned
- [ ] `DATABASE_URL` configured with production connection string
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] `NEXTAUTH_SECRET` generated with secure random value
- [ ] SSL/TLS enabled for database connection (`?sslmode=require`)
- [ ] Environment variables set in hosting platform
- [ ] Database schema pushed: `npm run db:push`
- [ ] Initial data seeded (if needed): `npm run db:seed`

---

## Troubleshooting

**Database connection failed:**
- Verify PostgreSQL is running: `docker ps`
- Check connection string format
- Ensure database exists
- Check network/firewall rules

**NextAuth errors:**
- Verify `NEXTAUTH_URL` matches your actual URL
- Ensure `NEXTAUTH_SECRET` is set
- Check for trailing slashes in URL

**Prisma errors:**
- Run `npm run db:generate` to regenerate client
- Run `npm run db:push` to sync schema
- Check DATABASE_URL format

---

## Notes

> This project uses **Prisma ORM** for database access and **NextAuth.js v5** for authentication. It does NOT use Supabase, Twilio, or Firebase - those were from an earlier architecture that has been replaced.

For notification features, the system uses:
- **In-app notifications**: Stored in PostgreSQL `Notification` table
- **Future expansion**: WhatsApp Cloud API integration planned (see `docs/plans/WhatsApp-Integration-Plan.md`)
