# Phase 3: Strategic Features - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement strategic features to increase user retention and marketing efficiency.
**Architecture:** New database models for membership, promotions, and analytics. New services to handle business logic. Admin APIs for management.
**Tech Stack:** Next.js 14, Prisma, TypeScript, Tailwind CSS, Recharts (for dashboard).

---

## 1. Membership Tier System (Silver/Gold/VIP)

### Task 1.1: Database Schema & Migration
**Files:**
- Modify: `prisma/schema.prisma`
- Create: `sql/migrations/021_membership_tiers.sql`

**Step 1: Update Schema**
```prisma
enum MembershipTier {
  SILVER
  GOLD
  VIP
}

model User {
  // ... existing fields
  membershipTier    MembershipTier @default(SILVER)
  totalSpent        Decimal        @default(0) @db.Decimal(10, 2)
  totalOrders       Int            @default(0)
  tierUpdatedAt     DateTime?
}

model TierBenefit {
  id                String         @id @default(cuid())
  tier              MembershipTier
  benefitType       String         // "points_multiplier", "priority_queue", "exclusive_discount"
  benefitValue      String         // "1.2", "true", "5%"
  description       String
  isActive          Boolean        @default(true)
}
```

**Step 2: Create Migration**
Generate SQL migration file.

**Step 3: Update Seed Data**
Add default tier benefits in `prisma/seed.ts`.

### Task 1.2: Membership Service
**Files:**
- Create: `src/server/services/membership.service.ts`

**Step 1: Implement Tier Logic**
- `checkAndUpgradeTier(userId)`: Check rules (Gold: RM200/5 orders, VIP: RM500/12 orders).
- `calculatePointsMultiplier(tier)`: Return multiplier (Silver: 1.0, Gold: 1.2, VIP: 1.5).
- `getTierBenefits(tier)`: Return active benefits.

### Task 1.3: Integration with Order & Points
**Files:**
- Modify: `src/server/services/order.service.ts`
- Modify: `src/server/services/points.service.ts`

**Step 1: Update Order Service**
- In `completeOrder` (or equivalent status change):
  - Update `user.totalSpent` and `user.totalOrders`.
  - Call `checkAndUpgradeTier`.

**Step 2: Update Points Service**
- In `awardPoints`:
  - Fetch user tier.
  - Apply multiplier from `membership.service`.

### Task 1.4: Membership API & UI
**Files:**
- Create: `src/app/api/profile/membership/route.ts`
- Create: `src/components/MembershipCard.tsx`
- Modify: `src/app/profile/page.tsx`

**Step 1: API**
- `GET /api/profile/membership`: Return current tier, stats, progress to next tier, and benefits.

**Step 2: UI Component**
- Display current tier badge.
- Progress bar: "Spend RM X more to reach Gold".
- List of current benefits.

---

## 2. Marketing Campaign Tools

### Task 2.1: Database Schema & Migration
**Files:**
- Modify: `prisma/schema.prisma`
- Create: `sql/migrations/022_promotions.sql`

**Step 1: Update Schema**
```prisma
enum PromotionType {
  FLASH_SALE       // Time-limited discount
  POINTS_BOOST     // 2x Points
  SPEND_SAVE       // Spend 100 save 10
}

enum DiscountType {
  FIXED
  PERCENTAGE
}

model Promotion {
  id              String          @id @default(cuid())
  name            String
  type            PromotionType
  discountType    DiscountType
  discountValue   Decimal         @db.Decimal(10, 2)
  minPurchase     Decimal?        @db.Decimal(10, 2)
  startAt         DateTime
  endAt           DateTime
  isActive        Boolean         @default(true)
  usageLimit      Int?
  usageCount      Int             @default(0)
  usages          PromotionUsage[]
  createdAt       DateTime        @default(now())
}

model PromotionUsage {
  id           String    @id @default(cuid())
  promotionId  String
  promotion    Promotion @relation(fields: [promotionId], references: [id])
  userId       String
  orderId      String?
  savedAmount  Decimal   @db.Decimal(10, 2)
  createdAt    DateTime  @default(now())
}
```

### Task 2.2: Promotion Service
**Files:**
- Create: `src/server/services/promotion.service.ts`

**Step 1: Implement Logic**
- `getActivePromotions()`: Find currently running promos.
- `calculateOrderDiscount(orderItems, promotions)`: Calculate best discount.
- `recordPromotionUsage(promotionId, userId, orderId, amount)`: Track stats.

### Task 2.3: Admin Management UI
**Files:**
- Create: `src/app/admin/promotions/page.tsx`
- Create: `src/app/api/admin/promotions/route.ts`

**Step 1: API**
- CRUD operations for promotions.

**Step 2: UI**
- List active/past promotions.
- Create form for new campaigns.
- Stats view: Total usage, total discount given.

---

## 3. Business Insights Dashboard

### Task 3.1: Dashboard Service
**Files:**
- Create: `src/server/services/analytics.service.ts`

**Step 1: Implement Metrics**
- `getUserLtv()`: Avg total spent per user.
- `getRetentionRate(days)`: % of users with >1 order in period.
- `getAverageOrderValueTrend()`: Monthly AOV.
- `getPopularHours()`: Order count by hour of day.

### Task 3.2: Dashboard UI
**Files:**
- Create: `src/app/admin/analytics/page.tsx`
- Create: `src/components/charts/LtvChart.tsx`
- Create: `src/components/charts/RetentionChart.tsx`

**Step 1: Visualization**
- Use Recharts to render trend lines and heatmaps.
- Integrate `analytics.service` data.

---

## Execution Handoff

Plan saved. Ready to execute **Task 1: Membership Tier System**.
