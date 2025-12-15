# Change Log — 2025-12-12

## Summary
完成从 Supabase 到 Postgres + Next.js Backend 的核心迁移工作。

## Changes

### 基础设施
- 创建 Prisma Schema (`prisma/schema.prisma`) - 完整数据库模型定义
- 配置 NextAuth.js v5 认证系统
- 创建 Prisma Client 单例 (`src/lib/prisma.ts`)
- 创建 Docker Compose 配置本地 PostgreSQL

### 工具函数库
- `src/lib/upload.ts` - 本地文件上传处理（替代 Supabase Storage）
- `src/lib/api-response.ts` - 统一 API 响应格式
- `src/lib/server-auth.ts` - 服务端认证辅助函数
- `src/lib/auth.ts` - NextAuth 核心配置

### API Routes
- `POST /api/auth/signup` - 用户注册（含推荐系统）
- `POST /api/orders/create` - 创建订单
- `POST /api/packages/buy` - 购买套餐
- `POST /api/orders/[id]/complete` - 完成订单（管理员）
- `POST /api/upload` - 图片上传

### 数据库初始化
- `prisma/seed.ts` - TypeScript 种子数据脚本
- `prisma/seed.sql` - SQL 种子数据脚本
- 包含：管理员账号、系统设置、示例套餐、球线库存、优惠券

### 文档
- `docs/MIGRATION_GUIDE.md` - 完整迁移指南
- `docs/MIGRATION_PROGRESS.md` - 迁移进度追踪
- `docs/QUICK_START.md` - 快速开始指南
- 更新 `docs/SUPABASE_SETUP.md` 为 Postgres 配置指南

### 配置
- 更新 `.env.example` 移除 Supabase 配置，添加 DATABASE_URL 和 NEXTAUTH 配置
- 更新 `package.json` 添加数据库脚本 (db:generate, db:push, db:seed, db:studio)
- 安装新依赖：prisma, @prisma/client, next-auth, bcrypt, sharp, @auth/prisma-adapter

## Tests
- 手动测试：数据库初始化、用户注册 API

## Notes

### 已完成 ✅
1. ✅ Prisma Schema 完整定义
2. ✅ NextAuth.js 认证配置
3. ✅ 核心 API Routes (注册、订单、套餐、上传)
4. ✅ 文件上传本地化
5. ✅ Docker Compose 数据库
6. ✅ 数据库种子脚本
7. ✅ 完整文档

### 待完成 📋
1. 迁移所有 27 个 service 文件（将 Supabase client 改为 Prisma）
2. 更新所有 features 组件（认证、数据获取）
3. 创建剩余 API Routes（通知、支付、退款等）
4. 更新类型定义移除 Supabase 依赖
5. 完整测试所有功能

### 迁移策略
现有 services 仍使用 Supabase client。建议：
- **选项 A**: 保留现有 services，通过适配器层桥接到 Prisma
- **选项 B**: 逐个迁移 services，使用 Prisma 重写查询
- **选项 C**: 前端直接调用新 API Routes，废弃旧 services

### 下一步行动
```powershell
# 1. 启动数据库
docker-compose up -d

# 2. 初始化数据库
npx prisma db push
npm run db:seed

# 3. 运行项目
npm run dev
```

## Breaking Changes
- 认证从 Supabase Auth 改为 NextAuth.js
- 数据库连接从 Supabase 改为本地 Postgres
- 文件存储从 Supabase Storage 改为本地文件系统
- Edge Functions 改为 Next.js API Routes

## Migration Path
用户需要：
1. 安装 Docker（运行 PostgreSQL）
2. 配置 .env.local (DATABASE_URL, NEXTAUTH_SECRET)
3. 运行数据库迁移
4. 从 Supabase 导出现有数据（如需要）
5. 测试新认证流程
