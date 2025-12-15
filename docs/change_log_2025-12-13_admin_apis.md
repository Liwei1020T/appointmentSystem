# Change Log — 2025-12-13 (Part 2)

## Summary
完成管理员功能 API Routes 和 Service 层，添加订单取消功能。

## Changes

### 新增管理员 API Routes（10个）

#### 1. 订单管理
- **GET /api/admin/orders** - 获取所有订单（支持分页、状态筛选）
  - 包含用户信息、球线、支付、套餐、优惠券详情
  - 分页支持（page, limit）
  - 返回总数和分页信息

#### 2. 用户管理
- **GET /api/admin/users** - 获取所有用户（支持搜索、分页）
  - 搜索支持：邮箱、姓名、电话
  - 包含订单/套餐/优惠券统计
  - 分页支持
- **POST /api/admin/users/[id]/points** - 更新用户积分
  - 增加或扣除积分
  - 自动记录积分日志
  - 事务确保原子性
- **PATCH /api/admin/users/[id]/role** - 更新用户角色
  - 支持 customer/admin 角色切换
  - 权限验证

#### 3. 库存管理
- **POST /api/admin/inventory** - 创建球线
  - 必填：品牌、型号、售价
  - 可选：成本价、初始库存
  - 自动记录初始库存日志
- **PATCH /api/admin/inventory/[id]** - 更新库存
  - 支持常规字段更新
  - 支持库存调整（adjustment）
  - 库存调整自动记录日志

#### 4. 套餐管理
- **POST /api/admin/packages** - 创建套餐
  - 必填：名称、次数、价格、有效期
  - 可选：描述
- **PATCH /api/admin/packages** - 更新套餐
  - 支持所有字段更新
  - 支持启用/禁用

#### 5. 优惠券管理
- **POST /api/admin/vouchers** - 创建优惠券
  - 验证优惠券代码唯一性
  - 支持百分比/固定金额折扣
  - 支持积分兑换设置
  - 支持最大使用次数限制
- **GET /api/admin/vouchers** - 获取所有优惠券
  - 支持按激活状态筛选
- **PATCH /api/admin/vouchers** - 更新优惠券
  - 支持启用/禁用
  - 支持修改最大使用次数

#### 6. 统计分析
- **GET /api/admin/stats** - 获取统计数据
  - 概览数据：用户数、订单数、总收入、待处理订单、低库存提醒等
  - 趋势分析：订单趋势、每日收入
  - 热门数据：热门球线排行（Top 5）
  - 支持自定义时间范围（默认30天）

### 新增用户 API Routes（1个）

- **POST /api/orders/[id]/cancel** - 取消订单
  - 仅允许取消待处理订单
  - 自动退还套餐次数（如已使用）
  - 取消相关支付记录
  - 发送取消通知
  - 使用事务确保数据一致性

### 新增 Service 文件（1个）

#### `src/services/admin.service.ts`
完整的管理员服务层，包含：

**统计功能**
- `getStats(period)` - 获取统计数据

**订单管理**
- `getAllOrders(status, page, limit)` - 获取所有订单

**用户管理**
- `getAllUsers(search, page, limit)` - 获取所有用户
- `updateUserPoints(userId, amount, reason)` - 更新积分
- `updateUserRole(userId, role)` - 更新角色

**库存管理**
- `createString(stringData)` - 创建球线
- `updateInventory(stringId, updateData)` - 更新库存

**套餐管理**
- `createPackage(packageData)` - 创建套餐
- `updatePackage(id, packageData)` - 更新套餐

**优惠券管理**
- `createVoucher(voucherData)` - 创建优惠券
- `getAllVouchers(active)` - 获取所有优惠券
- `updateVoucher(id, voucherData)` - 更新优惠券

## API 特性

### 分页支持
所有列表类 API 支持统一的分页参数：
```typescript
{
  page: number,    // 当前页码
  limit: number,   // 每页数量
  total: number,   // 总记录数
  totalPages: number  // 总页数
}
```

### 搜索功能
用户管理支持模糊搜索：
- 邮箱（不区分大小写）
- 姓名（不区分大小写）
- 电话

### 库存调整
两种更新方式：

**1. 直接更新**
```typescript
{
  stock11m: 100,  // 直接设置库存
  sellingPrice: 50
}
```

**2. 库存调整（带日志）**
```typescript
{
  adjustment: -10,  // 增减量
  reason: "Damaged stock"  // 原因
}
```

### 统计查询示例

#### 每日收入统计
使用原生 SQL 查询提升性能：
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM(amount) as revenue
FROM payments
WHERE status = 'completed'
  AND created_at >= ?
GROUP BY DATE(created_at)
ORDER BY date ASC
```

#### 热门球线排行
使用 Prisma groupBy 聚合：
```typescript
await prisma.order.groupBy({
  by: ['stringId'],
  where: {
    createdAt: { gte: startDate },
    status: 'completed',
  },
  _count: { stringId: true },
  orderBy: { _count: { stringId: 'desc' } },
  take: 5,
});
```

## 权限控制

所有管理员 API 使用 `requireAdmin()` 验证：
```typescript
await requireAdmin(); // 抛出错误如果非管理员
```

用户 API 使用 `requireAuth()` 验证：
```typescript
const user = await requireAuth(); // 返回当前用户
```

## 事务处理示例

### 积分调整
```typescript
await prisma.$transaction(async (tx) => {
  // 1. 更新用户积分
  const user = await tx.user.update({
    where: { id: userId },
    data: { points: { increment: amount } }
  });
  
  // 2. 记录日志
  await tx.pointsLog.create({
    data: {
      userId,
      amount,
      type: amount > 0 ? 'admin_add' : 'admin_deduct',
      balanceAfter: user.points,
    }
  });
});
```

### 订单取消
```typescript
await prisma.$transaction(async (tx) => {
  // 1. 更新订单状态
  await tx.order.update({
    where: { id: orderId },
    data: { status: 'cancelled' }
  });
  
  // 2. 取消支付
  await tx.payment.updateMany({
    where: { orderId, status: 'pending' },
    data: { status: 'cancelled' }
  });
  
  // 3. 退还套餐次数
  if (userPackageId) {
    await tx.userPackage.update({
      where: { id: userPackageId },
      data: { remainingSessions: { increment: 1 } }
    });
  }
  
  // 4. 创建通知
  await tx.notification.create({
    data: {
      userId,
      title: '订单已取消',
      message: `订单已成功取消`,
      type: 'order',
    }
  });
});
```

## 迁移进度更新

### 已完成（~75%）
- ✅ 核心 API Routes（16个）
- ✅ 管理员 API Routes（10个）
- ✅ 用户功能 API（1个取消订单）
- ✅ Service 层（8个服务文件）
- ✅ 认证系统（NextAuth集成）
- ✅ 文件上传（本地存储）
- ✅ 迁移指南文档

### 待完成（~25%）
- ⏳ 支付相关 API（webhook、退款等）
- ⏳ UI 组件更新（使用新的 service 层）
- ⏳ 高级功能（实时通知、数据导出等）
- ⏳ 类型定义清理

## 使用示例

### 管理员仪表板

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getStats, getAllOrders } from '@/services/admin.service';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, ordersData] = await Promise.all([
          getStats('30'),
          getAllOrders('pending', 1, 10),
        ]);
        setStats(statsData);
        setOrders(ordersData.orders);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1>管理员仪表板</h1>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div>总用户: {stats?.overview.totalUsers}</div>
        <div>总订单: {stats?.overview.totalOrders}</div>
        <div>总收入: RM {stats?.overview.totalRevenue}</div>
        <div>待处理: {stats?.overview.pendingOrders}</div>
      </div>

      {/* 订单列表 */}
      <div>
        {orders.map(order => (
          <div key={order.id}>
            订单 #{order.id} - {order.user.fullName}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 库存管理

```typescript
import { createString, updateInventory } from '@/services/admin.service';

// 创建新球线
await createString({
  brand: 'Yonex',
  model: 'BG65',
  sellingPrice: 25,
  costPrice: 15,
  stock11m: 50,
});

// 库存调整（加库存）
await updateInventory(stringId, {
  adjustment: 20,
  reason: 'New stock arrival',
});

// 库存调整（减库存）
await updateInventory(stringId, {
  adjustment: -5,
  reason: 'Damaged during inspection',
});

// 更新价格
await updateInventory(stringId, {
  sellingPrice: 28,
  costPrice: 16,
});
```

## 测试端点

启动开发服务器后可测试：

```bash
# 管理员统计
GET http://localhost:3000/api/admin/stats?period=30

# 管理员订单
GET http://localhost:3000/api/admin/orders?status=pending&page=1&limit=20

# 管理员用户
GET http://localhost:3000/api/admin/users?search=john&page=1

# 创建球线
POST http://localhost:3000/api/admin/inventory
Body: { brand, model, sellingPrice, ... }

# 创建套餐
POST http://localhost:3000/api/admin/packages
Body: { name, sessions, price, validity }

# 创建优惠券
POST http://localhost:3000/api/admin/vouchers
Body: { code, name, type, value, validFrom, validUntil }

# 取消订单
POST http://localhost:3000/api/orders/{id}/cancel
```

## Next Steps

1. **测试管理员功能**
   - 测试统计数据获取
   - 测试用户/订单/库存管理
   - 测试权限控制

2. **实现支付功能**
   - 创建支付 webhook
   - 实现退款逻辑
   - 集成支付网关

3. **更新 UI 组件**
   - 更新管理员界面使用新 service
   - 更新用户界面使用新 service
   - 替换所有 Supabase Auth 调用

4. **优化和完善**
   - 添加数据验证
   - 实现缓存策略
   - 添加错误日志
   - 性能优化

## Notes

- 所有管理员 API 都需要管理员权限
- 分页参数统一使用 page 和 limit
- 所有金额相关操作都使用事务
- 库存调整自动记录日志
- 订单取消自动处理关联数据（套餐、支付、通知）

---

**迁移进度：约 75% 完成**  
**下一步：支付功能 + UI 组件更新**
