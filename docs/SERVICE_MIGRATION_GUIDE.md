# Service 迁移指南

本文档说明如何将现有的 Supabase client 调用迁移到新的 Prisma + API Routes 架构。

## 迁移模式对照

### 1. 数据查询

**Supabase 方式：**
```typescript
const { data, error } = await supabase
  .from('orders')
  .select('*, string_inventory(*), payments(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

if (error) throw error;
return data;
```

**Prisma 方式（API Route）：**
```typescript
// API Route: src/app/api/orders/route.ts
const orders = await prisma.order.findMany({
  where: { userId: user.id },
  include: {
    string: true,
    payments: true,
  },
  orderBy: { createdAt: 'desc' },
});
```

**Service 层调用：**
```typescript
// src/services/order.service.ts
export async function getUserOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.data;
}
```

### 2. 数据插入

**Supabase 方式：**
```typescript
const { data, error } = await supabase
  .from('orders')
  .insert({
    user_id: userId,
    string_id: stringId,
    status: 'pending',
  })
  .select()
  .single();
```

**Prisma 方式（API Route）：**
```typescript
const order = await prisma.order.create({
  data: {
    userId: user.id,
    stringId,
    status: 'pending',
  },
});
```

**Service 层调用：**
```typescript
export async function createOrder(data: CreateOrderData) {
  const response = await fetch('/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result.data;
}
```

### 3. 数据更新

**Supabase 方式：**
```typescript
const { error } = await supabase
  .from('orders')
  .update({ status: 'completed' })
  .eq('id', orderId);
```

**Prisma 方式（API Route）：**
```typescript
await prisma.order.update({
  where: { id: orderId },
  data: { status: 'completed' },
});
```

### 4. 事务操作

**Supabase 方式：**
```typescript
// Supabase 不支持原生事务，需要手动回滚
```

**Prisma 方式：**
```typescript
await prisma.$transaction(async (tx) => {
  await tx.order.update({
    where: { id: orderId },
    data: { status: 'completed' },
  });
  
  await tx.user.update({
    where: { id: userId },
    data: { points: { increment: 10 } },
  });
  
  await tx.pointsLog.create({
    data: {
      userId,
      amount: 10,
      type: 'earn',
      referenceId: orderId,
    },
  });
});
```

### 5. 认证

**Supabase Auth 方式：**
```typescript
// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser();

// 登出
await supabase.auth.signOut();
```

**NextAuth 方式：**
```typescript
// 登录
import { signIn } from 'next-auth/react';
await signIn('credentials', { email, password });

// 获取当前用户（在组件中）
import { useSession } from 'next-auth/react';
const { data: session } = useSession();
const user = session?.user;

// 登出
import { signOut } from 'next-auth/react';
await signOut();

// 服务端获取用户（API Route）
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);
```

### 6. 文件上传

**Supabase Storage 方式：**
```typescript
const { data, error } = await supabase.storage
  .from('order-photos')
  .upload(`${userId}/${fileName}`, file);

const { data: { publicUrl } } = supabase.storage
  .from('order-photos')
  .getPublicUrl(data.path);
```

**本地存储方式：**
```typescript
// API Route: src/app/api/upload/route.ts
import { saveFile } from '@/lib/upload';

const file = formData.get('file') as File;
const buffer = Buffer.from(await file.arrayBuffer());
const filePath = await saveFile(buffer, 'order-photos');

// 返回路径: /uploads/order-photos/xxx.jpg
```

**Service 层调用：**
```typescript
export async function uploadPhoto(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'order-photos');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.data.url; // /uploads/order-photos/xxx.jpg
}
```

## 已迁移的 Service 文件

以下 service 文件已完成迁移，可直接使用：

- ✅ `src/services/auth.service.ts` - 认证服务
- ✅ `src/services/order.service.ts` - 订单服务
- ✅ `src/services/package.service.ts` - 套餐服务
- ✅ `src/services/profile.service.ts` - 个人资料服务
- ✅ `src/services/voucher.service.ts` - 优惠券服务
- ✅ `src/services/inventory.service.ts` - 库存服务
- ✅ `src/services/notification.service.ts` - 通知服务

## 待迁移的 Service 文件

以下文件需要迁移（如果存在）：

- ⏳ `src/services/payment.service.ts`
- ⏳ `src/services/review.service.ts`
- ⏳ `src/services/admin.service.ts`
- ⏳ 其他自定义 service 文件

## 迁移步骤

### Step 1: 创建 API Route

在 `src/app/api/` 下创建对应的 API Route：

```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // 使用 Prisma 查询
    const data = await prisma.yourTable.findMany({
      where: { userId: user.id },
    });

    return successResponse(data);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
```

### Step 2: 创建 Service 函数

在 `src/services/` 下创建调用 API 的函数：

```typescript
// src/services/your.service.ts
export async function getData() {
  const response = await fetch('/api/your-endpoint');
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || '操作失败');
  }
  
  return result.data;
}
```

### Step 3: 更新组件调用

在组件中使用新的 service 函数：

```typescript
// 旧代码
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('table').select();

// 新代码
import { getData } from '@/services/your.service';
const data = await getData();
```

## 常见问题

### Q: 如何处理实时订阅？
A: Supabase Realtime 需要替换为其他方案：
- 使用 Polling（定时轮询）
- 使用 WebSocket
- 使用 Server-Sent Events (SSE)

### Q: 如何处理 RPC 函数？
A: 将 Supabase RPC 函数改为 API Route + Prisma 原生查询：
```typescript
// 原 RPC: supabase.rpc('calculate_revenue')
// 改为: await fetch('/api/admin/calculate-revenue')
```

### Q: 字段名称不匹配怎么办？
A: Prisma schema 使用 camelCase，数据库使用 snake_case：
```prisma
model User {
  fullName String @map("full_name")
  @@map("users")
}
```

### Q: 如何迁移复杂的 JOIN 查询？
A: 使用 Prisma 的 `include` 和 `select`：
```typescript
const result = await prisma.order.findMany({
  include: {
    user: {
      select: { email: true, fullName: true }
    },
    payments: true,
  }
});
```

## 测试检查清单

迁移完成后，请测试：

- [ ] 用户注册/登录/登出
- [ ] 订单创建/查询/更新
- [ ] 套餐购买/查询
- [ ] 优惠券领取/使用
- [ ] 文件上传/下载
- [ ] 通知系统
- [ ] 积分系统
- [ ] 推荐系统
- [ ] 管理员功能

## 参考资料

- [Prisma 文档](https://www.prisma.io/docs)
- [NextAuth.js 文档](https://next-auth.js.org)
- [Next.js API Routes 文档](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) - 完整迁移报告
