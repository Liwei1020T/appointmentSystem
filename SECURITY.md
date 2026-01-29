# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of String Service Platform seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT disclose publicly

Please do not create a public GitHub issue for security vulnerabilities.

### 2. Contact us privately

Send an email to the project maintainers with:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes (optional)

### 3. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity (Critical: 24-72h, High: 1 week, Medium: 2 weeks)

## Security Measures

### Authentication

- NextAuth.js v5 with secure session management
- bcrypt password hashing (cost factor 10)
- Rate limiting on auth endpoints (5 attempts/minute for signup, 3 for OTP)

### Data Protection

- All sensitive data stored in PostgreSQL with Prisma ORM
- Environment variables for secrets (never committed)
- HTTPS enforced in production

### API Security

- Session-based authentication via NextAuth.js
- Role-based access control (user/admin)
- Input validation with Zod schemas
- SQL injection prevention via Prisma parameterized queries

### File Uploads

- File type validation (images only)
- File size limits (5MB max)
- Secure storage in `/public/uploads/`

## Security Checklist for Deployment

- [ ] Use strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Enable HTTPS
- [ ] Set secure database credentials
- [ ] Review environment variable exposure
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Monitor for suspicious activity

## Known Security Considerations

### TNG Payment Callback

The TNG payment callback endpoint requires additional security measures before production use:
- Signature verification
- Idempotency key handling

See `src/app/api/payments/tng/callback/route.ts` for implementation notes.

---

**Last Updated:** 2026-01-27
