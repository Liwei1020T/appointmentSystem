# Voucher System

**String Service Platform — Voucher & Coupon Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The voucher system provides discounts to users through various channels: point redemption, referral rewards, promotional campaigns, and admin distribution.

---

## Voucher Types

### By Discount Type

| Type | Description | Example |
|------|-------------|---------|
| `fixed` | Fixed amount discount | RM 5 off |
| `percentage` | Percentage discount | 10% off |

### By Source

| Source | Description |
|--------|-------------|
| Points redemption | User exchanges points for voucher |
| Referral reward | Given to new users from referral |
| First order | Auto-issued on first order completion |
| Admin distribution | Manually distributed by admin |
| Promotion campaign | Part of marketing campaign |

---

## API Endpoints

### Get User Vouchers

**Endpoint:** `GET /api/vouchers/user`
**Auth Required:** Yes

**Query Parameters:**
- `status`: `all` | `active` | `used` | `expired`

**Response:**

```json
{
  "ok": true,
  "data": {
    "vouchers": [
      {
        "id": "user-voucher-uuid",
        "code": "WELCOME5",
        "name": "RM 5 Welcome Voucher",
        "type": "fixed",
        "value": 5,
        "minPurchase": 20,
        "status": "active",
        "expiresAt": "2026-02-27T00:00:00Z",
        "createdAt": "2026-01-27T00:00:00Z"
      }
    ]
  }
}
```

---

### Get Redeemable Vouchers

**Endpoint:** `GET /api/vouchers/redeemable`
**Auth Required:** Yes

Returns vouchers available for point redemption:

**Response:**

```json
{
  "ok": true,
  "data": {
    "vouchers": [
      {
        "id": "voucher-template-uuid",
        "code": "POINTS5",
        "name": "RM 5 Discount",
        "type": "fixed",
        "value": 5,
        "pointsCost": 50,
        "minPurchase": 20,
        "validityDays": 30
      }
    ]
  }
}
```

---

### Redeem Voucher by Code

**Endpoint:** `POST /api/vouchers/redeem`
**Auth Required:** Yes

**Request Body:**

```json
{
  "code": "PROMO2026"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "userVoucher": {
      "id": "user-voucher-uuid",
      "code": "PROMO2026",
      "name": "New Year Discount",
      "value": 10,
      "expiresAt": "2026-02-28T00:00:00Z"
    }
  }
}
```

---

### Redeem with Points

**Endpoint:** `POST /api/vouchers/redeem-with-points`
**Auth Required:** Yes

**Request Body:**

```json
{
  "voucherId": "voucher-template-uuid"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "userVoucherId": "user-voucher-uuid",
    "pointsDeducted": 50,
    "remainingBalance": 300
  }
}
```

---

### Get Voucher Statistics

**Endpoint:** `GET /api/vouchers/stats`
**Auth Required:** Yes

**Response:**

```json
{
  "ok": true,
  "data": {
    "total": 10,
    "active": 3,
    "used": 5,
    "expired": 2,
    "usageRate": 50,
    "totalSaved": 45
  }
}
```

---

## Database Schema

### Voucher Table (Template)

```prisma
model Voucher {
  id            String    @id @default(cuid())
  code          String    @unique
  name          String
  description   String?
  type          String    // fixed, percentage
  value         Float
  minPurchase   Float?
  maxDiscount   Float?    // For percentage type
  pointsCost    Int?      // Points required to redeem
  validFrom     DateTime?
  validUntil    DateTime?
  validityDays  Int?      // Days valid after redemption
  usageLimit    Int?      // Total usage limit
  usageCount    Int       @default(0)
  isAutoIssue   Boolean   @default(false)
  isFirstOrderOnly Boolean @default(false)
  active        Boolean   @default(true)
  createdAt     DateTime  @default(now())

  userVouchers  UserVoucher[]

  @@map("vouchers")
}
```

### UserVoucher Table (Claimed)

```prisma
model UserVoucher {
  id         String    @id @default(cuid())
  userId     String
  voucherId  String
  status     String    @default("active") // active, used, expired
  usedAt     DateTime?
  usedOnOrder String?  // Order ID where used
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())

  user       User      @relation(fields: [userId], references: [id])
  voucher    Voucher   @relation(fields: [voucherId], references: [id])

  @@unique([userId, voucherId])
  @@map("user_vouchers")
}
```

---

## Service Implementation

**File:** `src/services/voucherService.ts`

### Key Functions

```typescript
// Get user's vouchers
async function getUserVouchers(
  userId: string,
  status?: string
): Promise<UserVoucher[]>

// Redeem voucher by code
async function redeemVoucherByCode(
  userId: string,
  code: string
): Promise<UserVoucher>

// Redeem voucher with points
async function redeemWithPoints(
  userId: string,
  voucherId: string
): Promise<UserVoucher>

// Apply voucher to order
async function applyVoucherToOrder(
  userVoucherId: string,
  orderId: string,
  orderAmount: number
): Promise<ApplyResult>

// Calculate discount
function calculateDiscount(
  voucher: Voucher,
  orderAmount: number
): number

// Check voucher validity
function isVoucherValid(
  userVoucher: UserVoucher
): boolean

// Restore voucher (on order cancellation)
async function restoreVoucher(
  userVoucherId: string
): Promise<void>
```

---

## Voucher Application Flow

### During Checkout

```
1. User selects voucher from available list
2. System validates:
   - Voucher is active (not used/expired)
   - Minimum purchase met
   - Voucher applicable to order type
3. Discount calculated and displayed
4. Order created with voucher applied
5. Voucher marked as "used" on payment completion
```

### Order Cancellation

```
1. Order cancelled (by user or timeout)
2. If voucher was applied:
   - Check voucher hasn't expired since
   - Restore to "active" status
   - Clear usedOnOrder reference
3. Notify user of voucher restoration
```

---

## First Order Voucher

### Auto-Issue Configuration

```typescript
// Voucher marked with:
{
  isAutoIssue: true,
  isFirstOrderOnly: true
}
```

### Issue Logic

When user signs up:
1. Check for auto-issue vouchers
2. If first-order voucher exists and user is new
3. Create UserVoucher entry
4. Send welcome notification

---

## Components

### VoucherList

**File:** `src/components/VoucherList.tsx`

Displays user's vouchers:

```tsx
<VoucherList
  vouchers={vouchers}
  onSelect={handleSelect}
  selectedId={selectedVoucherId}
/>
```

---

### VoucherCard

**File:** `src/components/VoucherCard.tsx`

Single voucher display:

```tsx
<VoucherCard
  voucher={voucher}
  variant="selectable" // or "display"
  selected={isSelected}
  onSelect={handleSelect}
/>
```

Features:
- Ticket-style design
- Status badge (active/used/expired)
- Expiry countdown
- Min purchase indicator

---

### VoucherSelector

**File:** `src/components/VoucherSelector.tsx`

Checkout voucher picker:

```tsx
<VoucherSelector
  vouchers={applicableVouchers}
  orderAmount={orderAmount}
  onSelect={handleVoucherSelect}
  selectedVoucherId={selectedId}
/>
```

---

## Admin Management

### Create Voucher

**Endpoint:** `POST /api/admin/vouchers`

**Request Body:**

```json
{
  "code": "NEWYEAR2026",
  "name": "New Year Discount",
  "type": "percentage",
  "value": 10,
  "minPurchase": 30,
  "maxDiscount": 20,
  "validFrom": "2026-01-01T00:00:00Z",
  "validUntil": "2026-01-31T23:59:59Z",
  "usageLimit": 100,
  "isAutoIssue": false,
  "isFirstOrderOnly": false
}
```

---

### Distribute Voucher

**Endpoint:** `POST /api/admin/vouchers/{id}/distribute`

**Request Body:**

```json
{
  "target": "all", // or "specific"
  "userIds": ["user-1", "user-2"] // if specific
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "count": 150,
    "distributed": 145,
    "skipped": 5 // Already had voucher
  }
}
```

---

### View Voucher Statistics

**Endpoint:** `GET /api/admin/vouchers/stats`

**Response:**

```json
{
  "ok": true,
  "data": {
    "totalVouchers": 25,
    "activeVouchers": 10,
    "totalDistributed": 500,
    "totalUsed": 320,
    "usageRate": 64,
    "totalDiscountGiven": 1600
  }
}
```

---

## Validation Rules

### Minimum Purchase

```typescript
if (voucher.minPurchase && orderAmount < voucher.minPurchase) {
  throw new Error('VOUCHER_MIN_ORDER');
}
```

### Expiry Check

```typescript
if (userVoucher.expiresAt && new Date() > userVoucher.expiresAt) {
  throw new Error('VOUCHER_EXPIRED');
}
```

### Usage Limit

```typescript
if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
  throw new Error('VOUCHER_LIMIT_REACHED');
}
```

---

## Notifications

### Voucher Received

```
Title: "New Voucher!"
Message: "You received a RM 5 discount voucher. Valid until Feb 27."
```

### Voucher Expiring

```
Title: "Voucher Expiring Soon"
Message: "Your RM 5 voucher expires in 3 days. Use it before it's gone!"
```

### Voucher Restored

```
Title: "Voucher Restored"
Message: "Your RM 5 voucher has been restored due to order cancellation."
```

---

## Best Practices

1. **Clear expiry dates** - Always show when voucher expires
2. **Minimum purchase visibility** - Show min spend requirement
3. **Auto-apply best voucher** - Suggest best applicable voucher
4. **Stack rules** - Define clear rules about voucher stacking (currently: no stacking)
5. **Fraud prevention** - Limit voucher creation and usage per user

---

**End of Voucher System Documentation**
