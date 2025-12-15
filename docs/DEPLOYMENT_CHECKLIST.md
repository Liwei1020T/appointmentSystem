# 🚀 Deployment Checklist

**String Service Platform - Manual Payment System**  
**Version:** 1.0  
**Last Updated:** 2025-12-12

---

## 📋 Pre-Deployment Checklist

### 1. Database Migration ✅

- [ ] Run all migrations in `supabase/migrations/` directory
- [ ] Verify `payments` table has new fields:
  - `receipt_url`
  - `receipt_uploaded_at`
  - `verified_by`
  - `verified_at`
  - `admin_notes`
- [ ] Verify new payment status: `pending_verification`
- [ ] Check RLS policies are correctly applied

```sql
-- Verify payments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- Check for pending verification status
SELECT status, COUNT(*) 
FROM payments 
GROUP BY status;
```

---

### 2. Supabase Storage Setup 🗄️

- [ ] Create `receipts` bucket (run `scripts/setup-storage.sql`)
- [ ] Verify bucket is **PRIVATE** (not public)
- [ ] Confirm file size limit: 5MB
- [ ] Verify allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- [ ] Test RLS policies:
  - Users can upload to their own folder
  - Users can view their own receipts
  - Admins can view all receipts

**Quick Test:**
```bash
# In Supabase Dashboard > Storage
1. Go to Storage section
2. Look for "receipts" bucket
3. Try uploading a test image
4. Verify URL structure: receipts/payment-receipts/{userId}/{filename}
```

---

### 3. TNG QR Code Setup 📱

- [ ] Generate real TNG QR code from TNG eWallet app
- [ ] Save as high-quality PNG (recommended: 800x800px)
- [ ] Place file at: `public/images/tng-qr-code.png`
- [ ] Remove or keep placeholder: `tng-qr-code-placeholder.svg`
- [ ] Update merchant phone number in code (if needed)

**File Location:**
```
public/
  images/
    tng-qr-code.png  ← REQUIRED (your actual QR code)
```

---

### 4. Environment Variables 🔐

- [ ] Verify `.env.local` has all required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_MERCHANT_PHONE=+60123456789
NEXT_PUBLIC_MERCHANT_NAME=Your Business Name

# Payment Configuration
NEXT_PUBLIC_TNG_QR_PATH=/images/tng-qr-code.png
```

- [ ] For production, set environment variables in hosting platform (Vercel/Netlify)

---

### 5. Code Configuration ⚙️

**Update TngQRCodeDisplay.tsx:**

- [ ] Verify `qrCodeUrl` points to correct image path
- [ ] Update `merchantPhone` with actual contact number
- [ ] Update `merchantName` (optional)

**Update PaymentReceiptUploader.tsx:**

- [ ] Verify Supabase storage bucket name: `receipts`
- [ ] Check upload path: `payment-receipts/{userId}/{timestamp}-{filename}`
- [ ] Confirm file size limit matches backend (5MB)

**Update PaymentReceiptVerifier.tsx:**

- [ ] Verify admin-only access
- [ ] Test approve/reject functionality
- [ ] Check notification integration (if enabled)

---

### 6. Frontend Build & Test 🧪

- [ ] Run production build: `npm run build`
- [ ] Fix any TypeScript errors
- [ ] Fix any ESLint warnings
- [ ] Test on mobile devices (responsive design)
- [ ] Test on different browsers (Chrome, Safari, Firefox)

```bash
npm run build
npm run start
```

---

### 7. User Flow Testing 👤

**Customer Journey:**

- [ ] Create test order
- [ ] Navigate to payment section
- [ ] See TNG QR code displayed correctly
- [ ] Can scan QR code with TNG app
- [ ] Upload payment receipt (test various formats: JPG, PNG, PDF)
- [ ] Verify receipt uploaded successfully
- [ ] Check payment status shows "pending_verification"
- [ ] Receive confirmation message

**Admin Journey:**

- [ ] Login to admin dashboard
- [ ] Navigate to orders with pending payment verification
- [ ] View uploaded receipt (image preview works)
- [ ] Approve receipt
- [ ] Verify order status changes to "confirmed"
- [ ] Verify payment status changes to "completed"
- [ ] Test rejecting a receipt
- [ ] Verify user is notified (if notifications enabled)

---

### 8. Database Verification 🗃️

After completing test transactions:

```sql
-- Check payment records
SELECT 
  id,
  order_id,
  amount,
  status,
  receipt_url,
  receipt_uploaded_at,
  verified_by,
  verified_at,
  admin_notes,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 10;

-- Check orders status sync
SELECT 
  o.id,
  o.status,
  p.status as payment_status,
  p.receipt_url IS NOT NULL as has_receipt
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id
ORDER BY o.created_at DESC
LIMIT 10;
```

---

### 9. Security Audit 🔒

- [ ] RLS policies prevent unauthorized access
- [ ] Receipts are private (not publicly accessible)
- [ ] Only admins can verify/reject receipts
- [ ] Users cannot modify payment status directly
- [ ] File upload has size and type restrictions
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)

---

### 10. Performance Check ⚡

- [ ] Image loading optimized (use Next.js Image component)
- [ ] Receipt upload shows progress indicator
- [ ] Admin dashboard loads quickly
- [ ] Receipt preview doesn't block UI
- [ ] Database queries are indexed properly

---

### 11. Error Handling 🚨

Test edge cases:

- [ ] Upload fails (network error)
- [ ] File too large (>5MB)
- [ ] Invalid file type (e.g., .exe)
- [ ] Missing QR code image
- [ ] Admin verifies already-verified payment
- [ ] User tries to upload receipt twice
- [ ] Payment without associated order

---

### 12. Documentation 📚

- [ ] README updated with new payment flow
- [ ] API documentation reflects new endpoints
- [ ] Change log created/updated
- [ ] Component documentation complete
- [ ] Deployment guide available

---

## 🎯 Go-Live Checklist

### Final Steps Before Launch:

1. **Backup Database**
   ```sql
   -- Create backup before major release
   pg_dump -h your-db-host -U postgres -d your-db > backup-$(date +%Y%m%d).sql
   ```

2. **Monitor Logs**
   - Set up error tracking (Sentry, LogRocket, etc.)
   - Monitor Supabase logs
   - Set up alerts for failed payments

3. **Customer Communication**
   - Notify users about new payment method
   - Provide clear instructions
   - Set up support channel for payment issues

4. **Rollback Plan**
   - Keep old payment code in git history
   - Document rollback procedure
   - Have database migration rollback script ready

---

## 📊 Post-Deployment Monitoring

### Week 1:

- [ ] Monitor payment success rate
- [ ] Track receipt upload failures
- [ ] Check admin verification time
- [ ] Collect user feedback
- [ ] Review error logs daily

### Week 2-4:

- [ ] Analyze payment completion time
- [ ] Optimize slow queries
- [ ] Add missing features based on feedback
- [ ] Update documentation with learnings

---

## 🆘 Troubleshooting

### Common Issues:

**QR Code Not Displaying:**
- Check file exists at `public/images/tng-qr-code.png`
- Verify file permissions
- Clear browser cache
- Check Next.js static file serving

**Receipt Upload Fails:**
- Verify Supabase storage bucket exists
- Check RLS policies
- Verify user authentication
- Check file size/type restrictions

**Admin Cannot See Receipts:**
- Verify admin role in database
- Check RLS policies for admin access
- Clear storage cache
- Check Supabase storage URL

**Payment Status Not Updating:**
- Check order-payment relationship
- Verify trigger functions
- Check RLS policies on orders table
- Review Edge Function logs

---

## ✅ Sign-Off

- [ ] Development team tested
- [ ] QA team approved
- [ ] Product owner approved
- [ ] Security review passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Stakeholders notified

**Deployed By:** _______________  
**Date:** _______________  
**Version:** _______________

---

**🎉 Ready for Production!**
