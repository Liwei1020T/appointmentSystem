# Membership & Badge System

**String Service Platform — Loyalty Program Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The membership system rewards loyal customers with tiered benefits, exclusive badges, and enhanced rewards. Users automatically progress through tiers based on their spending and order history.

---

## Membership Tiers

### Tier Progression

| Tier | Required Spend | Required Orders | Points Multiplier |
|------|----------------|-----------------|-------------------|
| **Regular** | RM 0 | 0 | 1.0x |
| **Bronze** | RM 500 | 5 | 1.1x |
| **Silver** | RM 1,500 | 15 | 1.25x |
| **Gold** | RM 3,000 | 30 | 1.5x |
| **VIP** | RM 5,000 | 50 | 2.0x |

### Tier Benefits

#### Regular (Default)
- Standard pricing
- 1 point per RM spent
- Access to public vouchers

#### Bronze
- **1.1x points** on all orders
- Early access to promotions
- Birthday voucher (RM 5)

#### Silver
- **1.25x points** on all orders
- Priority queue for stringing
- Birthday voucher (RM 10)
- Exclusive Silver vouchers

#### Gold
- **1.5x points** on all orders
- Same-day stringing priority
- Birthday voucher (RM 20)
- Free string upgrade (monthly)
- Exclusive Gold vouchers

#### VIP
- **2.0x points** on all orders
- Dedicated service line
- Birthday voucher (RM 50)
- Free grip replacement (monthly)
- Early access to new strings
- VIP-only events and promotions

---

## Database Schema

### User Membership Fields

```prisma
model User {
  // ... other fields
  membershipTier   MembershipTier @default(REGULAR)
  totalSpent       Float          @default(0)
  totalOrders      Int            @default(0)
  memberSince      DateTime?
  tierUpdatedAt    DateTime?

  badges           UserBadge[]
}

enum MembershipTier {
  REGULAR
  BRONZE
  SILVER
  GOLD
  VIP
}
```

### Tier Benefits Table

```prisma
model TierBenefit {
  id          String         @id @default(cuid())
  tier        MembershipTier
  name        String
  description String
  type        String         // 'multiplier', 'voucher', 'priority', 'feature'
  value       Json?          // Configuration data
  active      Boolean        @default(true)

  @@map("tier_benefits")
}
```

### User Badges

```prisma
model UserBadge {
  id         String   @id @default(cuid())
  userId     String
  badgeType  String
  earnedAt   DateTime @default(now())
  metadata   Json?

  user       User     @relation(fields: [userId], references: [id])

  @@unique([userId, badgeType])
  @@map("user_badges")
}
```

---

## API Endpoints

### Get Membership Info

**Endpoint:** `GET /api/profile/membership`
**Auth Required:** Yes

**Response:**

```json
{
  "ok": true,
  "data": {
    "currentTier": "SILVER",
    "totalSpent": 1850.00,
    "totalOrders": 22,
    "memberSince": "2025-06-15T00:00:00Z",
    "nextTier": "GOLD",
    "spentToNextTier": 1150.00,
    "ordersToNextTier": 8,
    "spentProgress": 61,
    "ordersProgress": 73,
    "pointsMultiplier": 1.25,
    "benefits": [
      {
        "name": "Points Boost",
        "description": "Earn 1.25x points on all orders",
        "type": "multiplier"
      },
      {
        "name": "Priority Queue",
        "description": "Priority processing for your orders",
        "type": "priority"
      }
    ]
  }
}
```

---

### Get User Badges

**Endpoint:** `GET /api/profile/badges`
**Auth Required:** Yes

**Response:**

```json
{
  "ok": true,
  "data": {
    "badges": [
      {
        "id": "badge-uuid",
        "type": "EARLY_ADOPTER",
        "name": "Early Adopter",
        "description": "One of our first 100 users",
        "icon": "star",
        "earnedAt": "2025-01-15T00:00:00Z"
      },
      {
        "id": "badge-uuid",
        "type": "POWER_USER",
        "name": "Power User",
        "description": "Completed 10 orders",
        "icon": "zap",
        "earnedAt": "2025-08-20T00:00:00Z"
      }
    ],
    "availableBadges": [
      {
        "type": "STRING_ENTHUSIAST",
        "name": "String Enthusiast",
        "description": "Try 5 different string types",
        "icon": "target",
        "progress": 60,
        "requirement": "5 different strings"
      }
    ]
  }
}
```

---

## Badge Types

### Achievement Badges

| Badge | Requirement | Icon |
|-------|-------------|------|
| **Early Adopter** | First 100 users | star |
| **First Order** | Complete first order | gift |
| **Power User** | Complete 10 orders | zap |
| **Loyal Customer** | Complete 50 orders | heart |
| **Century Club** | Complete 100 orders | award |

### Milestone Badges

| Badge | Requirement | Icon |
|-------|-------------|------|
| **Big Spender** | Spend RM 1,000 total | dollar-sign |
| **Premium Member** | Reach Gold tier | crown |
| **VIP Status** | Reach VIP tier | diamond |

### Special Badges

| Badge | Requirement | Icon |
|-------|-------------|------|
| **String Enthusiast** | Try 5 different strings | target |
| **Package Pro** | Purchase 3 packages | package |
| **Referral Champion** | Refer 10 friends | users |
| **Review Hero** | Write 5 reviews | edit |
| **Perfect Score** | Give 5-star review | star |

---

## Components

### MembershipCard

**File:** `src/components/MembershipCard.tsx`

Displays current membership status:

```tsx
<MembershipCard
  currentTier="SILVER"
  points={1200}
  totalSpent={1850}
  nextTier="GOLD"
  spentProgress={61}
  ordersProgress={73}
  spentTarget={1150}
  ordersTarget={8}
  benefits={benefits}
/>
```

**Features:**
- Visual tier indicator with icon
- Progress bars for next tier
- Benefits list
- Points balance display

---

### BadgeDisplay

**File:** `src/components/BadgeDisplay.tsx`

Shows earned and available badges:

```tsx
<BadgeDisplay
  earnedBadges={badges}
  availableBadges={available}
  showProgress={true}
/>
```

**Features:**
- Badge grid layout
- Earned vs locked states
- Progress indicators
- Badge detail modal

---

## Tier Calculation

### Automatic Upgrade

Tier upgrades are checked after each completed order:

```typescript
// src/services/membershipService.ts

async function checkTierUpgrade(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalSpent: true, totalOrders: true, membershipTier: true }
  });

  const newTier = calculateTier(user.totalSpent, user.totalOrders);

  if (newTier !== user.membershipTier) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        membershipTier: newTier,
        tierUpdatedAt: new Date()
      }
    });

    // Send notification
    await notifyTierUpgrade(userId, newTier);

    // Award tier badge
    await awardBadge(userId, `${newTier}_MEMBER`);
  }
}

function calculateTier(spent: number, orders: number): MembershipTier {
  if (spent >= 5000 && orders >= 50) return 'VIP';
  if (spent >= 3000 && orders >= 30) return 'GOLD';
  if (spent >= 1500 && orders >= 15) return 'SILVER';
  if (spent >= 500 && orders >= 5) return 'BRONZE';
  return 'REGULAR';
}
```

---

## Points System Integration

### Points Multiplier

Points are calculated with tier multiplier:

```typescript
function calculatePoints(amount: number, tier: MembershipTier): number {
  const multipliers = {
    REGULAR: 1.0,
    BRONZE: 1.1,
    SILVER: 1.25,
    GOLD: 1.5,
    VIP: 2.0
  };

  return Math.floor(amount * multipliers[tier]);
}
```

### Example

| Tier | Order Amount | Base Points | Multiplier | Final Points |
|------|--------------|-------------|------------|--------------|
| Regular | RM 50 | 50 | 1.0x | 50 |
| Bronze | RM 50 | 50 | 1.1x | 55 |
| Silver | RM 50 | 50 | 1.25x | 62 |
| Gold | RM 50 | 50 | 1.5x | 75 |
| VIP | RM 50 | 50 | 2.0x | 100 |

---

## Admin Management

### View Member Tiers

**Admin Panel:** Admin > Users > User Detail

Shows:
- Current tier and progress
- Tier history
- Manual tier adjustment (if needed)

### Adjust Points

**Endpoint:** `POST /api/admin/users/{id}/points`

```json
{
  "amount": 100,
  "reason": "Compensation for delayed order"
}
```

---

## Notifications

### Tier Upgrade

```
Title: "Congratulations! You're now a Gold Member!"
Message: "Enjoy 1.5x points on all orders and exclusive benefits."
```

### Badge Earned

```
Title: "New Badge Earned!"
Message: "You've earned the 'Power User' badge for completing 10 orders."
```

### Progress Update

```
Title: "You're close to the next tier!"
Message: "Spend RM 150 more to reach Gold status and unlock 1.5x points."
```

---

## Best Practices

1. **Display tier prominently** - Show tier badge on profile and orders
2. **Celebrate milestones** - Animate tier upgrades and badge achievements
3. **Show progress** - Always display progress to next tier
4. **Highlight benefits** - Remind users of active benefits
5. **Exclusive content** - Create tier-specific vouchers and promotions

---

**End of Membership System Documentation**
