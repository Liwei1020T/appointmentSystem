# Change Log — 2025-12-30

## Summary
Production optimization (P1 + P2 partial): Added SEO files, middleware security, SSR homepage, PWA manifest.

## Changes

### SEO Optimization
- **[NEW]** `src/app/robots.ts`: Search engine crawler rules
  - Allow: `/`, `/reviews`, `/reviews/featured`
  - Disallow: `/api/`, `/admin/`, `/profile/`, private routes
  
- **[NEW]** `src/app/sitemap.ts`: Dynamic sitemap generation
  - Static pages with priority and changeFrequency
  - Extensible for dynamic content

### Security & Routing
- **[NEW]** `src/middleware.ts`: Edge middleware
  - Route protection (redirect unauthenticated users)
  - Admin role check for `/admin/*` routes
  - Security headers: X-Frame-Options, X-XSS-Protection, etc.
  - Login redirect bypass for authenticated users

### Performance
- **[MODIFY]** `src/app/page.tsx`: Refactored to Server Component
  - Removed `'use client'` directive
  - Use `auth()` for server-side session check
  - Eliminated client-side hydration delay (faster FCP)

### PWA Support
- **[NEW]** `src/app/manifest.ts`: PWA manifest
  - App name, theme color, icons configuration
  - Standalone display mode for native-like experience
  - Supports "Add to Home Screen"

### Business Logic (P2)
- **[MODIFY]** `prisma/schema.prisma`: Added `version` field to `StringInventory`
  - Enables Optimistic Locking for concurrency control
  - Prevents overselling during concurrent purchases
  
- **[NEW]** `src/app/api/cron/cleanup-orders/route.ts`: Auto-cancel expired orders
  - Cancels orders pending > 1 hour without payment
  - Sends notifications to affected users
  - Protected by CRON_SECRET environment variable
  
- **[NEW]** `vercel.json`: Cron configuration
  - Schedule: Every hour (`0 * * * *`)
  - Path: `/api/cron/cleanup-orders`

## Impact
- Improved SEO discoverability
- Faster initial page load (SSR)
- Enhanced security (middleware protection)
- PWA-ready for mobile users
- **Prevents inventory overselling**
- **Auto-cleanup of abandoned orders**
- **Error tracking and monitoring (Sentry)**

### Monitoring (P3)
- **[NEW]** `sentry.client.config.ts`: Browser error tracking
- **[NEW]** `sentry.server.config.ts`: Server-side error tracking
- **[NEW]** `sentry.edge.config.ts`: Edge runtime error tracking
- **[NEW]** `src/instrumentation.ts`: Sentry initialization hook
- **[NEW]** `src/app/global-error.tsx`: Global error page with Sentry integration
- **[MODIFY]** `next.config.js`: Added Sentry webpack plugin wrapper

## Tests
- Build verification: ✅ Exit code 0
- Manual verification needed:
  - Visit `/robots.txt` and `/sitemap.xml`
  - Check middleware redirects work correctly
  - Test homepage load speed improvement
