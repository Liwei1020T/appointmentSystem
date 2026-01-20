# Change Log — 2026-01-20

## Summary

生产就绪优化：添加错误边界、Rate Limiting、健康检查端点，修复 localStorage 和配置问题。

## Changes

### 新增功能

- **全局错误边界** (`src/app/error.tsx`, `src/app/global-error.tsx`)
  - 捕获未处理的客户端错误，防止应用白屏
  - 提供重试和返回首页按钮
  - 开发环境显示错误详情

- **健康检查端点** (`/api/health`)
  - 返回服务状态（healthy/unhealthy）
  - 检查数据库连接和延迟
  - 适用于负载均衡器和监控系统

- **API Rate Limiting** (`src/lib/rate-limit/index.ts`)
  - 内存滑动窗口速率限制器
  - 注册 API: 每分钟 5 次
  - OTP 请求: 每分钟 3 次（防止短信轰炸）
  - 返回标准 429 响应和 Retry-After 头

### 修复问题

- **localStorage try-catch** (`LoginPage.tsx`, `MultiRacketBookingFlow.tsx`)
  - 隐私模式下 localStorage 不可用时不再报错

- **ESLint 错误** (4 个文件)
  - 使用 HTML 实体替换未转义引号

### 配置优化

- **next.config.js**
  - 使用 `remotePatterns` 替代已弃用的 `domains`
  - 配置 Supabase 和自托管图片域名

## Files Changed

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/app/error.tsx` | 新增 | 页面级错误边界 |
| `src/app/global-error.tsx` | 新增 | Root Layout 错误边界 |
| `src/app/api/health/route.ts` | 新增 | 健康检查端点 |
| `src/lib/rate-limit/index.ts` | 新增 | Rate Limiting 工具 |
| `src/app/api/auth/signup/route.ts` | 修改 | 添加 Rate Limiting |
| `src/app/api/auth/otp/request/route.ts` | 修改 | 添加 Rate Limiting |
| `src/features/auth/LoginPage.tsx` | 修改 | localStorage try-catch |
| `src/features/booking/MultiRacketBookingFlow.tsx` | 修改 | localStorage try-catch |
| `src/components/FeaturedReviews.tsx` | 修改 | ESLint 修复 |
| `src/features/landing/components/Reviews.tsx` | 修改 | ESLint 修复 |
| `src/features/packages/PackagePurchaseFlow.tsx` | 修改 | ESLint 修复 |
| `src/features/packages/PackagesCenter.tsx` | 修改 | ESLint 修复 |
| `next.config.js` | 修改 | 图片域名配置 |

## Tests

- ✅ `npm run type-check` - 通过
- ✅ `npm run lint` - 无错误（仅警告）
- ✅ `npm run build` - 构建成功

## Deployment Notes

上线前请确保：

1. 设置 `NEXTAUTH_SECRET` 为随机值：`openssl rand -base64 32`
2. 配置数据库连接 `DATABASE_URL`
3. 可选：集成 Sentry 错误监控
