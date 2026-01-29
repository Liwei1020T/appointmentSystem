# Referral System

**String Service Platform — Referral Program Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The referral system rewards users for inviting friends to the platform. Both the referrer and the referred user receive benefits when the referred user completes their first order.

---

## How It Works

### Referral Flow

```
1. User A gets their unique referral code
2. User A shares code with Friend B
3. Friend B signs up using the referral code
4. Friend B completes their first order
5. Both User A and Friend B receive rewards
```

### Reward Structure

| Recipient | Reward | Condition |
|-----------|--------|-----------|
| Referrer | 50 points | Referee completes first order |
| Referee | RM 5 voucher | Applied automatically on signup |

---

## API Endpoints

### Get Referral Code

**Endpoint:** `GET /api/profile/referral-code`
**Auth Required:** Yes

**Response:**

```json
{
  "ok": true,
  "data": {
    "referralCode": "ABC12345",
    "shareUrl": "https://string.app/r/ABC12345"
  }
}
```

---

### Generate Referral Code

**Endpoint:** `POST /api/profile/referral-code`
**Auth Required:** Yes

Generates a new referral code if user doesn't have one.

**Response:**

```json
{
  "ok": true,
  "data": {
    "referralCode": "XYZ98765"
  }
}
```

---

### Get Referral Stats

**Endpoint:** `GET /api/referrals/my-stats`
**Auth Required:** Yes

**Response:**

```json
{
  "ok": true,
  "data": {
    "totalReferrals": 15,
    "successfulReferrals": 10,
    "pendingReferrals": 5,
    "totalPointsEarned": 500,
    "rank": 3,
    "currentMonthReferrals": 3
  }
}
```

---

### Get Referral List

**Endpoint:** `GET /api/referrals`
**Auth Required:** Yes

**Query Parameters:**
- `status`: `all` | `pending` | `completed`
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**

```json
{
  "ok": true,
  "data": {
    "referrals": [
      {
        "id": "ref-uuid",
        "referredUser": {
          "fullName": "John D.",
          "createdAt": "2026-01-15T10:00:00Z"
        },
        "status": "completed",
        "pointsAwarded": 50,
        "completedAt": "2026-01-20T14:30:00Z"
      }
    ],
    "total": 15,
    "stats": {
      "totalReferrals": 15,
      "successfulReferrals": 10
    }
  }
}
```

---

### Get Leaderboard

**Endpoint:** `GET /api/referrals/leaderboard`
**Auth Required:** Yes

**Query Parameters:**
- `period`: `all` | `month` | `week`
- `limit`: number (default: 10)

**Response:**

```json
{
  "ok": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": "user-uuid",
          "fullName": "Top Referrer",
          "avatarUrl": "/avatars/user.jpg"
        },
        "referralCount": 25,
        "isCurrentUser": false
      }
    ],
    "currentUserRank": 5,
    "period": "month"
  }
}
```

---

## Database Schema

### ReferralLog Table

```prisma
model ReferralLog {
  id           String    @id @default(cuid())
  referrerId   String
  referredId   String
  status       String    @default("pending") // pending, completed, expired
  pointsAwarded Int?
  completedAt  DateTime?
  createdAt    DateTime  @default(now())

  referrer     User      @relation("Referrer", fields: [referrerId], references: [id])
  referred     User      @relation("Referred", fields: [referredId], references: [id])

  @@unique([referrerId, referredId])
  @@map("referral_logs")
}
```

### User Referral Fields

```prisma
model User {
  // ... other fields
  referralCode   String?   @unique
  referredBy     String?   // ID of user who referred them

  referralsGiven ReferralLog[] @relation("Referrer")
  referralReceived ReferralLog? @relation("Referred")
}
```

---

## Service Implementation

**File:** `src/services/referralService.ts`

### Key Functions

```typescript
// Generate unique referral code
async function generateReferralCode(userId: string): Promise<string>

// Process referral on signup
async function processReferralSignup(
  newUserId: string,
  referralCode: string
): Promise<void>

// Complete referral when first order is done
async function completeReferral(referredUserId: string): Promise<void>

// Get user's referral statistics
async function getReferralStats(userId: string): Promise<ReferralStats>

// Get leaderboard
async function getLeaderboard(period: string, limit: number): Promise<LeaderboardEntry[]>
```

---

## Components

### InviteCard

**File:** `src/components/InviteCard.tsx`

Displays referral code with share options:

```tsx
<InviteCard
  referralCode="ABC12345"
  shareUrl="https://string.app/r/ABC12345"
  onShare={handleShare}
/>
```

Features:
- Copy code button
- Share via WhatsApp
- Share via SMS
- QR code display

---

### ReferralStatsCard

**File:** `src/components/ReferralStatsCard.tsx`

Shows referral statistics:

```tsx
<ReferralStatsCard
  totalReferrals={15}
  successfulReferrals={10}
  pointsEarned={500}
  rank={3}
/>
```

---

### ReferralList

**File:** `src/components/ReferralList.tsx`

Lists all referrals:

```tsx
<ReferralList
  referrals={referrals}
  loading={loading}
  onLoadMore={loadMore}
/>
```

---

### ReferralLeaderboardPage

**File:** `src/features/referrals/ReferralLeaderboardPage.tsx`

Full leaderboard page with:
- Top 10 referrers
- Current user's rank
- Period selector (all time, this month, this week)

---

## Referral Code Format

- Length: 8 characters
- Characters: Uppercase letters + numbers (excluding confusing chars: 0, O, I, L)
- Example: `ABC12345`, `XY7K9M2P`

### Generation Logic

```typescript
function generateCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

---

## Notifications

### Referral Signup

Sent to referrer when someone uses their code:

```
Title: "New Referral!"
Message: "John just signed up using your referral code. You'll earn 50 points when they complete their first order!"
```

### Referral Completed

Sent to referrer when referred user completes first order:

```
Title: "Referral Reward!"
Message: "Congratulations! You earned 50 points because John completed their first order."
```

---

## Admin Management

### View Referral Statistics

**Admin Panel:** Admin > Analytics > Referrals

Shows:
- Total referrals (all time / this month)
- Conversion rate
- Top referrers
- Points distributed

### Adjust Referral Rewards

Configuration via environment variables:

```env
REFERRAL_REWARD_POINTS=50
REFERRAL_VOUCHER_VALUE=5
REFERRAL_VOUCHER_VALIDITY_DAYS=30
```

---

## Best Practices

1. **Make sharing easy** - One-tap share buttons
2. **Show progress** - Display pending vs completed referrals
3. **Gamify with leaderboard** - Monthly competitions
4. **Clear communication** - Explain rewards clearly
5. **Fraud prevention** - Validate referrals before rewarding

---

## Fraud Prevention

- Cannot refer yourself (same phone number)
- Referred user must complete a paid order (not package usage)
- Maximum referrals per day: 10
- Account age requirement for referrer: 7 days

---

**End of Referral System Documentation**
