# Cron Jobs Documentation

**String Service Platform — Automated Task Reference**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The platform uses scheduled cron jobs to automate critical business processes. These jobs run via API route handlers and should be triggered by an external scheduler (e.g., Vercel Cron, GitHub Actions, or a dedicated cron service).

---

## Available Cron Jobs

### 1. Order Automation

**Endpoint:** `POST /api/admin/cron/order-automation`
**Schedule:** Every 5 minutes (recommended)
**Auth Required:** Admin or cron secret

**Purpose:**
- Auto-cancel orders that exceed payment timeout (default: 24 hours)
- Restore vouchers and package sessions for cancelled orders
- Send cancellation notifications to users

**Business Logic:**

```
1. Find orders with status = 'pending_payment'
2. Check if created_at + PAYMENT_TIMEOUT < now()
3. For each expired order:
   a. Update status to 'cancelled'
   b. If voucher was applied, restore it to 'active'
   c. If package session was used, increment remaining count
   d. Create notification for user
   e. Log cancellation in order_status_logs
```

**Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `ORDER_PAYMENT_TIMEOUT_HOURS` | Hours before auto-cancel | 24 |
| `CRON_SECRET` | Secret for cron authentication | - |

**Request Example:**

```bash
curl -X POST https://your-domain.com/api/admin/cron/order-automation \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "processed": 3,
    "cancelled": 2,
    "vouchersRestored": 1,
    "packagesRestored": 1
  }
}
```

---

### 2. Package Renewal Reminders

**Endpoint:** `POST /api/admin/cron/package-renewal`
**Schedule:** Daily at 9:00 AM
**Auth Required:** Admin or cron secret

**Purpose:**
- Send expiration reminders for packages expiring soon
- Notify users 7 days and 1 day before expiration

**Business Logic:**

```
1. Find user_packages where:
   - expiry BETWEEN now() AND now() + 7 days
   - status = 'active'
   - remaining > 0
2. For each package:
   - Check if reminder already sent (via notification log)
   - Create notification with expiry warning
   - Optionally send SMS
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "remindersSent": 5,
    "expiringIn7Days": 3,
    "expiringIn1Day": 2
  }
}
```

---

### 3. Order Cleanup

**Endpoint:** `POST /api/cron/cleanup-orders`
**Schedule:** Daily at 2:00 AM
**Auth Required:** Cron secret

**Purpose:**
- Clean up old draft orders that were never submitted
- Archive old completed orders (optional)
- Clean up orphaned payment records

**Business Logic:**

```
1. Find orders where:
   - status = 'draft'
   - created_at < now() - 7 days
2. Delete these orders and related records
3. Find payments where:
   - status = 'pending'
   - created_at < now() - 7 days
   - No associated order
4. Mark these payments as 'expired'
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "draftsDeleted": 10,
    "paymentsExpired": 3
  }
}
```

---

## Cron Schedule Setup

### Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/cron/order-automation",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/admin/cron/package-renewal",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/cleanup-orders",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### GitHub Actions

Create `.github/workflows/cron.yml`:

```yaml
name: Scheduled Tasks

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  order-automation:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Order Automation
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/admin/cron/order-automation \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Authentication

Cron endpoints require authentication via one of:

1. **Admin Session** - For manual triggers from admin panel
2. **Cron Secret** - For automated schedulers

**Header Format:**

```
Authorization: Bearer <CRON_SECRET>
```

**Route Handler Implementation:**

```typescript
// src/app/api/admin/cron/order-automation/route.ts
export async function POST(request: Request) {
  // Check cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    // Fall back to admin session check
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return errorResponse('AUTH_REQUIRED', 'Unauthorized', 401);
    }
  }

  // Process cron job...
}
```

---

## Monitoring

### Logging

All cron jobs log their execution:

```typescript
console.info('[CRON] Order automation started', { timestamp: new Date() });
console.info('[CRON] Order automation completed', {
  processed: 10,
  cancelled: 2,
  duration: '1.2s'
});
```

### Health Checks

Monitor cron execution via:

1. **Admin Dashboard** - Shows last cron execution time
2. **Logs** - Review server logs for execution details
3. **Alerts** - Set up alerts for failed cron jobs

### Metrics to Track

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `cron.order_automation.cancelled` | Orders auto-cancelled | > 10 per hour |
| `cron.order_automation.duration` | Execution time | > 30 seconds |
| `cron.package_renewal.reminders` | Reminders sent | Monitor trend |
| `cron.cleanup.deleted` | Records cleaned up | > 100 per day |

---

## Troubleshooting

### Cron Not Running

1. **Check scheduler configuration** - Verify cron schedule syntax
2. **Check authentication** - Verify `CRON_SECRET` is set
3. **Check logs** - Review server logs for errors
4. **Manual trigger** - Try triggering manually from admin panel

### Orders Not Being Cancelled

1. **Check timeout configuration** - Verify `ORDER_PAYMENT_TIMEOUT_HOURS`
2. **Check order status** - Only `pending_payment` orders are processed
3. **Check cron frequency** - Ensure job runs frequently enough

### Duplicate Notifications

1. **Check notification log** - Verify duplicate prevention logic
2. **Review notification queries** - Ensure proper filtering

---

## Best Practices

1. **Idempotency** - All cron jobs should be idempotent (safe to run multiple times)
2. **Error Handling** - Log errors but don't fail entire batch for single item failure
3. **Rate Limiting** - Limit notifications sent per run to avoid spam
4. **Monitoring** - Set up alerts for failed cron jobs
5. **Testing** - Test cron logic with unit tests before deployment

---

**End of Cron Jobs Documentation**
