# Change Log — 2025-12-23 Multi-Racket Order Enhancements

## Summary

Comprehensive improvements to multi-racket order handling, admin order management UI, and user experience enhancements across the String Service platform.

---

## 🆕 New Features

### 1. Multi-Racket Order Admin Display
- **Admin Order List**: Now displays "🎾 多球拍订单" with racket count for multi-racket orders
- **Admin Order Detail**: Shows each racket item with photo, string info, tension settings, and individual price
- **User Order List**: Updated to show multi-racket order summaries with racket count

### 2. Custom Confirmation Modal
- Replaced browser native `confirm()` dialogs with beautifully designed custom modal
- Features backdrop blur, animated transitions, and color-coded action buttons
- Applied to: start stringing, complete order, and cancel order actions

---

## 🔧 Bug Fixes

### 1. Multi-Racket Order Completion (`completeOrderAction`)
- **Problem**: Multi-racket orders failed to complete due to `stringId` being null
- **Solution**: Added detection for multi-racket orders (check `items` array) and skip single-racket validation
- **File**: `src/actions/orders.actions.ts`

### 2. Service Progress Time Display
- **Problem**: Timestamps showed "-" instead of actual dates
- **Solution**: 
  - Improved `formatDate()` function to handle multiple date formats
  - Fixed camelCase vs snake_case property access for date fields
  - Added time format (HH:mm) to progress timestamps
- **Files**: `src/lib/utils.ts`, `src/components/admin/AdminOrderProgress.tsx`, `src/components/admin/AdminOrderDetailPage.tsx`

### 3. User Order List Multi-Racket Display
- **Problem**: Multi-racket orders showed empty tension and missing string info
- **Solution**: Added conditional rendering for multi-racket orders in `OrderList.tsx`
- **File**: `src/features/orders/OrderList.tsx`

---

## 🗑️ Removed Features

### 1. Payment Confirmation Buttons (Admin Order Detail)
- Removed "确认收款" button
- Removed "确认TNG收款" button  
- Removed "💵 现金待收款" badge
- **Reason**: Simplified admin workflow, payment confirmation handled elsewhere

### 2. Auto-Start Stringing After Payment Confirmation
- Removed automatic order status change to `in_progress` when payment is confirmed
- Admin now manually clicks "开始穿线" button to start stringing
- **Files**: `src/actions/payments.actions.ts` (lines 234-236, 389-391)

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `src/actions/orders.actions.ts` | Multi-racket order completion logic, include items in queries |
| `src/actions/admin-orders.actions.ts` | Include items in admin order queries |
| `src/actions/payments.actions.ts` | Remove auto-start stringing logic |
| `src/components/admin/AdminOrderListPage.tsx` | Multi-racket display in order list |
| `src/components/admin/AdminOrderDetailPage.tsx` | Multi-racket items display, remove payment buttons |
| `src/components/admin/AdminOrderProgress.tsx` | Custom confirmation modal, datetime format |
| `src/features/orders/OrderList.tsx` | Multi-racket order cards |
| `src/lib/utils.ts` | Improved `formatDate()` function |

---

## 🧪 Testing

### Manual Tests Performed
1. ✅ Create multi-racket order with 2+ rackets
2. ✅ View multi-racket order in admin list (shows "多球拍订单")
3. ✅ View multi-racket order detail (shows each racket item)
4. ✅ Complete multi-racket order without errors
5. ✅ User order list shows multi-racket summary
6. ✅ Service progress shows date and time correctly
7. ✅ Custom confirmation modal appears on action buttons

### Test Cases
```
Scenario: Admin completes multi-racket order
Given: Order has 2 rackets with different strings
When: Admin clicks "完成订单"
Then: Order completes successfully with points awarded
And: No stock deduction (handled during creation)
```

---

## 📝 Notes

- Multi-racket orders have `stringId = null` in the main order record
- Stock deduction for multi-racket orders is handled during `createMultiRacketOrderAction`
- The `items` relation uses `as any` type assertion until `prisma generate` is run

---

## 🔮 Future Improvements

1. Add `inProgressAt` field to track exact stringing start time
2. Run `prisma generate` to remove type assertions
3. Consider adding progress percentage for multi-racket orders
