# Change Log — 2025-12-11 (Orders)

**Feature:** Phase 2.4 — 订单列表与详情  
**Status:** ✅ Completed  
**Developer:** AI Agent  

---

## 📝 Summary

完成了订单管理功能，包括订单列表展示（支持状态筛选）、订单详情查看（完整信息展示）、订单状态时间线可视化、订单取消功能。用户可以查看所有订单历史，按状态筛选订单，查看订单详细信息，以及取消待处理订单。

---

## ✨ New Features

### 1. 订单服务层增强 (`src/services/orderService.ts`)

**更新方法：**

- `getOrderById(orderId)`: 扩展查询字段，现在包含：
  - 球线详情（brand, model, specification, price, cost_price）
  - 支付信息（amount, status, payment_method, transaction_id, created_at）
  - 优惠券信息（voucher name, type, value）

**查询结构：**
```typescript
select(`
  *,
  string:string_inventory(id, brand, model, specification, price, cost_price),
  payment:payments(id, amount, status, payment_method, transaction_id, created_at),
  voucher:user_vouchers(
    id,
    voucher:vouchers(id, name, type, value)
  )
`)
```

**用途：** 为订单详情页提供完整数据

---

### 2. 订单状态徽章组件 (`src/components/OrderStatusBadge.tsx`)

**功能：**
- 根据订单状态显示不同颜色的徽章
- 支持 4 种状态：pending, in_progress, completed, cancelled

**状态配置：**
```typescript
pending:     黄色 (bg-yellow-100, text-yellow-700) - "待处理"
in_progress: 蓝色 (bg-blue-100, text-blue-700)     - "处理中"
completed:   绿色 (bg-green-100, text-green-700)   - "已完成"
cancelled:   灰色 (bg-slate-100, text-slate-700)   - "已取消"
```

**Props：**
```typescript
interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}
```

**复用性：** 可在订单列表、订单详情、管理后台等多处使用

---

### 3. 订单列表组件 (`src/features/orders/OrderList.tsx`)

**功能：**
- 显示用户所有订单
- 状态筛选（全部、待处理、处理中、已完成、已取消）
- 点击订单卡片跳转到详情页
- 空状态处理
- 加载状态显示
- 错误处理与重试

**交互：**
- 横向滚动的状态筛选条（移动端友好）
- 选中状态高亮（蓝色背景）
- 订单卡片 hover 效果（阴影）
- 点击卡片跳转到 `/orders/{orderId}`

**订单卡片显示内容：**
- 球线品牌、型号、规格
- 订单状态徽章
- 拉力值
- 价格
- 套餐使用标识（绿色徽章）
- 优惠券折扣标识（橙色徽章）
- 下单时间

**空状态：**
- 显示图标和提示文字
- 提供"立即预约"按钮跳转到预约页

**Props：**
```typescript
interface OrderListProps {
  initialStatus?: OrderStatus;
}
```

---

### 4. 订单时间线组件 (`src/components/OrderTimeline.tsx`)

**功能：**
- 可视化显示订单状态流转历史
- 支持正常流程和取消流程两种路径

**正常流程：**
1. 订单已创建 (pending) 📝
2. 穿线处理中 (in_progress) ⚙️
3. 穿线完成 (completed) ✅

**取消流程：**
1. 订单已创建 (pending) 📝
2. 订单已取消 (cancelled) ❌

**视觉设计：**
- 节点图标（emoji）
- 垂直连接线
- 当前状态高亮（彩色背景 + 边框）
- 历史状态灰显
- 时间戳显示

**Props：**
```typescript
interface OrderTimelineProps {
  currentStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}
```

**智能时间推断：**
- 如无 `completedAt`，使用 `updatedAt` 或 `createdAt`
- 如无 `cancelledAt`，使用 `updatedAt` 或 `createdAt`

---

### 5. 订单详情页组件 (`src/features/orders/OrderDetailPage.tsx`)

**功能：**
- 显示订单完整信息
- 订单状态时间线
- 球线详情
- 价格明细（原价、优惠、实付）
- 支付信息（如有支付记录）
- 订单备注
- 订单基本信息（编号、时间）
- 取消订单功能（仅限待处理状态）

**页面结构：**

**1. 顶部导航栏**
- 返回按钮
- 页面标题

**2. 订单状态卡片**
- 状态徽章
- 状态时间线组件

**3. 球线信息卡片**
- 品牌、型号、规格
- 拉力值

**4. 价格明细卡片**
- 球线价格
- 优惠金额（如有）
- 套餐抵扣标识（如使用套餐）
- 优惠券标识（如使用优惠券）
- 实付金额（加粗高亮）

**5. 支付信息卡片（如需支付）**
- 支付状态（已支付/待支付/支付失败）
- 支付方式
- 交易单号

**6. 订单备注卡片（如有备注）**
- 显示用户备注内容

**7. 订单信息卡片**
- 订单编号（等宽字体）
- 下单时间
- 更新时间

**8. 底部操作栏（仅待处理订单显示）**
- 取消订单按钮

**交互：**
- 点击取消订单 → 弹出确认弹窗
- 确认后调用 `cancelOrder()` API
- 成功后显示 Toast 提示
- 自动刷新订单数据
- 取消后隐藏底部操作栏

**Props：**
```typescript
interface OrderDetailPageProps {
  orderId: string;
}
```

**状态管理：**
- `order`: 订单数据
- `loading`: 加载状态
- `error`: 错误信息
- `showCancelModal`: 取消确认弹窗显示状态
- `cancelling`: 取消操作进行中
- `toast`: 提示信息

---

### 6. 订单列表路由页面 (`src/app/orders/page.tsx`)

**路径：** `/orders`

**元数据：**
```typescript
title: '我的订单 | String Service Platform'
description: '查看订单列表和状态'
```

**布局：**
- 顶部固定导航栏
- 最大宽度 2xl，居中显示
- 浅灰背景

**渲染：**
```tsx
<OrderList />
```

---

### 7. 订单详情路由页面 (`src/app/orders/[id]/page.tsx`)

**路径：** `/orders/{id}`（动态路由）

**元数据：**
```typescript
title: '订单详情 | String Service Platform'
description: '查看订单详细信息'
```

**Props：**
```typescript
interface OrderDetailRouteProps {
  params: {
    id: string;  // 订单 ID
  };
}
```

**渲染：**
```tsx
<OrderDetailPage orderId={params.id} />
```

---

## 📊 Database Changes

**无数据库结构变更**

本次功能使用现有表结构：
- `orders`: 订单表
- `string_inventory`: 球线库存表
- `payments`: 支付记录表
- `user_vouchers`: 用户优惠券表
- `vouchers`: 优惠券模板表

---

## 🔌 API Updates

**orderService.ts 更新：**

**getOrderById(orderId)** - 扩展查询字段
- **新增字段：**
  - `string.cost_price`: 球线成本价
  - `payment.created_at`: 支付创建时间
  - `voucher.voucher.name`: 优惠券名称
  - `voucher.voucher.type`: 优惠券类型
  - `voucher.voucher.value`: 优惠券面额

- **返回结构：**
```typescript
{
  order: Order & {
    string: {
      id, brand, model, specification, price, cost_price
    },
    payment: {
      id, amount, status, payment_method, transaction_id, created_at
    } | null,
    voucher: {
      id,
      voucher: {
        id, name, type, value
      }
    } | null
  },
  error: null
}
```

**无新增方法**（复用现有的 `getUserOrders` 和 `cancelOrder`）

---

## 🎨 UI/UX Updates

### 新增组件

**OrderStatusBadge:**
- 圆角徽章设计
- 颜色区分状态
- 字体大小 xs
- 内边距紧凑

**OrderList:**
- 卡片式订单列表
- 横向滚动状态筛选
- 网格布局信息展示
- Hover 效果（阴影加深）
- 点击跳转到详情页

**OrderTimeline:**
- 垂直时间轴设计
- 圆形节点 + emoji 图标
- 连接线（虚线/实线）
- 当前状态高亮
- 时间戳显示

**OrderDetailPage:**
- 分段卡片布局
- 信息层次清晰
- 价格明细突出显示
- 底部固定操作栏（移动端友好）
- 确认弹窗防误操作

### 交互优化

- **状态筛选**：平滑切换，无闪烁
- **订单点击**：即时响应跳转
- **取消确认**：二次确认防误操作
- **Toast 提示**：操作反馈及时
- **空状态**：引导用户行动
- **加载状态**：用户体验流畅

### 移动端优化

- 横向滚动筛选条（防止换行）
- 底部操作栏留出安全区域
- 卡片间距适中
- 字体大小可读性好
- 触摸目标足够大

---

## 🧪 Testing Recommendations

### 1. 订单列表测试

- ✅ 显示所有用户订单
- ✅ 状态筛选准确（全部、各状态）
- ✅ 点击卡片正确跳转
- ✅ 空状态显示正确
- ✅ 加载状态正常
- ✅ 错误重试功能

### 2. 订单详情测试

- ✅ 显示完整订单信息
- ✅ 球线信息正确
- ✅ 价格计算准确
- ✅ 支付信息显示（如有）
- ✅ 备注显示（如有）
- ✅ 时间线状态正确

### 3. 取消订单测试

- ✅ 仅待处理订单显示取消按钮
- ✅ 确认弹窗正常工作
- ✅ 取消成功后刷新数据
- ✅ 取消后隐藏操作栏
- ✅ Toast 提示正确

### 4. 状态时间线测试

- ✅ 正常流程显示正确
- ✅ 取消流程显示正确
- ✅ 当前状态高亮
- ✅ 时间戳准确

### 5. 边界情况测试

- ✅ 订单不存在
- ✅ 无订单记录
- ✅ 无支付记录
- ✅ 无备注
- ✅ 取消已完成订单（应禁止）
- ✅ 网络错误处理

---

## 📝 Implementation Notes

### 订单状态流转逻辑

**当前实现：**
```
pending → in_progress → completed
pending → cancelled
```

**状态转换规则：**
- `pending` 可以转换为 `in_progress` 或 `cancelled`
- `in_progress` 只能转换为 `completed`
- `completed` 和 `cancelled` 为终态，不可再转换

**用户权限：**
- 用户只能取消 `pending` 状态的订单
- 管理员可以更新订单状态（后续实现）

**未来增强：**
- 添加 `ready_for_pickup` 状态（穿线完成，待取拍）
- 添加 `picked_up` 状态（已取拍）
- 添加状态转换权限控制
- 添加状态转换日志（audit trail）

---

### 价格明细展示逻辑

**显示规则：**

1. **球线价格**：总是显示
2. **优惠金额**：仅在 `discount_amount > 0` 时显示
3. **套餐抵扣标识**：仅在 `use_package = true` 时显示
4. **优惠券标识**：仅在 `voucher_id` 存在时显示
5. **实付金额**：总是显示（加粗高亮）

**示例：**

**使用套餐：**
```
球线价格      RM 50.00
使用套餐      [套餐抵扣]
实付金额      RM 0.00
```

**使用优惠券：**
```
球线价格      RM 50.00
优惠金额      - RM 5.00
使用优惠券    [10% OFF]
实付金额      RM 45.00
```

**无优惠：**
```
球线价格      RM 50.00
实付金额      RM 50.00
```

---

### 时间线时间戳推断

由于当前数据库 `orders` 表未记录每个状态的转换时间，时间线组件使用以下推断逻辑：

```typescript
// pending 状态使用 created_at
pending: createdAt

// in_progress 状态使用 updated_at（如无则用 created_at）
in_progress: updatedAt || createdAt

// completed 状态使用 completed_at（如无则用 updated_at 或 created_at）
completed: completedAt || updatedAt || createdAt

// cancelled 状态使用 cancelled_at（如无则用 updated_at 或 created_at）
cancelled: cancelledAt || updatedAt || createdAt
```

**数据库优化建议（未来）：**
- 添加 `in_progress_at` 字段
- 添加 `completed_at` 字段
- 添加 `cancelled_at` 字段
- 或创建独立的 `order_status_history` 表记录所有状态变更

---

## 📁 Updated Files

### 新增文件

1. `src/components/OrderStatusBadge.tsx` (49行)
2. `src/components/OrderTimeline.tsx` (126行)
3. `src/features/orders/OrderList.tsx` (189行)
4. `src/features/orders/OrderDetailPage.tsx` (341行)
5. `src/app/orders/page.tsx` (26行)
6. `src/app/orders/[id]/page.tsx` (21行)

### 修改文件

1. `src/services/orderService.ts`
   - 更新 `getOrderById()` 方法
   - 扩展查询字段（string.cost_price, payment.created_at, voucher 信息）

---

## 🎯 Impact Analysis

### 影响范围

**正面影响：**
- ✅ 用户可以查看所有订单历史
- ✅ 支持按状态筛选订单
- ✅ 订单详情信息完整展示
- ✅ 订单状态流转可视化
- ✅ 用户可取消待处理订单
- ✅ 移动端体验优化

**潜在风险：**
- ⚠️ 订单列表在数据量大时可能加载慢（未实现分页）
- ⚠️ 取消订单后未退还套餐次数或优惠券
- ⚠️ 无订单搜索功能（未来需要）

**缓解措施：**
- 实现分页或虚拟滚动（后续优化）
- 添加取消订单后的资源回退逻辑（Edge Function）
- 添加订单搜索功能（按编号、球线、日期搜索）

---

## 🔗 Related Features

**与现有功能的关联：**

1. **预约流程 (Phase 2.3)**
   - 预约成功后跳转到 `/orders/{orderId}`
   - 订单详情页完整展示预约信息

2. **首页 (Phase 2.2)**
   - 首页显示最近 5 条订单
   - 点击订单卡片跳转到详情页
   - 复用 `OrderStatusBadge` 组件

3. **认证系统 (Phase 2.1)**
   - 所有订单操作需要登录
   - 使用 `AuthContext` 获取用户信息

**未来集成：**

1. **支付流程 (Phase 2.5)**
   - 待支付订单显示"去支付"按钮
   - 支付成功后更新订单状态

2. **通知系统 (Phase 4)**
   - 订单状态变更发送通知
   - Push / SMS / Email

3. **管理后台 (Phase 3)**
   - 管理员可更新订单状态
   - 管理员可查看所有订单
   - 订单统计与分析

---

## ✅ Checklist

- [x] 扩展 orderService 方法
- [x] 订单状态徽章组件
- [x] 订单列表组件
- [x] 订单时间线组件
- [x] 订单详情页组件
- [x] 订单列表路由页面
- [x] 订单详情路由页面（动态路由）
- [x] Change Log 文档
- [ ] 订单分页功能（待后续）
- [ ] 订单搜索功能（待后续）
- [ ] 取消订单资源回退（待 Edge Function）

---

## 🚀 Next Steps

**Phase 2.5: 套餐购买流程**
- 套餐列表页（展示可购买套餐）
- 套餐详情页（价格、次数、有效期）
- 套餐购买流程（选择套餐 → 支付）
- 我的套餐页面（查看已购套餐）
- 支付集成（FPX/TNG/Stripe）

**Phase 2.6: 积分与优惠券管理**
- 积分历史页（points_log 表）
- 积分获得规则展示
- 优惠券兑换页（使用积分兑换）
- 我的优惠券页（已拥有优惠券列表）
- 优惠券详情与使用说明

**Phase 3: 管理后台**
- 管理员登录与权限验证
- 订单管理（列表、详情、状态更新）
- 库存管理（球线 CRUD、库存调整）
- 用户管理（用户列表、积分调整）
- 数据分析（营收、利润、趋势）

**订单功能增强（后续优化）：**
- 订单列表分页加载
- 订单搜索（编号、球线、日期范围）
- 订单导出（Excel/PDF）
- 订单评价功能
- 订单重新下单功能

---

## 📞 Support

如有问题，请检查：
1. `docs/System-Design-Document.md` - 系统架构设计
2. `docs/UI-Design-Guide.md` - UI 设计规范
3. `docs/change_log_2025-12-11_booking.md` - 预约流程文档

---

**Change Log Document**  
**Generated:** 2025-12-11  
**Version:** 1.0  
**Status:** ✅ Phase 2.4 Completed
