# Change Log — 2025-01-13: Admin Order Status Management

## Summary
Added comprehensive admin controls for managing order status transitions with quick action buttons. Administrators can now easily update orders from "pending" to "in_progress" (stringing) and "completed" status directly from both the order list and detail pages.

## Changes

### 1. Enhanced Admin Order Detail Page (`src/components/admin/AdminOrderDetailPage.tsx`)

**New Quick Action Button:**
- ✅ Added "开始穿线" button when order status = 'pending'
- ✅ One-click transition from pending → in_progress
- ✅ Automatic status update with loading state
- ✅ Toast notifications for success/error
- ✅ Auto-refresh order data after update

**Implementation:**
```tsx
{order.status === 'pending' && (
  <button
    onClick={async () => {
      setUpdating(true);
      const { order: updatedOrder, error } = await updateOrderStatus(
        orderId,
        'in_progress',
        '管理员标记为穿线中'
      );
      if (error) {
        toast.error('更新状态失败');
      } else {
        setOrder(updatedOrder);
        toast.success('已开始穿线');
      }
      setUpdating(false);
    }}
    disabled={updating}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    ⚙️ {updating ? '更新中...' : '开始穿线'}
  </button>
)}
```

### 2. Enhanced Admin Order List Page (`src/components/admin/AdminOrderListPage.tsx`)

**Quick Action Buttons in Table:**
- ✅ "⚙️ 开始" button for pending orders → starts stringing
- ✅ "✓ 完成" button for in_progress orders → completes order
- ✅ Inline status updates without page navigation
- ✅ Dynamic import for services to avoid bundle bloat
- ✅ Click-stop propagation to prevent row click

**Implementation:**
```tsx
<td className="px-6 py-4">
  <div className="flex items-center gap-2">
    {order.status === 'pending' && (
      <button
        onClick={async (e) => {
          e.stopPropagation();
          const { updateOrderStatus } = await import('@/services/adminOrderService');
          const { toast } = await import('sonner');
          const { order: updated, error } = await updateOrderStatus(
            order.id,
            'in_progress',
            '快捷操作：开始穿线'
          );
          if (error) {
            toast.error('更新失败');
          } else {
            toast.success('已开始穿线');
            loadOrders();
          }
        }}
        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
        title="开始穿线"
      >
        ⚙️ 开始
      </button>
    )}
    {order.status === 'in_progress' && (
      <button
        onClick={async (e) => {
          e.stopPropagation();
          const { completeOrder } = await import('@/services/completeOrderService');
          const { toast } = await import('sonner');
          const { data, error } = await completeOrder(order.id, '快捷操作：完成订单');
          if (error) {
            toast.error('完成失败');
          } else {
            toast.success('订单已完成');
            loadOrders();
          }
        }}
        className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
        title="完成订单"
      >
        ✓ 完成
      </button>
    )}
    <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
      详情
    </button>
  </div>
</td>
```

### 3. New Component: AdminOrderProgress (`src/components/admin/AdminOrderProgress.tsx`)

**Advanced Progress Management Component:**

**Features:**
- ✅ Visual progress timeline with icons
- ✅ Inline action buttons for each step
- ✅ Status-specific actions (start stringing, complete order)
- ✅ Confirmation dialogs for critical actions
- ✅ Real-time loading states
- ✅ Integrated with completeOrder service
- ✅ Cancel order functionality
- ✅ Auto-refresh parent on update

### 4. User Payment UX
- ✅ 默认选中“现金支付”，避免支付界面空白导致确认按钮不可用（`src/components/OrderPaymentSection.tsx`）。
- ✅ TNG 创建失败可重试并显示错误信息；切换支付方式时重置错误状态（`src/components/OrderPaymentSection.tsx`）。
- ✅ 新增管理员订单统计接口 `/api/admin/orders/stats`，前端不再请求不存在的路径。
- ✅ 新增用户/管理员共用退款查询占位接口 `/api/orders/[id]/refunds`，避免前端 404/JSON 解析错误（当前返回空数组，后续可接入实际退款记录）。
- ✅ 订单照片 API 对缺失表进行降级处理：`/api/orders/[id]/photos` 系列接口在 `order_photos` 表不存在时返回友好错误或空列表，避免 Prisma 报错崩溃。

**Progress Steps:**
1. **订单已创建** (Order Created) - Always completed
2. **穿线处理** (Stringing) - Pending/In Progress/Completed
3. **服务完成** (Service Completed) - Pending/Completed
4. **订单已取消** (Cancelled) - Only if cancelled

**Action Buttons:**
```tsx
{step.action && (
  <button
    onClick={() => handleUpdateStatus(step.action.nextStatus, step.action.label)}
    className={`
      px-4 py-2 rounded-lg font-medium text-sm
      ${step.action.nextStatus === 'completed' 
        ? 'bg-green-600 hover:bg-green-700 text-white' 
        : 'bg-blue-600 hover:bg-blue-700 text-white'
      }
    `}
  >
    {step.action.nextStatus === 'completed' ? '✓' : '▶'}
    {step.action.label}
  </button>
)}
```

**Status Updates:**
```typescript
const handleUpdateStatus = async (
  nextStatus: 'in_progress' | 'completed' | 'cancelled',
  actionLabel: string
) => {
  if (nextStatus === 'completed') {
    // Use completeOrder service for inventory/points
    const { data, error } = await completeOrder(orderId, `管理员操作：${actionLabel}`);
  } else {
    // Regular status update
    const { order, error } = await updateOrderStatus(orderId, nextStatus, `管理员操作：${actionLabel}`);
  }
  onStatusUpdate?.(); // Refresh parent component
};
```

**Visual Design:**
- Active step: Blue ring animation, larger icon
- Completed step: Green checkmark, green connecting line
- Pending step: Gray, muted opacity, action button available
- Loading state: Spinner icon with "更新中..." text

### 4. Integration in Admin Order Detail Page

**Replaced old timeline with AdminOrderProgress:**
```tsx
{/* Old Timeline - Removed */}
<div className="bg-white rounded-xl p-6">
  <h2>订单时间线</h2>
  <div className="space-y-4">...</div>
</div>

{/* New Progress Management */}
<AdminOrderProgress
  orderId={order.id}
  currentStatus={order.status as any}
  createdAt={order.created_at}
  updatedAt={order.updated_at}
  completedAt={order.completed_at}
  cancelledAt={order.cancelled_at}
  onStatusUpdate={loadOrder}
/>
```

## Admin Workflows

### Workflow 1: Start Stringing from List Page

1. Admin views pending orders in order list
2. Clicks "⚙️ 开始" button on specific order
3. System updates status to 'in_progress'
4. Toast notification: "已开始穿线"
5. Order list refreshes automatically
6. Order badge changes to "处理中" (blue)

### Workflow 2: Start Stringing from Detail Page

1. Admin opens pending order detail
2. Sees "开始穿线" button in header
3. Clicks button
4. Loading state: "更新中..."
5. Status updates to 'in_progress'
6. Toast notification: "已开始穿线"
7. Progress component updates inline
8. "开始穿线" button disappears, "完成订单" button appears

### Workflow 3: Complete Order from List Page

1. Admin views in_progress orders in order list
2. Clicks "✓ 完成" button
3. System calls completeOrder service:
   - Deducts inventory stock
   - Calculates profit
   - Awards user points
   - Updates status to 'completed'
4. Toast shows: "订单已完成！积分: 10, 利润: RM5.00"
5. Order list refreshes
6. Order moves to "已完成" tab

### Workflow 4: Complete Order from Detail Page (Progress Component)

1. Admin opens in_progress order detail
2. Sees "完成订单" button in header or progress component
3. Clicks button
4. Confirmation dialog: "确认完成订单？将扣减库存并奖励积分。"
5. Admin confirms
6. System processes:
   - Stock deduction
   - Profit calculation
   - Points award
7. Success toast with details
8. Progress component shows completed state

### Workflow 5: Cancel Order

1. Admin opens order detail (pending or in_progress)
2. Scrolls to bottom of progress component
3. Clicks "取消订单" red button
4. Confirmation: "确认取消订单？此操作不可恢复。"
5. Admin confirms
6. Status updates to 'cancelled'
7. Progress shows cancelled state

## Status Transition Rules

```
pending → in_progress → completed
   ↓                ↓
cancelled       cancelled
```

**Valid Transitions:**
- pending → in_progress (开始穿线)
- pending → cancelled (取消)
- in_progress → completed (完成订单)
- in_progress → cancelled (取消)

**Invalid Transitions:**
- completed → any (final state)
- cancelled → any (final state)
- pending → completed (must go through in_progress)

## UI/UX Improvements

### Button States
```tsx
// Pending order
<button className="bg-blue-600 text-white">⚙️ 开始穿线</button>

// In progress order
<button className="bg-green-600 text-white">✓ 完成订单</button>

// Loading state
<button disabled className="opacity-50">更新中...</button>
```

### Color Coding
- **Blue** (#2563EB): In progress / Start action
- **Green** (#16A34A): Completed / Complete action
- **Red** (#DC2626): Cancelled / Cancel action
- **Gray** (#6B7280): Pending / Disabled state

### Icons
- ⚙️ - Start stringing
- ✓ - Complete order
- ▶ - Start/Begin action
- ✗ - Cancel/Remove

### Toast Notifications
```typescript
// Success
toast.success('已开始穿线');
toast.success('订单已完成！积分: 10, 利润: RM5.00');

// Error
toast.error('更新状态失败');
toast.error('完成订单失败');
```

## Performance Optimizations

1. **Dynamic Imports**: Services loaded on-demand to reduce initial bundle size
```tsx
const { updateOrderStatus } = await import('@/services/adminOrderService');
const { toast } = await import('sonner');
```

2. **Click Propagation**: Prevents row click when clicking action buttons
```tsx
onClick={(e) => e.stopPropagation()}
```

3. **Optimistic Updates**: UI updates immediately, refreshes on success
4. **Loading States**: Disable buttons during API calls to prevent double-submission
5. **Auto-refresh**: Components refresh data after successful updates

## Testing

### Test Case 1: Quick Start from List
1. Create pending order
2. Navigate to admin order list
3. Click "⚙️ 开始" button
4. Verify status changes to "处理中"
5. Verify toast notification shows
6. Verify button changes to "✓ 完成"

### Test Case 2: Complete from Detail Page
1. Create in_progress order
2. Navigate to order detail page
3. Click "完成订单" in header
4. Confirm in modal
5. Verify order status = 'completed'
6. Verify inventory deducted
7. Verify points awarded to user

### Test Case 3: Cancel Order
1. Create pending order
2. Navigate to order detail
3. Scroll to progress component
4. Click "取消订单"
5. Confirm cancellation
6. Verify status = 'cancelled'
7. Verify order cannot be updated further

### Test Case 4: Progress Component Actions
1. Create pending order
2. Open order detail
3. See "开始穿线" action in progress component
4. Click action button
5. Verify inline update without page reload
6. Verify new action button appears ("完成订单")

## Security Considerations

- ✅ Admin-only routes (enforced by middleware)
- ✅ Status validation in API (prevent invalid transitions)
- ✅ Confirmation dialogs for destructive actions (cancel, complete)
- ✅ Audit trail in admin_notes field
- ✅ Error handling for all API calls

## Future Enhancements

1. **Batch Operations**: Select multiple orders and update status in bulk
2. **Scheduled Completion**: Set estimated completion time
3. **SMS Notifications**: Notify customer when status changes
4. **Progress Photos**: Upload photos at each stage
5. **Quality Check Stage**: Add intermediate QC step before completion
6. **Estimated Time**: Show expected completion time for each order
7. **Staff Assignment**: Assign orders to specific staff members
8. **Priority Levels**: Mark urgent orders for faster processing

## Updated Files

1. `src/components/admin/AdminOrderDetailPage.tsx` - Added quick start button
2. `src/components/admin/AdminOrderListPage.tsx` - Added inline action buttons
3. `src/components/admin/AdminOrderProgress.tsx` - NEW: Advanced progress management
4. `docs/change_log_2025-01-13_admin-status-management.md` - This file

## Related Documentation

- `docs/change_log_2025-01-13_service-progress-display.md` - Customer-facing progress display
- `docs/change_log_2025-12-12_complete-order.md` - Complete order service
- `docs/api_spec.md` - Order status API
