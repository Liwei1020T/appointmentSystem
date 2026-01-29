# Payment System

**String Service Platform — Payment Processing Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The payment system supports multiple payment methods for orders and package purchases. Currently supported methods include TNG eWallet and cash payments, with plans for additional payment gateways.

---

## Supported Payment Methods

| Method | Code | Description | Status |
|--------|------|-------------|--------|
| TNG eWallet | `tng` | Touch 'n Go eWallet QR payment | Active |
| Cash | `cash` | In-person cash payment | Active |
| FPX | `fpx` | Online banking (Malaysia) | Planned |
| Card | `card` | Credit/Debit card | Planned |

---

## Payment Flow

### TNG Payment Flow

```
1. User creates order
2. User selects TNG as payment method
3. System creates payment record (status: pending)
4. User sees TNG QR code and payment instructions
5. User makes payment in TNG app
6. User uploads payment screenshot as proof
7. Payment status → pending_verification
8. Admin verifies payment proof
9. Admin approves → status: success
   OR Admin rejects → status: rejected
10. Order proceeds or user notified of rejection
```

### Cash Payment Flow

```
1. User creates order
2. User selects Cash as payment method
3. System creates payment record (status: pending)
4. User brings cash to shop
5. Admin receives cash and verifies amount
6. Admin marks payment as verified
7. Payment status → success
8. Order proceeds
```

---

## API Endpoints

### Create Payment

**Endpoint:** `POST /api/payments`
**Auth Required:** Yes

**Request Body:**

```json
{
  "orderId": "order-uuid",
  "paymentMethod": "tng",
  "amount": 56.00
}
```

Or for package purchase:

```json
{
  "packageId": "package-uuid",
  "paymentMethod": "tng",
  "amount": 120.00
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "payment-uuid",
    "amount": 56.00,
    "status": "pending",
    "paymentMethod": "tng",
    "createdAt": "2026-01-27T10:00:00Z"
  }
}
```

---

### Create Cash Payment

**Endpoint:** `POST /api/payments/cash`
**Auth Required:** Yes

**Request Body:**

```json
{
  "orderId": "order-uuid",
  "amount": 56.00
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "payment-uuid",
    "amount": 56.00,
    "status": "pending",
    "paymentMethod": "cash"
  }
}
```

---

### Upload Payment Proof

**Endpoint:** `POST /api/payments/{id}/proof`
**Auth Required:** Yes
**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `proof` | File | Yes | Payment screenshot |

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "payment-uuid",
    "proofUrl": "/uploads/payments/proof-123.jpg",
    "status": "pending_verification"
  }
}
```

---

### Upload Receipt URL

**Endpoint:** `POST /api/payments/{id}/receipt`
**Auth Required:** Yes

**Request Body:**

```json
{
  "receiptUrl": "https://cdn.example.com/receipt.jpg"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "payment-uuid",
    "receiptUrl": "https://...",
    "status": "pending_verification"
  }
}
```

---

### Get Payment Details

**Endpoint:** `GET /api/payments/{id}`
**Auth Required:** Yes (owner or admin)

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "payment-uuid",
    "amount": 56.00,
    "status": "pending_verification",
    "paymentMethod": "tng",
    "proofUrl": "/uploads/payments/proof-123.jpg",
    "order": {
      "id": "order-uuid",
      "status": "pending_payment"
    },
    "createdAt": "2026-01-27T10:00:00Z",
    "updatedAt": "2026-01-27T10:15:00Z"
  }
}
```

---

### Verify Payment (Admin)

**Endpoint:** `POST /api/payments/{id}/verify`
**Auth Required:** Yes (Admin only)

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "payment-uuid",
    "status": "success",
    "verifiedBy": "admin-uuid",
    "verifiedAt": "2026-01-27T11:00:00Z"
  }
}
```

**Side Effects:**
- Order status updated to `confirmed`
- For package: UserPackage created
- Points awarded to user
- Notification sent to user

---

### Reject Payment (Admin)

**Endpoint:** `POST /api/payments/{id}/reject`
**Auth Required:** Yes (Admin only)

**Request Body:**

```json
{
  "reason": "Payment amount does not match order total"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "payment-uuid",
    "status": "rejected",
    "rejectionReason": "Payment amount does not match order total"
  }
}
```

---

### Get Pending Payments (Admin)

**Endpoint:** `GET /api/admin/payments/pending`
**Auth Required:** Yes (Admin only)

**Response:**

```json
{
  "ok": true,
  "data": {
    "payments": [
      {
        "id": "payment-uuid",
        "amount": 56.00,
        "status": "pending_verification",
        "paymentMethod": "tng",
        "proofUrl": "/uploads/payments/proof-123.jpg",
        "user": {
          "id": "user-uuid",
          "fullName": "John Doe",
          "phone": "+60123456789"
        },
        "order": {
          "id": "order-uuid",
          "itemCount": 2
        },
        "createdAt": "2026-01-27T10:00:00Z"
      }
    ],
    "total": 5
  }
}
```

---

## Database Schema

### Payment Table

```prisma
model Payment {
  id              String    @id @default(cuid())
  orderId         String?
  packageId       String?
  userId          String
  amount          Float
  paymentMethod   String    // tng, cash, fpx, card
  status          String    @default("pending")
  transactionId   String?
  proofUrl        String?
  receiptUrl      String?
  rejectionReason String?
  verifiedBy      String?
  verifiedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  order           Order?    @relation(fields: [orderId], references: [id])
  user            User      @relation(fields: [userId], references: [id])

  @@map("payments")
}
```

### Payment Status Flow

```
pending → pending_verification → success
                              ↘ rejected

pending → success (for cash, verified in person)
       ↘ expired (timeout)
       ↘ cancelled
```

---

## Components

### PaymentPage

**File:** `src/components/payment/PaymentPage.tsx`

Main payment flow component:

```tsx
<PaymentPage
  orderId="order-uuid"
  amount={56.00}
  onComplete={handleComplete}
/>
```

Features:
- Payment method selection
- TNG QR code display
- Receipt upload
- Status tracking

---

### TngQRCodeDisplay

**File:** `src/components/TngQRCodeDisplay.tsx`

Displays TNG payment QR code:

```tsx
<TngQRCodeDisplay
  amount={56.00}
  referenceId="order-uuid"
/>
```

Features:
- QR code image
- Payment amount display
- Copy reference number
- Upload proof button

---

### PaymentReceiptUploader

**File:** `src/components/PaymentReceiptUploader.tsx`

Receipt upload component:

```tsx
<PaymentReceiptUploader
  paymentId="payment-uuid"
  onUploadComplete={handleUploadComplete}
/>
```

Features:
- Drag-and-drop upload
- Image preview
- Upload progress
- Error handling

---

### PaymentReceiptVerifier (Admin)

**File:** `src/components/admin/PaymentReceiptVerifier.tsx`

Admin verification interface:

```tsx
<PaymentReceiptVerifier
  payment={payment}
  onVerify={handleVerify}
  onReject={handleReject}
/>
```

Features:
- Receipt image viewer with zoom
- User and order details
- Approve/Reject buttons
- Rejection reason input

---

## Service Implementation

**File:** `src/services/paymentService.ts`

### Key Functions

```typescript
// Create payment record
async function createPayment(data: CreatePaymentInput): Promise<Payment>

// Upload proof image
async function uploadProof(
  paymentId: string,
  file: File
): Promise<Payment>

// Verify payment (admin)
async function verifyPayment(
  paymentId: string,
  adminId: string
): Promise<Payment>

// Reject payment (admin)
async function rejectPayment(
  paymentId: string,
  reason: string
): Promise<Payment>

// Handle payment success side effects
async function handlePaymentSuccess(payment: Payment): Promise<void>
```

---

## TNG Integration

**File:** `src/services/tngPaymentService.ts`

### Configuration

```env
TNG_MERCHANT_ID=your_merchant_id
TNG_API_KEY=your_api_key
TNG_QR_CODE_URL=https://cdn.example.com/tng-qr.png
TNG_CALLBACK_SECRET=webhook_secret
```

### Callback Endpoint

**Endpoint:** `POST /api/payments/tng/callback`
**Auth Required:** Signature verification

**Request Body (from TNG):**

```json
{
  "transactionId": "TNG123456",
  "referenceId": "order-uuid",
  "amount": 56.00,
  "status": "success",
  "timestamp": "2026-01-27T10:30:00Z",
  "signature": "hmac_signature"
}
```

**Signature Verification:**

```typescript
function verifySignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.TNG_CALLBACK_SECRET!)
    .update(payload)
    .digest('hex');
  return signature === expected;
}
```

---

## Payment Timeout

Orders auto-cancel if payment not received within timeout period.

### Configuration

```env
ORDER_PAYMENT_TIMEOUT_HOURS=24
```

### Timeout Logic

Handled by cron job (`/api/admin/cron/order-automation`):

1. Find orders with `status = 'pending_payment'`
2. Check if `createdAt + TIMEOUT < now()`
3. Cancel order and restore voucher/package

---

## Notifications

### Payment Received

```
Title: "Payment Received"
Message: "Your payment of RM 56.00 for Order #12345 has been verified."
```

### Payment Rejected

```
Title: "Payment Issue"
Message: "Your payment for Order #12345 could not be verified. Reason: Amount mismatch. Please contact support."
```

### Payment Reminder

```
Title: "Complete Your Payment"
Message: "Your order #12345 is awaiting payment. Complete within 24 hours to avoid cancellation."
```

---

## Admin Workflow

### Verifying Payments

1. Go to **Admin > Payments > Pending**
2. Review payment proof image
3. Compare amount with order total
4. Check user details
5. Click **Verify** to approve or **Reject** with reason

### Best Practices

- Verify payments within 1 hour of submission
- Always provide clear rejection reasons
- Contact user if proof is unclear
- Log all verification actions

---

## Security Considerations

1. **Proof Image Validation** - Validate file type and size
2. **Amount Verification** - Always compare proof amount with order
3. **Duplicate Prevention** - Check for duplicate payments
4. **Callback Security** - Verify webhook signatures
5. **Access Control** - Only admins can verify/reject

---

## Error Handling

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `PAYMENT_NOT_FOUND` | Payment doesn't exist | Check payment ID |
| `PAYMENT_ALREADY_COMPLETED` | Already verified | No action needed |
| `PAYMENT_ALREADY_REJECTED` | Already rejected | Create new payment |
| `PAYMENT_PROOF_REQUIRED` | Proof not uploaded | Upload proof first |
| `PAYMENT_INVALID_AMOUNT` | Amount mismatch | Verify correct amount |

---

**End of Payment System Documentation**
