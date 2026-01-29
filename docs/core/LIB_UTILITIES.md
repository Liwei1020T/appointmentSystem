# Utility Libraries Reference

**String Service Platform — Library Functions Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The `src/lib/` directory contains utility functions and helpers used throughout the application. This document provides comprehensive documentation for all utilities.

---

## Core Utilities

### prisma.ts

**Purpose:** Singleton Prisma client for database access.

```typescript
import { prisma } from '@/lib/prisma';

// Usage
const users = await prisma.user.findMany();
```

---

### api-response.ts

**Purpose:** Standardized API response helpers.

```typescript
import { successResponse, errorResponse } from '@/lib/api-response';

// Success response
return successResponse({ user: userData }); // { ok: true, data: { user: ... } }

// Error response
return errorResponse('NOT_FOUND', 'User not found', 404);
// { ok: false, error: { code: 'NOT_FOUND', message: 'User not found' } }
```

---

### api-errors.ts

**Purpose:** Custom error class for API errors.

```typescript
import { AppError } from '@/lib/api-errors';

throw new AppError('VALIDATION_FAILED', 'Invalid email format', 400);
```

**Properties:**
- `code`: Error code (e.g., 'VALIDATION_FAILED')
- `message`: Human-readable message
- `status`: HTTP status code

---

### server-auth.ts

**Purpose:** Server-side authentication helpers.

```typescript
import { requireAuth, requireAdmin, getOptionalUser } from '@/lib/server-auth';

// Require authenticated user
export async function GET(request: Request) {
  const user = await requireAuth(); // Throws if not authenticated
  return successResponse({ userId: user.id });
}

// Require admin user
export async function POST(request: Request) {
  const admin = await requireAdmin(); // Throws if not admin
  // Admin-only logic
}

// Optional authentication
export async function GET(request: Request) {
  const user = await getOptionalUser(); // Returns null if not authenticated
  if (user) {
    // Personalized response
  }
}
```

---

### auth.ts

**Purpose:** NextAuth configuration and options.

```typescript
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

const session = await getServerSession(authOptions);
```

**Configuration:**
- Credentials provider (phone + password)
- JWT session strategy
- Custom session callbacks
- Role in session

---

## Validation Utilities

### validation.ts

**Purpose:** Input validation using Zod schemas.

```typescript
import { validateInput, createOrderSchema } from '@/lib/validation';

// Validate request body
const data = validateInput(createOrderSchema, requestBody);
```

**Available Schemas:**
- `createOrderSchema` - Order creation
- `updateProfileSchema` - Profile updates
- `createPaymentSchema` - Payment creation
- `createVoucherSchema` - Voucher creation (admin)

---

### phone.ts

**Purpose:** Phone number formatting and validation.

```typescript
import { formatPhone, validatePhone, normalizePhone } from '@/lib/phone';

// Format for display
formatPhone('60123456789'); // '+60 12-345 6789'

// Validate Malaysian phone
validatePhone('0123456789'); // true

// Normalize to E.164
normalizePhone('0123456789'); // '60123456789'
```

---

## Business Logic Utilities

### membership.ts

**Purpose:** Membership tier calculations.

```typescript
import { calculateTier, getPointsMultiplier, getTierBenefits } from '@/lib/membership';

// Calculate tier from spend/orders
const tier = calculateTier(1500, 15); // 'SILVER'

// Get points multiplier
const multiplier = getPointsMultiplier('SILVER'); // 1.25

// Get tier benefits
const benefits = getTierBenefits('GOLD');
// [{ name: 'Priority Queue', type: 'priority' }, ...]
```

---

### orderEta.ts

**Purpose:** Order ETA calculation.

```typescript
import { calculateEta, formatEta, getQueuePosition } from '@/lib/orderEta';

// Calculate estimated completion
const eta = calculateEta(orderId);
// { estimatedTime: Date, queuePosition: 3, hoursRemaining: 4 }

// Format for display
formatEta(eta); // 'Today, 6:00 PM' or 'Tomorrow, 2:00 PM'

// Get queue position
const position = await getQueuePosition(orderId); // 3
```

**Calculation Factors:**
- Orders ahead in queue
- Average stringing time (30 min)
- Shop operating hours (10 AM - 8 PM)
- Multi-racket orders count as multiple

---

### voucher-utils.ts

**Purpose:** Voucher calculation helpers.

```typescript
import { calculateDiscount, isVoucherApplicable } from '@/lib/voucher-utils';

// Calculate discount amount
const discount = calculateDiscount(voucher, orderAmount);
// Handles percentage vs fixed, max discount, min purchase

// Check if voucher can be applied
const applicable = isVoucherApplicable(voucher, orderAmount, userId);
// Checks expiry, min purchase, usage limit, user restrictions
```

---

## OTP & Security

### otp.ts

**Purpose:** OTP code generation and verification.

```typescript
import { generateOtp, hashOtp, verifyOtp } from '@/lib/otp';

// Generate 6-digit OTP
const code = generateOtp(); // '847291'

// Hash for storage
const hash = hashOtp(code); // SHA256 hash

// Verify OTP
const valid = verifyOtp(inputCode, storedHash); // true/false
```

**OTP Configuration:**
- Length: 6 digits
- Expiry: 5 minutes
- Max attempts: 3

---

### roles.ts

**Purpose:** Role checking utilities.

```typescript
import { isAdmin, isUser, hasRole } from '@/lib/roles';

// Check role
isAdmin(user); // true/false
isUser(user); // true/false
hasRole(user, 'admin'); // true/false
```

---

## Notification Utilities

### orderNotificationHelper.ts

**Purpose:** Order notification generation.

```typescript
import {
  getOrderConfirmationNotification,
  getOrderCompletionNotification,
  getOrderCancellationNotification
} from '@/lib/orderNotificationHelper';

// Generate notification content
const notification = getOrderConfirmationNotification(order);
// { title: 'Order Confirmed', message: '...', type: 'order' }
```

---

### sms.ts

**Purpose:** SMS sending utilities.

```typescript
import { sendSms, sendOrderNotificationSms } from '@/lib/sms';

// Send generic SMS
await sendSms('+60123456789', 'Your message here');

// Send order notification
await sendOrderNotificationSms(order, 'completed');
```

**Configuration:**
- Provider: Configurable (Twilio, etc.)
- Rate limiting: 1 SMS per minute per user
- Templates: Predefined for order events

---

## File & Upload Utilities

### upload.ts

**Purpose:** File upload handling.

```typescript
import { uploadFile, deleteFile, getUploadPath } from '@/lib/upload';

// Upload file
const url = await uploadFile(file, 'orders');
// '/uploads/orders/abc123.jpg'

// Delete file
await deleteFile('/uploads/orders/abc123.jpg');

// Get upload path
const path = getUploadPath('orders', 'abc123.jpg');
```

**Configuration:**
- Max size: 5MB
- Allowed types: image/jpeg, image/png, image/webp
- Storage: `/public/uploads/`

---

## Reporting Utilities

### reporting.ts

**Purpose:** Report generation helpers.

```typescript
import {
  generateRevenueReport,
  generateOrderReport,
  formatCurrency
} from '@/lib/reporting';

// Generate revenue report
const report = await generateRevenueReport({
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  groupBy: 'day'
});

// Format currency
formatCurrency(1234.50); // 'RM 1,234.50'
```

---

### review-mapper.ts

**Purpose:** Review data mapping.

```typescript
import { mapReviewForDisplay, mapReviewsForList } from '@/lib/review-mapper';

// Map single review
const displayReview = mapReviewForDisplay(dbReview);
// Transforms DB fields to frontend-friendly format

// Map review list
const reviews = mapReviewsForList(dbReviews);
```

---

## Payment Utilities

### payment-helpers.ts

**Purpose:** Payment calculation helpers.

```typescript
import {
  calculatePaymentAmount,
  formatPaymentStatus,
  getPaymentMethodLabel
} from '@/lib/payment-helpers';

// Calculate total with fees
const amount = calculatePaymentAmount(orderTotal, 'tng');
// May include processing fees

// Format status for display
formatPaymentStatus('pending_verification'); // 'Awaiting Verification'

// Get method label
getPaymentMethodLabel('tng'); // 'Touch \'n Go eWallet'
```

---

## Sharing Utilities

### share.ts

**Purpose:** Social sharing utilities.

```typescript
import {
  generateShareUrl,
  getWhatsAppShareLink,
  getSmsShareLink
} from '@/lib/share';

// Generate referral share URL
const url = generateShareUrl('referral', 'ABC12345');
// 'https://string.app/r/ABC12345'

// WhatsApp share link
const waLink = getWhatsAppShareLink('Check out this app!', url);
// 'https://wa.me/?text=...'

// SMS share link
const smsLink = getSmsShareLink('Check out this app!', url);
// 'sms:?body=...'
```

---

## Constants

### constants.ts

**Purpose:** Application constants.

```typescript
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  MEMBERSHIP_TIERS,
  DEFAULT_TENSION,
  MAX_RACKETS_PER_ORDER
} from '@/lib/constants';

// Order statuses
ORDER_STATUSES.PENDING // 'pending'
ORDER_STATUSES.COMPLETED // 'completed'

// Payment methods
PAYMENT_METHODS.TNG // 'tng'
PAYMENT_METHODS.CASH // 'cash'

// Defaults
DEFAULT_TENSION // 26
MAX_RACKETS_PER_ORDER // 5
```

---

### brand.ts

**Purpose:** Brand-related constants.

```typescript
import { BRAND_NAME, BRAND_COLORS, CONTACT_INFO } from '@/lib/brand';

BRAND_NAME // 'String Service'
BRAND_COLORS.PRIMARY // '#0F766E'
CONTACT_INFO.PHONE // '+60123456789'
CONTACT_INFO.WHATSAPP // 'https://wa.me/60123456789'
```

---

### utils.ts

**Purpose:** General utility functions.

```typescript
import { cn, formatDate, formatPrice, slugify } from '@/lib/utils';

// Combine class names (tailwind-merge)
cn('px-4', isActive && 'bg-blue-500'); // 'px-4 bg-blue-500'

// Format date
formatDate(new Date()); // '27 Jan 2026'

// Format price
formatPrice(28.50); // 'RM 28.50'

// Create slug
slugify('Hello World'); // 'hello-world'
```

---

## Usage Patterns

### Error Handling Pattern

```typescript
import { AppError } from '@/lib/api-errors';
import { errorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    // Business logic
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error('Unexpected error:', error);
    return errorResponse('SYSTEM_ERROR', 'An unexpected error occurred', 500);
  }
}
```

### Validation Pattern

```typescript
import { validateInput, createOrderSchema } from '@/lib/validation';
import { AppError } from '@/lib/api-errors';

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const data = validateInput(createOrderSchema, body);
    // Use validated data
  } catch (error) {
    throw new AppError('VALIDATION_FAILED', error.message, 400);
  }
}
```

---

**End of Utility Libraries Reference**
