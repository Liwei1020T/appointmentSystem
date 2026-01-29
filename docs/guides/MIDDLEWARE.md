# Middleware Documentation

**String Service Platform — Route Protection & Security**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The middleware (`src/middleware.ts`) provides route protection, authentication verification, and security headers for all incoming requests.

---

## Route Protection Patterns

### Protected Routes (Require Authentication)

```typescript
const protectedRoutes = [
  '/profile',
  '/orders',
  '/booking',
  '/packages',
  '/vouchers',
  '/points',
  '/reviews',
  '/referrals',
  '/notifications'
];
```

Users accessing these routes without authentication are redirected to `/login`.

---

### Admin Routes (Require Admin Role)

```typescript
const adminRoutes = [
  '/admin',
  '/dashboard'
];
```

Users with non-admin roles accessing these routes receive a 403 Forbidden response.

---

### Auth Routes (Redirect if Logged In)

```typescript
const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password'
];
```

Authenticated users accessing these routes are redirected to `/profile`.

---

## Authentication Flow

```
Request
   │
   ▼
Check NextAuth JWT token
   │
   ├── No token + Protected route → Redirect to /login
   │
   ├── No token + Public route → Allow
   │
   ├── Token + Auth route → Redirect to /profile
   │
   ├── Token + Admin route + Non-admin role → 403 Forbidden
   │
   └── Token + Valid access → Allow
```

---

## Security Headers

The middleware injects the following security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable features |

---

## Matcher Configuration

```typescript
export const config = {
  matcher: [
    // Skip static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
```

**Excluded from middleware:**
- `/_next/static/*` - Static assets
- `/_next/image/*` - Image optimization
- `/favicon.ico` - Favicon
- `/api/*` - API routes (have their own auth)

---

## NextAuth Integration

### Token Verification

```typescript
import { getToken } from 'next-auth/jwt';

const token = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET,
});
```

### Dual Secret Support

For migration scenarios, the middleware supports fallback to alternate secret:

```typescript
let token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

if (!token && process.env.NEXTAUTH_SECRET_ALT) {
  token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET_ALT });
}
```

---

## Role Checking

```typescript
interface Token {
  id: string;
  role: 'user' | 'admin';
  email?: string;
}

function isAdmin(token: Token): boolean {
  return token.role === 'admin';
}
```

---

## Redirect Handling

### Login Redirect with Return URL

```typescript
const loginUrl = new URL('/login', request.url);
loginUrl.searchParams.set('callbackUrl', request.url);
return NextResponse.redirect(loginUrl);
```

After login, user is redirected back to originally requested page.

---

## Error Responses

### 403 Forbidden (Admin Access)

```typescript
return new NextResponse('Forbidden', { status: 403 });
```

### 401 Unauthorized (API Routes)

API routes return JSON:

```json
{
  "ok": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

---

## Implementation

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check protected routes
  if (isProtectedRoute(pathname)) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check admin routes
  if (isAdminRoute(pathname)) {
    if (!token || token.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Check auth routes (redirect if logged in)
  if (isAuthRoute(pathname) && token) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}
```

---

## Testing

### Manual Testing

1. Access `/profile` without login → Should redirect to `/login`
2. Access `/admin` as regular user → Should show 403
3. Access `/login` while logged in → Should redirect to `/profile`

### Unit Testing

Middleware is difficult to unit test directly. Use integration tests:

```typescript
describe('Middleware', () => {
  it('redirects unauthenticated users from protected routes', async () => {
    const response = await fetch('/profile', { redirect: 'manual' });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });
});
```

---

**End of Middleware Documentation**
