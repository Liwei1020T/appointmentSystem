# 🧪 Manual Payment System - Testing Guide

**String Service Platform**
**Feature:** Manual Payment with Receipt Upload
**Version:** 1.0
**Date:** 2026-01-27

---

## 📋 Overview

This guide provides comprehensive test cases for the manual payment system where:
1. Customer views TNG QR code
2. Customer scans and pays via TNG eWallet
3. Customer uploads payment receipt
4. Admin reviews and verifies receipt
5. System confirms order automatically

---

## 🎯 Test Scenarios

### Scenario 1: Happy Path - Successful Payment Flow

**Objective:** Complete end-to-end payment flow without errors

**Preconditions:**
- User is registered and logged in
- TNG QR code image exists at `public/images/tng-qr-code.png`
- Supabase storage bucket `receipts` is configured
- User has at least RM 20 in TNG eWallet

**Steps:**

1. **Create Order (Customer)**
   - Go to booking page
   - Select string type, tension, time slot
   - Click "Book Now"
   - Expected: Order created with status `pending`

2. **View Payment Details**
   - Navigate to order detail page
   - Expected: See TNG QR code displayed
   - Expected: See payment instructions
   - Expected: See upload receipt section

3. **Make Payment (External - TNG App)**
   - Open TNG eWallet app
   - Scan the displayed QR code
   - Enter amount (verify matches order total)
   - Complete payment
   - Take screenshot of success confirmation

4. **Upload Receipt**
   - Return to web app
   - Click "Upload Receipt" or drag-and-drop
   - Select screenshot from step 3
   - Click "Submit"
   - Expected: Upload progress shown
   - Expected: Success message displayed
   - Expected: Receipt preview shown
   - Expected: Payment status = `pending_verification`

5. **Verify as Admin**
   - Logout from customer account
   - Login as admin
   - Navigate to Orders > Pending Verification
   - Expected: See the order in list
   - Click on the order
   - Expected: See receipt image preview
   - Click "Approve Payment"
   - Expected: Confirmation modal
   - Confirm approval
   - Expected: Success message
   - Expected: Payment status = `completed`
   - Expected: Order status = `confirmed` or `in_progress`

6. **Verify Customer View**
   - Logout from admin
   - Login as customer
   - Go to My Orders
   - Expected: Order status updated
   - Expected: Payment marked as completed

**Expected Results:**
- ✅ All steps complete without errors
- ✅ Payment status transitions correctly
- ✅ Receipt is stored and viewable
- ✅ Order status syncs with payment

---

### Scenario 2: Upload Different File Formats

**Objective:** Test file type validation

**Test Cases:**

| File Type | File Name | Expected Result |
|-----------|-----------|-----------------|
| JPG | `receipt.jpg` | ✅ Upload success |
| JPEG | `receipt.jpeg` | ✅ Upload success |
| PNG | `receipt.png` | ✅ Upload success |
| WEBP | `receipt.webp` | ✅ Upload success |
| PDF | `receipt.pdf` | ✅ Upload success |
| GIF | `receipt.gif` | ❌ Upload rejected |
| BMP | `receipt.bmp` | ❌ Upload rejected |
| SVG | `receipt.svg` | ❌ Upload rejected |
| TXT | `receipt.txt` | ❌ Upload rejected |
| EXE | `virus.exe` | ❌ Upload rejected |

**Steps for Each:**
1. Attempt to upload file
2. Verify acceptance/rejection
3. Check error message (if rejected)

**Expected:**
- Only allowed MIME types succeed
- Clear error message for rejected files

---

### Scenario 3: File Size Validation

**Objective:** Test file size limits

**Test Cases:**

| File Size | Expected Result |
|-----------|-----------------|
| 100 KB | ✅ Upload success |
| 1 MB | ✅ Upload success |
| 3 MB | ✅ Upload success |
| 4.9 MB | ✅ Upload success |
| 5.1 MB | ❌ Upload rejected (exceeds 5MB limit) |
| 10 MB | ❌ Upload rejected |

**Steps:**
1. Create test images of various sizes
2. Attempt upload for each
3. Verify size validation

**Expected:**
- Files ≤ 5MB accepted
- Files > 5MB rejected with clear message

---

### Scenario 4: Admin Rejects Receipt

**Objective:** Test rejection flow

**Steps:**

1. Customer uploads receipt
2. Admin reviews receipt
3. Admin clicks "Reject Payment"
4. Admin enters rejection reason: "Receipt is unclear, please re-upload"
5. Admin confirms rejection

**Expected Results:**
- Payment status = `failed`
- Order status remains `pending`
- Customer can see rejection reason
- Customer can upload new receipt
- Admin notes saved to database

**Verification Queries:**
```sql
SELECT 
  id, 
  status, 
  admin_notes,
  verified_by,
  verified_at
FROM payments
WHERE id = 'test-payment-id';
```

---

### Scenario 5: Multiple Receipt Uploads

**Objective:** Test re-upload functionality

**Steps:**

1. Upload receipt (first attempt)
2. Receipt gets rejected by admin
3. Upload new receipt (second attempt)
4. Admin approves second receipt

**Expected:**
- Old receipt URL replaced by new one
- Only latest receipt shown in admin panel
- Upload history tracked (optional)

---

### Scenario 6: Concurrent Admin Actions

**Objective:** Test race conditions

**Steps:**

1. Two admins open same pending payment
2. Admin A clicks "Approve"
3. Admin B clicks "Approve" simultaneously
4. Expected: Only one approval succeeds
5. Expected: Second admin sees "Already verified" message

---

### Scenario 7: Missing QR Code Image

**Objective:** Test graceful degradation

**Steps:**

1. Remove `public/images/tng-qr-code.png`
2. Customer navigates to payment page
3. Expected: Fallback message shown
4. Expected: Alternative payment instructions
5. Expected: No broken image icon

**Suggested Fallback:**
```
"QR code temporarily unavailable. 
Please contact support for payment details."
```

---

### Scenario 8: Network Failure During Upload

**Objective:** Test error handling

**Steps:**

1. Start uploading receipt
2. Disable network (simulate connection loss)
3. Expected: Upload fails with timeout
4. Expected: Clear error message
5. Re-enable network
6. Retry upload
7. Expected: Upload succeeds

---

### Scenario 9: Unauthorized Access Attempts

**Objective:** Test security and RLS policies

**Test Cases:**

| Action | User | Expected |
|--------|------|----------|
| View another user's receipt | Customer A | ❌ Denied (403) |
| Verify payment | Customer | ❌ Denied (403) |
| Access receipts bucket directly | Unauthenticated | ❌ Denied (401) |
| View all receipts | Admin | ✅ Allowed |
| Approve payment | Admin | ✅ Allowed |
| Delete receipt | Customer (own) | ✅ Allowed |
| Delete receipt | Customer (other's) | ❌ Denied |

---

### Scenario 10: Mobile Device Testing

**Objective:** Test on mobile browsers

**Devices to Test:**
- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)

**Test Points:**
- QR code displays correctly
- Camera/photo library access for upload
- Touch interactions work
- Responsive layout
- Image preview on mobile

---

## 🔍 Database Verification

After each test scenario, verify database state:

### Check Payment Record
```sql
SELECT 
  id,
  order_id,
  amount,
  status,
  payment_method,
  receipt_url,
  receipt_uploaded_at,
  verified_by,
  verified_at,
  admin_notes,
  created_at,
  updated_at
FROM payments
WHERE order_id = 'YOUR_ORDER_ID';
```

### Check Order Status Sync
```sql
SELECT 
  o.id as order_id,
  o.status as order_status,
  o.total_price,
  p.id as payment_id,
  p.status as payment_status,
  p.receipt_url IS NOT NULL as has_receipt
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id
WHERE o.id = 'YOUR_ORDER_ID';
```

### Check Storage Records
```sql
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at
FROM storage.objects
WHERE bucket_id = 'receipts'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📊 Test Metrics

Track these metrics during testing:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Receipt upload success rate | >95% | ___ | ___ |
| Upload time (avg) | <5s | ___ | ___ |
| Admin verification time | <30s | ___ | ___ |
| End-to-end completion time | <5min | ___ | ___ |
| Error rate | <5% | ___ | ___ |
| Mobile usability score | >8/10 | ___ | ___ |

---

## ✅ Test Checklist

### Functional Tests
- [ ] Happy path completes successfully
- [ ] File type validation works
- [ ] File size validation works
- [ ] Admin can approve receipt
- [ ] Admin can reject receipt
- [ ] Re-upload after rejection works
- [ ] Payment status updates correctly
- [ ] Order status syncs with payment

### Security Tests
- [ ] RLS policies enforced
- [ ] Unauthorized access blocked
- [ ] File type restrictions enforced
- [ ] SQL injection prevented
- [ ] XSS prevention verified

### UX Tests
- [ ] QR code displays clearly
- [ ] Upload UI is intuitive
- [ ] Error messages are helpful
- [ ] Loading states shown
- [ ] Success confirmations clear
- [ ] Mobile experience smooth

### Performance Tests
- [ ] Upload completes in <5s
- [ ] Image preview loads quickly
- [ ] Admin dashboard responsive
- [ ] No memory leaks
- [ ] Database queries optimized

---

## 🐛 Bug Report Template

When you find a bug, use this template:

```markdown
## Bug Report

**Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Environment:**
- Browser: 
- Device: 
- OS: 
- User Role: Customer / Admin

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshots:**
[Attach if applicable]

**Console Errors:**
```
[Paste console output]
```

**Database State:**
```sql
-- Relevant query results
```

**Additional Notes:**
```

---

## 📝 Test Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Environment:** Development / Staging / Production  
**Test Coverage:** _____ %  
**Pass Rate:** _____ %  

**Critical Issues Found:** _____  
**Blockers:** _____  

**Recommendation:**
- [ ] Ready for production
- [ ] Requires fixes before deployment
- [ ] Additional testing needed

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Happy Testing! 🎉**
