# Points System

**String Service Platform — Points & Rewards Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The points system rewards users for their activities on the platform. Points can be earned through orders, referrals, reviews, and special promotions, then redeemed for vouchers and discounts.

---

## Earning Points

### Points Earning Table

| Activity | Base Points | Tier Multiplier Applied |
|----------|-------------|-------------------------|
| Order completion | 1 point per RM spent | ✅ Yes |
| First order bonus | 20 points | ❌ No |
| Review submission | 10 points | ❌ No |
| Referral completion | 50 points | ❌ No |
| Birthday bonus | 50-200 points (tier-based) | ❌ No |
| Special promotions | Varies | ❌ No |

### Tier Multipliers

| Tier | Multiplier | Example (RM 50 order) |
|------|------------|----------------------|
| Regular | 1.0x | 50 points |
| Bronze | 1.1x | 55 points |
| Silver | 1.25x | 62 points |
| Gold | 1.5x | 75 points |
| VIP | 2.0x | 100 points |

---

## Redeeming Points

### Available Redemptions

| Voucher | Points Cost | Value |
|---------|-------------|-------|
| RM 3 Discount | 30 points | RM 3 off |
| RM 5 Discount | 50 points | RM 5 off |
| RM 10 Discount | 100 points | RM 10 off |
| Free String (Basic) | 250 points | Free basic string |
| Free String (Premium) | 400 points | Free premium string |

---

## API Endpoints

### Get Points Balance

**Endpoint:** `GET /api/points`
**Auth Required:** Yes

**Response:**

```json
{
  "ok": true,
  "data": {
    "balance": 350,
    "lifetimeEarned": 1200,
    "lifetimeRedeemed": 850,
    "pendingPoints": 50,
    "tier": "SILVER",
    "multiplier": 1.25
  }
}
```

---

### Get Points History

**Endpoint:** `GET /api/points/history`
**Auth Required:** Yes

**Query Parameters:**
- `type`: `all` | `earned` | `redeemed`
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**

```json
{
  "ok": true,
  "data": {
    "history": [
      {
        "id": "log-uuid",
        "type": "earned",
        "amount": 62,
        "description": "Order #12345 completed",
        "referenceType": "order",
        "referenceId": "order-uuid",
        "createdAt": "2026-01-27T10:00:00Z"
      },
      {
        "id": "log-uuid",
        "type": "redeemed",
        "amount": -50,
        "description": "Redeemed RM 5 voucher",
        "referenceType": "voucher",
        "referenceId": "voucher-uuid",
        "createdAt": "2026-01-26T14:30:00Z"
      }
    ],
    "total": 45,
    "balance": 350
  }
}
```

---

### Get Points Statistics

**Endpoint:** `GET /api/points/stats`
**Auth Required:** Yes

**Response:**

```json
{
  "ok": true,
  "data": {
    "thisMonth": {
      "earned": 150,
      "redeemed": 50
    },
    "lastMonth": {
      "earned": 200,
      "redeemed": 100
    },
    "breakdown": {
      "orders": 500,
      "referrals": 200,
      "reviews": 50,
      "promotions": 100
    }
  }
}
```

---

### Redeem Points for Voucher

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
    "remainingBalance": 300,
    "voucher": {
      "code": "POINTS5",
      "value": 5,
      "expiresAt": "2026-02-27T00:00:00Z"
    }
  }
}
```

---

### Deduct Points (Internal)

**Endpoint:** `POST /api/points/redeem`
**Auth Required:** Yes

Used internally for point deductions:

```json
{
  "amount": 50,
  "reason": "Voucher redemption",
  "referenceType": "voucher",
  "referenceId": "voucher-uuid"
}
```

---

## Database Schema

### PointsLog Table

```prisma
model PointsLog {
  id            String   @id @default(cuid())
  userId        String
  type          String   // earned, redeemed, adjusted, expired
  amount        Int      // positive for earned, negative for redeemed
  description   String
  referenceType String?  // order, referral, review, voucher, promotion, adjustment
  referenceId   String?
  createdAt     DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
  @@map("points_logs")
}
```

### User Points Fields

```prisma
model User {
  // ... other fields
  points         Int      @default(0)
  lifetimePoints Int      @default(0)

  pointsLogs     PointsLog[]
}
```

---

## Service Implementation

**File:** `src/services/pointsService.ts`

### Key Functions

```typescript
// Award points to user
async function awardPoints(
  userId: string,
  amount: number,
  description: string,
  referenceType?: string,
  referenceId?: string
): Promise<PointsLog>

// Deduct points from user
async function deductPoints(
  userId: string,
  amount: number,
  description: string,
  referenceType?: string,
  referenceId?: string
): Promise<PointsLog>

// Get user's points balance
async function getPointsBalance(userId: string): Promise<number>

// Get points history
async function getPointsHistory(
  userId: string,
  type?: string,
  limit?: number,
  offset?: number
): Promise<PointsLog[]>

// Calculate points for order (with tier multiplier)
function calculateOrderPoints(
  amount: number,
  tier: MembershipTier
): number
```

---

## Points Calculation

### Order Points

```typescript
function calculateOrderPoints(
  orderAmount: number,
  membershipTier: MembershipTier
): number {
  const multipliers = {
    REGULAR: 1.0,
    BRONZE: 1.1,
    SILVER: 1.25,
    GOLD: 1.5,
    VIP: 2.0
  };

  const basePoints = Math.floor(orderAmount);
  const multiplier = multipliers[membershipTier] || 1.0;

  return Math.floor(basePoints * multiplier);
}
```

### Points Award Flow

```
Order Completed
    │
    ▼
Calculate base points (1 per RM)
    │
    ▼
Apply tier multiplier
    │
    ▼
Create PointsLog entry
    │
    ▼
Update User.points balance
    │
    ▼
Send notification
```

---

## Components

### PointsCenterPage

**File:** `src/features/profile/PointsCenterPage.tsx`

Main points management page:

```tsx
<PointsCenterPage />
```

Features:
- Current balance display
- Points history with filters
- Redeemable vouchers
- Statistics and trends

---

### PointsBalance

**File:** `src/components/PointsBalance.tsx`

Compact points display:

```tsx
<PointsBalance
  balance={350}
  showTrend={true}
  size="md"
/>
```

---

### PointsHistoryList

**File:** `src/components/PointsHistoryList.tsx`

Points transaction history:

```tsx
<PointsHistoryList
  history={pointsHistory}
  loading={loading}
  onLoadMore={loadMore}
/>
```

---

## Notifications

### Points Earned

```
Title: "Points Earned!"
Message: "You earned 62 points for Order #12345. Your balance: 350 points."
```

### Points Redeemed

```
Title: "Voucher Redeemed"
Message: "You redeemed 50 points for a RM 5 voucher. Your balance: 300 points."
```

### Low Balance Warning

When user attempts redemption with insufficient points:

```
Title: "Insufficient Points"
Message: "You need 50 points but only have 30. Complete more orders to earn points!"
```

---

## Admin Management

### Adjust User Points

**Endpoint:** `POST /api/admin/users/{id}/points`

**Request Body:**

```json
{
  "amount": 100,
  "reason": "Customer service compensation"
}
```

### View Points Statistics

**Admin Panel:** Admin > Analytics > Points

Shows:
- Total points in circulation
- Points earned vs redeemed (trends)
- Average points per user
- Top point earners

---

## Points Expiration

Currently, points do not expire. Future consideration:

- Points may expire after 12 months of inactivity
- Warning notifications at 3 months, 1 month, 1 week before expiration
- Expired points logged as `type: expired`

---

## Best Practices

1. **Clear value proposition** - Show what points can get
2. **Frequent small rewards** - Better than rare large ones
3. **Progress visibility** - Show progress to next redemption
4. **Surprise bonuses** - Occasional bonus points campaigns
5. **Simple math** - 1 point per RM is easy to understand

---

**End of Points System Documentation**
