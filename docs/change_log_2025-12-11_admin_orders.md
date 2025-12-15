# Change Log — 2025-12-11 (Phase 3.2)

## Summary

Phase 3.2 实现完成：管理员订单管理系统

新增功能：
- 订单管理服务（查询、筛选、搜索、状态更新）
- 订单列表页面（状态筛选、搜索、分页）
- 订单详情页面（完整信息、状态更新）
- 订单统计（今日/总订单、营业额）

## New Files Created

### Services

#### `src/services/adminOrderService.ts`
管理员订单管理服务层

**Type Definitions:**
```typescript
type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

interface AdminOrder {
  id: string;
  user_id: string;
  string_id: string;
  package_id: string | null;
  tension_horizontal: number;
  tension_vertical: number;
  racket_brand: string;
  racket_model: string;
  notes: string | null;
  status: OrderStatus;
  total_price: number;
  voucher_discount: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  user: { full_name, email, phone };
  string: { name, brand, price };
  payment: { payment_method, payment_status, paid_at } | null;
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  todayTotal: number;
  todayRevenue: number;
}
```

**Methods:**

1. `getAllOrders(filters?)`: 获取所有订单
   - Parameters: `OrderFilters` (status, dateFrom, dateTo, searchTerm, limit, offset)
   - Returns: `{ orders: AdminOrder[], total: number, error }`
   - Features:
     - 状态筛选
     - 日期范围筛选
     - 搜索（订单ID）
     - 分页支持
     - 按创建时间倒序排列
     - 包含用户、球线、支付信息的关联查询

2. `getOrderById(orderId)`: 获取订单详情
   - Parameters: `orderId: string`
   - Returns: `{ order: AdminOrder | null, error }`
   - Features:
     - 完整订单信息
     - 包含用户、球线、支付、优惠券关联数据

3. `updateOrderStatus(orderId, status, notes?)`: 更新订单状态
   - Parameters: 
     - `orderId: string`
     - `status: OrderStatus`
     - `notes?: string` (管理员备注)
   - Returns: `{ order: AdminOrder | null, error }`
   - Features:
     - 更新订单状态
     - 记录完成时间（status = 'completed'）
     - 添加管理员备注
     - 订单完成时自动扣减库存

4. `getOrderStats(dateFrom?, dateTo?)`: 获取订单统计
   - Parameters: `dateFrom?: string, dateTo?: string`
   - Returns: `{ stats: OrderStats | null, error }`
   - Features:
     - 各状态订单数量统计
     - 今日订单统计
     - 今日营业额计算

5. `batchUpdateOrderStatus(orderIds, status)`: 批量更新订单状态
   - Parameters: 
     - `orderIds: string[]`
     - `status: OrderStatus`
   - Returns: `{ success: boolean, count: number, error }`
   - Features:
     - 批量状态更新
     - 返回更新数量

6. `searchOrders(searchTerm, limit?)`: 搜索订单
   - Parameters: 
     - `searchTerm: string`
     - `limit?: number` (default: 20)
   - Returns: `{ orders: AdminOrder[] | null, error }`
   - Features:
     - 搜索用户名、邮箱、电话
     - 搜索订单ID
     - 跨表搜索支持

7. `deleteOrder(orderId)`: 删除订单
   - Parameters: `orderId: string`
   - Returns: `{ success: boolean, error }`
   - Features:
     - 仅允许删除已取消的订单
     - 安全检查

### Components

#### `src/components/admin/AdminOrderListPage.tsx`
管理员订单列表页面组件

**Features:**

1. **Header Section:**
   - 页面标题
   - 返回仪表板按钮
   - 搜索栏（支持Enter键搜索）

2. **Filter Tabs (6个):**
   - 全部 (显示总数)
   - 待确认 (显示待确认数)
   - 已确认 (显示已确认数)
   - 处理中 (显示处理中数)
   - 已完成 (显示已完成数)
   - 已取消 (显示已取消数)

3. **Stats Bar (4个统计卡):**
   - 今日订单数
   - 今日营业额
   - 总订单数
   - 待处理订单数

4. **Order Table:**
   - Columns:
     - 订单信息 (ID + 创建时间)
     - 客户 (姓名 + 电话)
     - 球线 (名称 + 品牌)
     - 金额 (总价 + 优惠)
     - 状态 (彩色徽章)
     - 操作 (查看详情按钮)
   - Click row → Navigate to detail page
   - Hover effect

5. **Pagination:**
   - 显示当前范围 (1-20 / 100)
   - 上一页/下一页按钮
   - 页码按钮（最多显示5页）
   - 自动计算总页数

**UI Elements:**
- Status badges with color coding
- Responsive table layout
- Loading spinner
- Error alert
- Empty state

#### `src/components/admin/AdminOrderDetailPage.tsx`
管理员订单详情页面组件

**Layout:**

**Header:**
- 返回订单列表按钮
- 订单ID显示
- 当前状态徽章
- 更新状态按钮（根据当前状态显示可用操作）

**Main Content (Grid Layout):**

**Left Column (2/3):**

1. **订单信息卡片:**
   - 球线型号、品牌
   - 价格
   - 横线/竖线拉力
   - 球拍品牌/型号
   - 客户备注

2. **支付信息卡片:**
   - 支付方式
   - 支付状态徽章
   - 原价
   - 优惠券折扣（如有）
   - 实付金额（紫色高亮）

**Right Column (1/3):**

1. **客户信息卡片:**
   - 姓名
   - 邮箱
   - 电话

2. **订单时间线:**
   - 订单创建时间（紫色圆点）
   - 订单完成时间（绿色圆点，如已完成）
   - 连接线

**Status Update Modal:**
- 选择新状态（下拉框，仅显示可转换的状态）
- 管理员备注（可选）
- 取消/确认按钮
- 加载状态

**Status Transition Rules:**
```
pending → confirmed, cancelled
confirmed → in_progress, cancelled
in_progress → completed, cancelled
completed → (无可转换状态)
cancelled → (无可转换状态)
```

### Routes

#### `src/app/admin/orders/page.tsx`
管理员订单列表路由
- Path: `/admin/orders`
- Component: `AdminOrderListPage`
- Protected: Requires AdminAuthProvider

#### `src/app/admin/orders/[id]/page.tsx`
管理员订单详情路由
- Path: `/admin/orders/[id]`
- Component: `AdminOrderDetailPage`
- Protected: Requires AdminAuthProvider
- Dynamic routing with order ID

## Data Flow

### Order List Loading Flow

```
Page loads
  ↓
Call getAllOrders(filters)
  ↓
Supabase query with:
  - Status filter (if selected)
  - Date range filter (if selected)
  - Pagination (limit + offset)
  - Order by created_at DESC
  ↓
Join with users, string_inventory, payments
  ↓
Return orders array + total count
  ↓
Display in table + Update pagination
```

### Order Search Flow

```
User enters search term
  ↓
Press Enter or Click "搜索"
  ↓
Call searchOrders(searchTerm)
  ↓
Search users table (name/email/phone)
  ↓
Get user IDs
  ↓
Search orders by ID or user_id IN (userIds)
  ↓
Return matched orders
  ↓
Display results
```

### Status Update Flow

```
User clicks "更新状态"
  ↓
Show modal with available next statuses
  ↓
User selects new status + optional notes
  ↓
Click "确认更新"
  ↓
Call updateOrderStatus(orderId, status, notes)
  ↓
Update orders table:
  - Set status
  - Set updated_at
  - Set completed_at (if status = completed)
  - Set admin_notes (if provided)
  ↓
If status = completed → Call RPC to decrement stock
  ↓
Return updated order
  ↓
Refresh order data
  ↓
Close modal
```

### Stock Deduction Logic

```
Order status updated to 'completed'
  ↓
Get order.string_id
  ↓
Call supabase.rpc('decrement_stock', { string_id, quantity: 1 })
  ↓
Database function:
  UPDATE string_inventory
  SET stock_quantity = stock_quantity - 1
  WHERE id = string_id
  ↓
Create stock_log record (optional)
```

## Database Operations

### Tables Accessed

**`orders` table:**
- Read: All fields (list, detail, stats)
- Update: status, updated_at, completed_at, admin_notes
- Delete: Only cancelled orders

**`users` table:**
- Read: full_name, email, phone (join for display)
- Search: name/email/phone (for searchOrders)

**`string_inventory` table:**
- Read: name, brand, price, cost_price (join for display)
- Update: stock_quantity (via RPC on order completion)

**`payments` table:**
- Read: payment_method, payment_status, paid_at, amount (join for display)

**`user_vouchers` + `vouchers` table:**
- Read: voucher code, discount info (join for detail view)

### Query Examples

**Get all orders with filters:**
```sql
SELECT 
  orders.*,
  users.full_name, users.email, users.phone,
  string_inventory.name, string_inventory.brand, string_inventory.price,
  payments.payment_method, payments.payment_status, payments.paid_at
FROM orders
LEFT JOIN users ON orders.user_id = users.id
LEFT JOIN string_inventory ON orders.string_id = string_inventory.id
LEFT JOIN payments ON orders.id = payments.order_id
WHERE orders.status = 'pending' -- if filtered
  AND orders.created_at >= '2025-12-01' -- if date filtered
ORDER BY orders.created_at DESC
LIMIT 20 OFFSET 0;
```

**Update order status:**
```sql
UPDATE orders
SET 
  status = 'completed',
  updated_at = NOW(),
  completed_at = NOW(),
  admin_notes = 'Order completed successfully'
WHERE id = $orderId
RETURNING *;
```

**Search orders:**
```sql
-- Step 1: Find users
SELECT id FROM users
WHERE full_name ILIKE '%keyword%'
   OR email ILIKE '%keyword%'
   OR phone ILIKE '%keyword%';

-- Step 2: Find orders
SELECT * FROM orders
WHERE id ILIKE '%keyword%'
   OR user_id IN (user_ids_from_step1);
```

## UI/UX Highlights

### Design Patterns

**Status Badges:**
- Pending: Yellow background, yellow border
- Confirmed: Blue background, blue border
- In Progress: Purple background, purple border
- Completed: Green background, green border
- Cancelled: Red background, red border

**Table Design:**
- Hover row highlight
- Click row to navigate
- Monospace font for order IDs
- Responsive column widths
- Sticky header (future enhancement)

**Modal Design:**
- Centered overlay
- White rounded card
- Semi-transparent backdrop
- Smooth animations
- Form validation

**Loading States:**
- Spinning indicator
- "加载中..." text
- Disabled buttons during operations

**Empty States:**
- Large emoji icon
- Descriptive text
- Call-to-action (if applicable)

### Responsive Behavior

**Desktop (>= 1024px):**
- 6-column table layout
- Grid layout for detail page (2:1 ratio)
- Horizontal filter tabs

**Tablet (768px - 1023px):**
- Table scrolls horizontally
- Stats grid: 2x2
- Detail page single column

**Mobile (< 768px):**
- Card layout for orders (future enhancement)
- Stats grid: 1x4
- Collapsible filters

## Testing Recommendations

### Manual Testing

**Order List Page (`/admin/orders`):**
1. ✅ Verify all orders display correctly
2. ✅ Test status filter tabs (all 6 filters)
3. ✅ Test search functionality (name, email, ID)
4. ✅ Test pagination (next/prev, page numbers)
5. ✅ Verify stats bar displays correct counts
6. ✅ Test row click navigation
7. ✅ Test "查看详情" button
8. ✅ Verify loading state
9. ✅ Test empty state (no orders)
10. ✅ Test error state

**Order Detail Page (`/admin/orders/[id]`):**
1. ✅ Verify all order information displays
2. ✅ Verify customer information
3. ✅ Verify payment information
4. ✅ Test status update modal
5. ✅ Test status transitions
6. ✅ Verify timeline display
7. ✅ Test notes field
8. ✅ Verify success/error handling
9. ✅ Test back button
10. ✅ Test with missing data (no payment)

**Status Update:**
1. ✅ Test pending → confirmed
2. ✅ Test confirmed → in_progress
3. ✅ Test in_progress → completed
4. ✅ Test any → cancelled
5. ✅ Verify completed state locks (no further updates)
6. ✅ Verify cancelled state locks
7. ✅ Test admin notes saving
8. ✅ Verify stock deduction on completion

### Service Testing

**adminOrderService.ts:**
```typescript
// Test getAllOrders
const { orders, total } = await getAllOrders({ status: 'pending', limit: 10 });
console.log('Pending orders:', orders);

// Test getOrderById
const { order } = await getOrderById('order-id-123');
console.log('Order detail:', order);

// Test updateOrderStatus
const { order } = await updateOrderStatus('order-id-123', 'completed', 'Done');
// Verify stock decremented

// Test searchOrders
const { orders } = await searchOrders('John Doe');
console.log('Search results:', orders);

// Test getOrderStats
const { stats } = await getOrderStats();
console.log('Stats:', stats);
```

### Edge Cases

1. **Large Order Volume:**
   - Test with 100+ orders
   - Verify pagination works
   - Check query performance

2. **Concurrent Updates:**
   - Two admins update same order simultaneously
   - Verify last-write-wins
   - Consider optimistic locking (future)

3. **Invalid Status Transitions:**
   - Try updating completed order
   - Try updating cancelled order
   - Verify UI blocks invalid actions

4. **Missing Related Data:**
   - Order without payment
   - Order without user (deleted user)
   - Handle gracefully

5. **Stock Deduction:**
   - Order with out-of-stock item
   - Verify error handling
   - Prevent negative stock

## Known Limitations

1. **Search Functionality:**
   - Cannot search across multiple fields simultaneously
   - Limited to basic ILIKE matching
   - No fuzzy search
   - Future: Implement full-text search

2. **No Batch Operations UI:**
   - Service supports batch updates
   - UI doesn't expose checkbox selection
   - Future: Add multi-select + batch actions

3. **No Date Range Picker:**
   - Filters defined but no UI
   - Future: Add date picker component

4. **No Export Functionality:**
   - Cannot export orders to CSV/Excel
   - Future: Add export button

5. **No Real-time Updates:**
   - Must manually refresh
   - Future: Supabase Realtime subscriptions

6. **Stock RPC Function:**
   - Assumes `decrement_stock` RPC exists
   - Must be created in Supabase
   - Future: Include migration script

## Required Database Setup

### Create RPC Function for Stock Deduction

```sql
CREATE OR REPLACE FUNCTION decrement_stock(
  string_id UUID,
  quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE string_inventory
  SET stock_quantity = stock_quantity - quantity,
      updated_at = NOW()
  WHERE id = string_id;
  
  -- Optional: Create stock log
  INSERT INTO stock_log (string_id, change_amount, type, created_at)
  VALUES (string_id, -quantity, 'order_completion', NOW());
END;
$$;
```

### Add admin_notes Column

```sql
ALTER TABLE orders
ADD COLUMN admin_notes TEXT;
```

## Future Enhancements

1. **Advanced Filters:**
   - Date range picker
   - Price range filter
   - Payment method filter
   - String type filter

2. **Batch Operations:**
   - Multi-select checkboxes
   - Batch status update
   - Batch export
   - Bulk actions dropdown

3. **Order Analytics:**
   - Revenue charts (daily/weekly/monthly)
   - Top customers
   - Popular strings
   - Peak hours analysis

4. **Real-time Updates:**
   - Live order notifications
   - Auto-refresh on new orders
   - Websocket integration

5. **Export & Reporting:**
   - CSV export
   - PDF invoices
   - Custom reports
   - Email summaries

6. **Communication:**
   - SMS notifications to customers
   - Status update emails
   - Order confirmation messages

7. **Advanced Search:**
   - Full-text search
   - Multiple criteria search
   - Saved searches
   - Search history

## Integration Points

### With Phase 3.1 (Admin Auth):**
- Uses AdminAuthProvider for route protection
- Admin user info displayed in components
- Role-based permissions (future: super_admin only deletes)

### With Phase 2 (User Features):**
- Orders created by users in booking flow
- Order status updates trigger user notifications (future)
- Payment records linked from user payments

### With Future Phases:**
- Phase 3.3: Stock management (inventory updates)
- Phase 3.4: Package management (package order tracking)
- Phase 3.7: Financial reports (order data for revenue analysis)

## Documentation Updates Needed

### `docs/System-Design-Document.md`
- Add Order Management Module section
- Document status transition rules
- Add order lifecycle diagram

### `docs/UI-Design-Guide.md`
- Add Order List page wireframe
- Add Order Detail page wireframe
- Document table design patterns

### `README.md`
- Mark Phase 3.2 as completed
- Update admin features list

## Summary

Phase 3.2 成功实现了完整的管理员订单管理系统：

✅ **服务层:**
- adminOrderService.ts (7 methods)

✅ **组件:**
- AdminOrderListPage (订单列表 + 筛选 + 搜索 + 分页)
- AdminOrderDetailPage (订单详情 + 状态更新)

✅ **路由:**
- /admin/orders
- /admin/orders/[id]

✅ **核心功能:**
- 订单列表展示（支持筛选、搜索、分页）
- 订单详情查看
- 订单状态更新
- 订单统计（今日/总数/营业额）
- 自动库存扣减（订单完成时）

✅ **UI特性:**
- 彩色状态徽章
- 响应式表格
- 分页导航
- 搜索功能
- 加载/错误/空状态

🔄 **下一步 (Phase 3.3):**
- 库存管理（球线库存查看/编辑/补货）
- 库存警告
- 补货记录

管理员现在可以完整管理所有订单，包括查看、筛选、搜索和更新状态。
