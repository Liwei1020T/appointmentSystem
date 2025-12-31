# Change Log — 2025-12-13

## Summary
创建完整的 API Routes 体系和对应的 Service 层，完成从 Supabase 到 Prisma 的服务层迁移。

## Changes

### 新增 API Routes（11个）

#### 1. 订单相关
- **GET /api/orders** - 获取用户订单列表（支持状态筛选、数量限制）
- **GET /api/orders/[id]** - 获取单个订单详情（含球线、支付、套餐、优惠券信息）

#### 2. 套餐相关
- **GET /api/packages** - 获取所有可用套餐
- **GET /api/packages/user** - 获取用户已购买套餐（支持状态筛选）

#### 3. 库存相关
- **GET /api/inventory** - 获取球线库存列表（支持仅显示活跃项）

#### 4. 积分相关
- **GET /api/points** - 获取用户积分余额和明细（支持数量限制）

#### 5. 优惠券相关
- **GET /api/vouchers/user** - 获取用户优惠券列表（支持状态筛选）
- **POST /api/vouchers/redeem** - 兑换优惠券（支持积分兑换和免费领取）
  - 验证优惠券有效性、使用次数、有效期
  - 处理积分扣除和优惠券发放
  - 使用事务确保原子性

#### 6. 个人资料相关
- **GET /api/profile** - 获取用户个人资料和统计信息
- **PATCH /api/profile** - 更新用户个人资料（姓名、电话）

#### 7. 推荐系统
- **GET /api/referrals** - 获取推荐记录和统计（含推荐码、推荐人列表、总奖励）

#### 8. 通知系统
- **GET /api/notifications** - 获取通知列表（支持仅未读、数量限制）
- **POST /api/notifications** - 标记通知为已读（支持单个或全部标记）

### 新增 Service 文件（7个）

所有 service 文件都采用统一的错误处理和响应格式：

#### 1. `src/services/order.service.ts`
- `getUserOrders()` - 获取订单列表
- `getOrderById()` - 获取订单详情
- `createOrder()` - 创建订单
- `cancelOrder()` - 取消订单
- `completeOrder()` - 完成订单（管理员）
- `getOrderHistory()` - 获取订单历史（分页）

#### 2. `src/services/package.service.ts`
- `getAvailablePackages()` - 获取可用套餐
- `getUserPackages()` - 获取用户套餐
- `buyPackage()` - 购买套餐
- `getActiveUserPackages()` - 获取激活中的套餐
- `getPackageById()` - 获取套餐详情

#### 3. `src/services/auth.service.ts`
- `signup()` - 用户注册
- `login()` - 用户登录（调用 NextAuth signIn）
- `logout()` - 用户登出（调用 NextAuth signOut）
- 说明：getCurrentUser 和 isAuthenticated 需使用 useSession hook

#### 4. `src/services/profile.service.ts`
- `getProfile()` - 获取个人资料
- `updateProfile()` - 更新个人资料
- `getPoints()` - 获取积分信息
- `getReferrals()` - 获取推荐记录

#### 5. `src/services/voucher.service.ts`
- `getUserVouchers()` - 获取用户优惠券
- `redeemVoucher()` - 兑换优惠券
- `getActiveVouchers()` - 获取可用优惠券
- `validateVoucher()` - 验证优惠券有效性

#### 6. `src/services/inventory.service.ts`
- `getInventory()` - 获取库存列表
- `getAvailableStrings()` - 获取可用球线
- `getStringsByBrand()` - 按品牌分组
- `searchStrings()` - 搜索球线
- `getStringById()` - 获取球线详情

#### 7. `src/services/notification.service.ts`
- `getNotifications()` - 获取通知列表
- `markAsRead()` - 标记单个通知已读
- `markAllAsRead()` - 标记所有通知已读
- `getUnreadCount()` - 获取未读数量

### 新增文档

#### `docs/SERVICE_MIGRATION_GUIDE.md`
完整的服务迁移指南，包含：
- **迁移模式对照**：6种常见操作的 Supabase vs Prisma 对比
  - 数据查询、插入、更新
  - 事务操作
  - 认证系统
  - 文件上传
- **已迁移文件清单**：7个已完成的 service 文件
- **迁移步骤**：3步迁移流程（API Route → Service → Component）
- **常见问题**：实时订阅、RPC函数、字段名称、复杂查询
- **测试检查清单**：9大功能模块的测试项

## API 设计原则

### 统一响应格式
```typescript
// 成功响应
{
  success: true,
  data: any,
  message?: string
}

// 错误响应
{
  success: false,
  error: string
}
```

### 统一错误处理
- 使用 `requireAuth()` 确保用户已登录
- 使用 `requireAdmin()` 确保管理员权限
- 使用 `errorResponse()` 返回统一格式的错误
- 使用 `successResponse()` 返回统一格式的成功响应

### RESTful 风格
- GET - 查询资源
- POST - 创建资源
- PATCH - 部分更新资源
- PUT - 完整更新资源
- DELETE - 删除资源

### 查询参数支持
- `status` - 状态筛选
- `limit` - 数量限制
- `page` - 分页
- `unread` - 仅未读（通知）
- `active` - 仅活跃项

## 事务处理示例

### 优惠券兑换（积分扣除 + 优惠券发放）
```typescript
await prisma.$transaction(async (tx) => {
  // 1. 扣除积分
  await tx.user.update({
    where: { id: userId },
    data: { points: { decrement: pointsCost } }
  });
  
  // 2. 记录积分日志
  await tx.pointsLog.create({
    data: { userId, amount: -pointsCost, type: 'redeem' }
  });
  
  // 3. 创建用户优惠券
  await tx.userVoucher.create({
    data: { userId, voucherId, status: 'active' }
  });
  
  // 4. 更新优惠券使用次数
  await tx.voucher.update({
    where: { id: voucherId },
    data: { usedCount: { increment: 1 } }
  });
});
```

## 迁移进度更新

### 已完成（~60%）
- ✅ 核心 API Routes（16个）
- ✅ Service 层（7个主要服务）
- ✅ 认证系统（NextAuth集成）
- ✅ 文件上传（本地存储）
- ✅ 迁移指南文档

### 待完成（~40%）
- ⏳ 管理员 API Routes（用户管理、库存管理、报表等）
- ⏳ 支付相关 API（webhook、退款等）
- ⏳ 剩余 service 文件迁移
- ⏳ UI 组件更新（使用新的 service 层）
- ⏳ 类型定义清理

## 使用示例

### 在组件中使用新 Service

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getUserOrders } from '@/services/order.service';
import { getProfile } from '@/services/profile.service';

export default function ProfilePage() {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersData, profileData] = await Promise.all([
          getUserOrders('completed', 5),
          getProfile(),
        ]);
        setOrders(ordersData);
        setProfile(profileData);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1>欢迎, {profile?.fullName}</h1>
      <p>积分: {profile?.points}</p>
      {/* 渲染订单列表 */}
    </div>
  );
}
```

## Next Steps

1. **测试现有 API Routes**
   ```bash
   npm run dev
   # 使用 Postman 或浏览器测试各个 API 端点
   ```

2. **迁移管理员功能**
   - 创建管理员 API Routes
   - 创建管理员 service 文件
   - 更新管理员 UI 组件

3. **迁移支付功能**
   - 创建支付 webhook API
   - 创建退款 API
   - 更新支付流程

4. **更新 UI 组件**
   - 替换所有 Supabase 调用为新的 service 函数
   - 替换 Supabase Auth 为 NextAuth useSession
   - 测试所有功能流程

5. **性能优化**
   - 添加 API 缓存
   - 实现分页加载
   - 优化数据库查询

## Testing

启动开发服务器后可测试以下端点：

```bash
# 订单
GET http://localhost:3000/api/orders
GET http://localhost:3000/api/orders/{id}

# 套餐
GET http://localhost:3000/api/packages
GET http://localhost:3000/api/packages/user

# 个人资料
GET http://localhost:3000/api/profile
PATCH http://localhost:3000/api/profile

# 积分
GET http://localhost:3000/api/points

# 优惠券
GET http://localhost:3000/api/vouchers/user
POST http://localhost:3000/api/vouchers/redeem

# 推荐
GET http://localhost:3000/api/referrals

# 通知
GET http://localhost:3000/api/notifications
POST http://localhost:3000/api/notifications

# 库存
GET http://localhost:3000/api/inventory
```

## Notes

- 所有 API Routes 都使用 `requireAuth()` 进行认证检查
- 所有 Service 函数都有统一的错误处理
- 所有数据库操作都使用 Prisma Client
- 复杂操作使用事务确保数据一致性
- API 响应格式统一，便于前端处理
- 支持灵活的查询参数，满足不同场景需求

---

**迁移进度：约 60% 完成**  
**下一步：管理员功能迁移 + UI 组件更新**
