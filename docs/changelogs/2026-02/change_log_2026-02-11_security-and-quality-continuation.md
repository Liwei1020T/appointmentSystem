# Change Log — 2026-02-11

## Summary
继续推进系统审查整改：补齐管理员优惠券更新/删除输入校验、统一关键路径错误类型、强化 OTP 启动期安全校验、增强中间件安全响应头，并将审查中提到的 `<img>` 使用集中迁移为 `AppImage` 包装组件。

## Changes

### Added
- 新增 `src/components/AppImage.tsx`，统一封装 Next.js `Image`，默认 `unoptimized` 以兼容当前混合图片来源。

### Modified
- `src/app/api/admin/vouchers/route.ts`
  - 为 `PATCH` / `DELETE` 增加 Zod schema 校验。
  - 统一 snake_case/camelCase 字段兼容与规范化处理。
  - 补充百分比优惠、日期范围等约束校验逻辑。
- `src/app/api/admin/users/[id]/points/route.ts`
  - 将 “用户不存在” 从普通 `Error` 改为 `AppError('NOT_FOUND')`。
- `src/app/api/auth/signup/route.ts`
  - 推荐码生成失败改为 `AppError('INTERNAL_ERROR')`。
- `src/lib/otp.ts`
  - 将密钥校验前置到模块初始化阶段（启动期即失败/警告），减少运行期延迟暴露风险。
- `src/middleware.ts`
  - 增加 `Content-Security-Policy`、`Permissions-Policy`、生产环境 `Strict-Transport-Security`。
- `src/services/authService.ts`
  - 将残余 `throw new Error(...)` 统一替换为 `AppError`（注册/登录/OTP/重置密码及 hook 误用提示）。
- `src/services/paymentService.ts`
  - 支付详情解析失败、上传凭证失败统一改为 `AppError`，保持结构化错误语义。
- 图片组件迁移（`<img>` → `AppImage`）：
  - `src/components/PaymentReceiptUploader.tsx`
  - `src/features/reviews/ReviewDetailPage.tsx`
  - `src/features/orders/OrderDetailPage.tsx`
  - `src/components/ImageUploader.tsx`
  - `src/components/ImagePreview.tsx`
  - `src/components/OrderPhotosUpload.tsx`
  - `src/features/booking/RacketPhotoUploader.tsx`
  - `src/features/booking/MultiRacketBookingFlow.tsx`
  - `src/components/EventCard.tsx`
  - `src/features/booking/components/StringCard.tsx`
  - `src/features/admin/AdminReviewsPage.tsx`
  - `src/components/admin/PaymentVerificationPage.tsx`
  - `src/components/admin/AdminInventoryDetailPage.tsx`
  - `src/components/admin/PaymentReceiptVerifier.tsx`
  - `src/components/admin/AdminOrderDetailPage.tsx`
  - `src/components/admin/OrderPhotosUploader.tsx`
- 文档更新：
  - `docs/guides/MIDDLEWARE.md`（补充 CSP/HSTS 说明）
  - `docs/core/components.md`（补充 `AppImage` 组件条目）

### Fixed
- 消除 `src` + `prisma` 范围内残余 `as any`（`prisma/seed.ts` 迁移到 `MembershipTier` 强类型）。
- 消除 API / server services 路径残余 `throw new Error(...)`。
- `no-img-element` 警告显著下降（审查点中的 23 处 `<img>` 已迁移）。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/components/AppImage.tsx` | Added | 图片统一封装组件 |
| `src/app/api/admin/vouchers/route.ts` | Modified | PATCH/DELETE Zod 校验与字段规范化 |
| `src/app/api/admin/users/[id]/points/route.ts` | Modified | 使用 AppError 返回结构化错误 |
| `src/app/api/auth/signup/route.ts` | Modified | 推荐码生成失败改为 AppError |
| `src/lib/otp.ts` | Modified | 启动期密钥校验 |
| `src/middleware.ts` | Modified | 安全响应头增强 |
| `src/services/authService.ts` | Modified | 客户端认证服务统一抛出 AppError |
| `src/services/paymentService.ts` | Modified | 支付服务关键错误统一抛出 AppError |
| `prisma/seed.ts` | Modified | 移除 `as any`，改用枚举强类型 |
| `docs/guides/MIDDLEWARE.md` | Modified | 同步安全头文档 |
| `docs/core/components.md` | Modified | 同步 `AppImage` 组件文档 |

## API Changes
- 无新增端点。
- 仅增强既有管理端接口参数校验与错误语义，保持向后兼容。

## Database Changes
- 无本轮新增 schema 变更（延续此前已完成的索引/约束优化）。

## Testing
- [x] 类型检查通过（`npm run type-check`）
- [x] Lint 检查通过（`npm run lint -- --format compact`，0 warning / 0 error）
- [x] 测试通过（`npm run test:run`，120/120）
- [x] 构建成功（`npm run build`）
