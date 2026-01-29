# Error Codes Reference

**String Service Platform — Error Code Catalog**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Error Response Format

All API errors follow this standard format:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

---

## Authentication Errors (AUTH_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `AUTH_REQUIRED` | 401 | Authentication required | Login or refresh session |
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/phone or password | Check credentials |
| `AUTH_SESSION_EXPIRED` | 401 | Session has expired | Re-login |
| `AUTH_INVALID_TOKEN` | 401 | Invalid or malformed token | Re-login |
| `AUTH_USER_NOT_FOUND` | 404 | User account not found | Register or check email/phone |
| `AUTH_USER_BLOCKED` | 403 | User account is blocked | Contact support |
| `AUTH_RATE_LIMITED` | 429 | Too many login attempts | Wait and retry |
| `AUTH_OTP_INVALID` | 400 | Invalid OTP code | Request new OTP |
| `AUTH_OTP_EXPIRED` | 400 | OTP code has expired | Request new OTP |

---

## Authorization Errors (FORBIDDEN_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `FORBIDDEN_ADMIN_ONLY` | 403 | Admin access required | Contact administrator |
| `FORBIDDEN_OWNER_ONLY` | 403 | Resource owner access only | Verify ownership |
| `FORBIDDEN_ACTION` | 403 | Action not permitted | Check permissions |

---

## Validation Errors (VALIDATION_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `VALIDATION_FAILED` | 400 | Request validation failed | Check request body |
| `VALIDATION_REQUIRED_FIELD` | 400 | Required field missing | Provide required fields |
| `VALIDATION_INVALID_FORMAT` | 400 | Invalid field format | Check field format |
| `VALIDATION_INVALID_EMAIL` | 400 | Invalid email format | Provide valid email |
| `VALIDATION_INVALID_PHONE` | 400 | Invalid phone format | Use E.164 format |
| `VALIDATION_PASSWORD_WEAK` | 400 | Password too weak | Use stronger password |
| `VALIDATION_DUPLICATE` | 409 | Duplicate entry exists | Use different value |

---

## Order Errors (ORDER_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `ORDER_NOT_FOUND` | 404 | Order does not exist | Check order ID |
| `ORDER_ALREADY_CANCELLED` | 400 | Order already cancelled | No action needed |
| `ORDER_ALREADY_COMPLETED` | 400 | Order already completed | No action needed |
| `ORDER_CANNOT_CANCEL` | 400 | Cannot cancel in current status | Check order status |
| `ORDER_INVALID_STATUS` | 400 | Invalid status transition | Check allowed transitions |
| `ORDER_NO_ITEMS` | 400 | Order has no items | Add at least one item |

---

## Payment Errors (PAYMENT_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `PAYMENT_NOT_FOUND` | 404 | Payment not found | Check payment ID |
| `PAYMENT_ALREADY_COMPLETED` | 400 | Payment already processed | No action needed |
| `PAYMENT_ALREADY_REJECTED` | 400 | Payment was rejected | Create new payment |
| `PAYMENT_INVALID_AMOUNT` | 400 | Invalid payment amount | Check amount |
| `PAYMENT_PROOF_REQUIRED` | 400 | Payment proof not uploaded | Upload payment proof |
| `PAYMENT_TIMEOUT` | 400 | Payment timed out | Create new order |

---

## Inventory Errors (INVENTORY_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `INVENTORY_NOT_FOUND` | 404 | String/item not found | Check item ID |
| `INVENTORY_OUT_OF_STOCK` | 400 | Item out of stock | Choose different item |
| `INVENTORY_INSUFFICIENT` | 400 | Not enough stock | Reduce quantity |
| `INVENTORY_INACTIVE` | 400 | Item is inactive | Choose active item |

---

## Package Errors (PACKAGE_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `PACKAGE_NOT_FOUND` | 404 | Package not found | Check package ID |
| `PACKAGE_EXPIRED` | 400 | Package has expired | Purchase new package |
| `PACKAGE_NO_REMAINING` | 400 | No sessions remaining | Purchase new package |
| `PACKAGE_INACTIVE` | 400 | Package is inactive | Choose active package |
| `PACKAGE_ALREADY_OWNED` | 400 | User already owns this | Use existing package |

---

## Voucher Errors (VOUCHER_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `VOUCHER_NOT_FOUND` | 404 | Voucher not found | Check voucher ID |
| `VOUCHER_EXPIRED` | 400 | Voucher has expired | Use different voucher |
| `VOUCHER_ALREADY_USED` | 400 | Voucher already used | Use different voucher |
| `VOUCHER_INVALID` | 400 | Voucher is invalid | Check voucher code |
| `VOUCHER_MIN_ORDER` | 400 | Order below minimum | Increase order amount |
| `VOUCHER_NOT_APPLICABLE` | 400 | Voucher not applicable | Check voucher terms |
| `VOUCHER_INSUFFICIENT_POINTS` | 400 | Not enough points | Earn more points |

---

## Points Errors (POINTS_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `POINTS_INSUFFICIENT` | 400 | Not enough points | Earn more points |
| `POINTS_INVALID_AMOUNT` | 400 | Invalid points amount | Check amount |

---

## Review Errors (REVIEW_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `REVIEW_NOT_FOUND` | 404 | Review not found | Check review ID |
| `REVIEW_ALREADY_EXISTS` | 400 | Review already submitted | Edit existing review |
| `REVIEW_ORDER_NOT_COMPLETE` | 400 | Order not completed | Wait for completion |
| `REVIEW_NOT_OWNER` | 403 | Not review owner | Check ownership |

---

## File Upload Errors (UPLOAD_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `UPLOAD_FILE_TOO_LARGE` | 400 | File exceeds size limit | Use smaller file (max 5MB) |
| `UPLOAD_INVALID_TYPE` | 400 | Invalid file type | Use supported format |
| `UPLOAD_FAILED` | 500 | Upload failed | Retry upload |

---

## System Errors (SYSTEM_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `SYSTEM_ERROR` | 500 | Internal server error | Contact support |
| `SYSTEM_MAINTENANCE` | 503 | System under maintenance | Try again later |
| `SYSTEM_DATABASE_ERROR` | 500 | Database error | Contact support |

---

## Feature Errors (FEATURE_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `FEATURE_DISABLED` | 403 | Feature is disabled | Contact administrator |
| `FEATURE_NOT_AVAILABLE` | 404 | Feature not available | Check feature status |

---

## Rate Limit Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `RATE_LIMITED` | 429 | Too many requests | Wait before retrying |

**Rate Limits:**
- Signup: 5 requests/minute
- OTP Request: 3 requests/minute
- General API: 100 requests/minute

---

## Error Handling Best Practices

### Client-Side

```typescript
async function apiCall(url: string) {
  const response = await fetch(url);
  const data = await response.json();

  if (!data.ok) {
    switch (data.error.code) {
      case 'AUTH_REQUIRED':
        // Redirect to login
        break;
      case 'VALIDATION_FAILED':
        // Show validation errors
        break;
      default:
        // Show generic error message
    }
  }

  return data;
}
```

### Server-Side

```typescript
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    // ... business logic
    return successResponse(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse('VALIDATION_FAILED', error.message, 400);
    }
    return errorResponse('SYSTEM_ERROR', 'An unexpected error occurred', 500);
  }
}
```

---

**End of Error Codes Reference**
