# 从 Supabase 迁移到 Postgres + Next.js 后端

## 🚀 快速开始

### 1. 启动 Postgres 数据库

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 检查状态
docker-compose ps
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
copy .env.example .env

# 编辑 .env，填写必要配置
# 最少需要设置：
# - DATABASE_URL
# - NEXTAUTH_SECRET (生成方法见下)
```

生成 NEXTAUTH_SECRET:
```bash
# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# 或在线生成
# https://generate-secret.vercel.app/32
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库表
npx prisma db push

# （可选）查看数据库
npx prisma studio
```

### 4. 运行项目

```bash
npm run dev
```

---

## 📦 已完成的迁移

✅ 安装依赖 (Prisma, NextAuth.js, bcrypt, sharp)  
✅ 创建 Prisma Schema  
✅ 配置 NextAuth.js  
✅ 创建 Prisma Client 工具  
✅ 更新环境变量配置  
✅ 创建 Docker Compose 配置  

---

## 🔄 待迁移项目

### 代码迁移优先级

#### 高优先级（核心功能）
1. **认证系统**
   - `src/features/auth/*` - 登录/注册页面
   - 从 Supabase Auth → NextAuth.js

2. **订单管理**
   - `src/features/orders/*`
   - `src/services/orderService.ts`
   - Supabase client → Prisma

3. **库存管理**
   - `src/features/admin/inventory/*`
   - `src/services/adminInventoryService.ts`

#### 中优先级
4. **套餐系统**
   - `src/features/packages/*`
   - `src/services/packageService.ts`

5. **支付系统**
   - `src/features/payment/*`
   - `src/services/paymentService.ts`
   - Edge Functions → API Routes

6. **积分&优惠券**
   - `src/features/points/*`
   - `src/features/vouchers/*`

#### 低优先级
7. **通知系统**
   - `src/services/notificationService.ts`
   - Edge Function → API Route

8. **推荐系统**
   - `src/features/referrals/*`

---

## 🔧 迁移指南

### Supabase Client → Prisma

**旧代码 (Supabase):**
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId);
```

**新代码 (Prisma):**
```typescript
import { prisma } from '@/lib/prisma';

const orders = await prisma.order.findMany({
  where: { userId },
});
```

### 认证检查

**旧代码:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

**新代码:**
```typescript
import { auth } from '@/lib/auth';

const session = await auth();
const user = session?.user;
```

### 文件上传

**旧代码 (Supabase Storage):**
```typescript
const { data } = await supabase.storage
  .from('receipts')
  .upload(`${userId}/${filename}`, file);
```

**新代码 (本地存储):**
```typescript
// 见 src/lib/upload.ts（待创建）
import { saveFile } from '@/lib/upload';

const filePath = await saveFile(file, 'receipts');
// 保存到 public/uploads/receipts/xxx.jpg
```

---

## 📂 新增文件

- `prisma/schema.prisma` - 数据库 schema
- `src/lib/auth.ts` - NextAuth 配置
- `src/lib/prisma.ts` - Prisma client
- `src/app/api/auth/[...nextauth]/route.ts` - 认证 API
- `docker-compose.yml` - 本地 Postgres
- `.env.example` - 更新的环境变量模板

---

## 🗄️ 数据迁移

如果你有现有的 Supabase 数据需要迁移：

1. 从 Supabase 导出数据
```bash
# 在 Supabase SQL Editor 执行
# 或使用 pg_dump
```

2. 导入到本地 Postgres
```bash
psql -h localhost -U postgres -d string_service < dump.sql
```

3. 使用 Prisma 同步
```bash
npx prisma db pull  # 从数据库生成 schema
npx prisma generate # 生成 client
```

---

## 🐛 常见问题

### Q: Prisma Client 找不到？
```bash
npx prisma generate
```

### Q: 数据库连接失败？
检查 Docker 是否运行：
```bash
docker-compose ps
```

### Q: NextAuth 报错？
确保 NEXTAUTH_SECRET 已设置在 .env

### Q: 类型错误？
```bash
npx prisma generate
npm run build
```

---

## 📝 下一步

1. 创建文件上传工具 (`src/lib/upload.ts`)
2. 迁移认证相关代码
3. 迁移核心 service 层
4. 将 Edge Functions 转为 API Routes
5. 更新前端调用

---

需要帮助？查看：
- [Prisma 文档](https://www.prisma.io/docs)
- [NextAuth.js 文档](https://next-auth.js.org/)
- [项目 ERD](./erd.md)
