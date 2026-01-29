# Troubleshooting Guide

**String Service Platform — Common Issues and Solutions**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Quick Diagnosis

```bash
# Check if services are running
docker-compose ps

# Check database connection
npm run db:studio

# Check for TypeScript errors
npm run type-check

# Check for lint errors
npm run lint

# Run tests
npm run test:run
```

---

## Installation Issues

### 1. npm install fails

**Symptoms:**
- Error during `npm install`
- Package resolution errors

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps
```

### 2. Prisma generate fails

**Symptoms:**
- `@prisma/client` not found
- Type errors related to Prisma

**Solutions:**

```bash
# Regenerate Prisma client
npx prisma generate

# If schema changed, push to database
npm run db:push
```

---

## Database Issues

### 1. Cannot connect to database

**Symptoms:**
- `Error: Can't reach database server`
- `ECONNREFUSED`

**Solutions:**

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

### 2. Database schema out of sync

**Symptoms:**
- Column not found errors
- Missing table errors

**Solutions:**

```bash
# Push schema to database
npm run db:push

# If that fails, reset database (WARNING: destroys data)
npx prisma migrate reset

# Reseed data
npm run db:seed
```

### 3. Prisma Studio won't open

**Symptoms:**
- Prisma Studio crashes or doesn't load

**Solutions:**

```bash
# Run with explicit port
npx prisma studio --port 5555

# Check if port is in use
lsof -i :5555
```

---

## Authentication Issues

### 1. Cannot log in

**Symptoms:**
- Login fails with valid credentials
- Session not persisting

**Solutions:**

1. Check `NEXTAUTH_SECRET` is set in `.env`:
   ```bash
   grep NEXTAUTH_SECRET .env
   ```

2. Regenerate secret if needed:
   ```bash
   openssl rand -base64 32
   ```

3. Check `NEXTAUTH_URL` matches your URL:
   ```bash
   grep NEXTAUTH_URL .env
   ```

4. Clear browser cookies and retry

### 2. Session expires immediately

**Symptoms:**
- Logged out after refresh
- Session not saved

**Solutions:**

1. Check `NEXTAUTH_URL` includes protocol:
   ```
   NEXTAUTH_URL=http://localhost:3000  # Not just localhost:3000
   ```

2. Check for cookie issues in browser dev tools

### 3. Admin access denied

**Symptoms:**
- Cannot access `/admin`
- "Forbidden" error

**Solutions:**

```sql
-- Verify user role in database
SELECT email, role FROM "User" WHERE email = 'your@email.com';

-- Promote to admin
UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Build Issues

### 1. Build fails with TypeScript errors

**Symptoms:**
- `npm run build` fails
- Type errors during build

**Solutions:**

```bash
# Check for type errors
npm run type-check

# If errors are in dependencies, try:
npm run build -- --no-lint

# Check for missing types
npm install --save-dev @types/node @types/react
```

### 2. Out of memory during build

**Symptoms:**
- Build crashes
- `JavaScript heap out of memory`

**Solutions:**

```bash
# Increase Node.js memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### 3. Build succeeds but app crashes

**Symptoms:**
- Build completes
- Runtime errors in production

**Solutions:**

1. Check environment variables are set in production
2. Check database is accessible
3. Review server logs for errors

---

## Development Server Issues

### 1. Port already in use

**Symptoms:**
- `Error: listen EADDRINUSE`
- Cannot start dev server

**Solutions:**

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

### 2. Hot reload not working

**Symptoms:**
- Changes not reflected
- Need to restart server

**Solutions:**

```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### 3. API routes returning 500

**Symptoms:**
- API calls fail
- 500 Internal Server Error

**Solutions:**

1. Check server console for errors
2. Verify database connection
3. Check environment variables
4. Review API route code for issues

---

## Payment Issues

### 1. TNG QR code not displaying

**Symptoms:**
- QR code placeholder shown
- Image not loading

**Solutions:**

1. Check file exists: `public/images/tng-qr-code.png`
2. Verify file is valid PNG image
3. Check browser console for 404 errors

### 2. Payment proof upload fails

**Symptoms:**
- Upload button doesn't work
- Error when submitting

**Solutions:**

1. Check file size (max 5MB)
2. Check file type (images only)
3. Verify upload directory exists: `public/uploads/`
4. Check directory permissions

---

## Common Error Messages

### `NEXT_PUBLIC_* not defined`

**Cause:** Environment variable not exposed to client

**Solution:**
- Add to `.env` with `NEXT_PUBLIC_` prefix
- Restart dev server

### `PrismaClientInitializationError`

**Cause:** Database connection issue

**Solution:**
- Check DATABASE_URL
- Verify PostgreSQL is running
- Check network connectivity

### `TypeError: Cannot read property of undefined`

**Cause:** Data not loaded or null

**Solution:**
- Add null checks
- Verify data exists
- Check API response

### `ENOENT: no such file or directory`

**Cause:** File or directory doesn't exist

**Solution:**
- Create missing directory
- Check file paths
- Verify working directory

---

## Performance Issues

### 1. Slow API responses

**Solutions:**

1. Add database indexes
2. Use Prisma `select` to limit fields
3. Implement pagination
4. Check for N+1 query issues

### 2. Slow page loads

**Solutions:**

1. Use Next.js Image optimization
2. Implement lazy loading
3. Check bundle size
4. Use static generation where possible

---

## Getting Help

If these solutions don't work:

1. Check existing issues in the repository
2. Review recent changelogs in `docs/changelogs/`
3. Check `CLAUDE.md` for development guidelines
4. Create a detailed bug report with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Relevant logs

---

**End of Troubleshooting Guide**
