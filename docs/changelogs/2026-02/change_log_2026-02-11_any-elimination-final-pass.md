# Change Log — 2026-02-11

## Summary
完成类型安全最终收口：清理 `src` 内剩余 `any` 用法，统一前后端错误处理为 `unknown` + 类型安全消息提取，并保持 API/页面行为不变。

## Changes

### Added
- 新增实现计划文档：`docs/plans/2026-02-11-any-elimination-final-pass.md`

### Modified
- 清理前端页面与组件中的 `any` 类型断言与 `catch (err: any)`：
  - 认证与预约流程：`src/features/auth/*.tsx`、`src/features/booking/*.tsx`
  - 订单/支付/评价组件：`src/components/**/*.tsx`
  - 首页与管理端局部组件：`src/features/home/*.tsx`、`src/features/admin/AdminReviewsPage.tsx`
- 清理后端 API 中的 `any`：
  - `src/app/api/admin/announcements/route.ts`
  - `src/app/api/admin/announcements/[id]/route.ts`
  - `src/app/api/admin/reports/export/route.ts`
  - `src/app/api/admin/vouchers/route.ts`（`z.any()` → 显式联合类型）
- 补充类型字段：
  - `src/types/database.ts` 为 `StringInventory` 增加 `description?: string | null`
- 泛型表格组件类型强化：
  - `src/components/Table.tsx` 使用 `keyof T` 与安全渲染回退

### Fixed
- `src` 范围 `any` 关键字残留清零（`rg -n "\\bany\\b" src` 无结果）。
- `VoucherSelector` 选择态类型对齐，避免 `UserVoucherWithVoucher` 与 `UserVoucher` 结构不兼容。
- 支付结果页与多处页面错误提示统一从 `unknown` 安全提取。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/features/booking/VoucherSelector.tsx` | Modified | 分组类型显式化，增加 `UserVoucher` 结构适配 |
| `src/components/Table.tsx` | Modified | 泛型列键改为 `keyof T`，移除 `any` 访问 |
| `src/app/api/admin/vouchers/route.ts` | Modified | `validityDays` 校验从 `z.any()` 改为联合类型 |
| `src/app/api/admin/announcements/route.ts` | Modified | `catch` 改为 `unknown` + json 响应类型守卫 |
| `src/app/api/admin/announcements/[id]/route.ts` | Modified | `catch` 改为 `unknown` + json 响应类型守卫 |
| `src/app/api/admin/reports/export/route.ts` | Modified | 导出异常处理改为 `unknown` 安全消息提取 |
| `src/features/auth/LoginPage.tsx` | Modified | 会话角色读取移除 `as any` |
| `src/features/auth/SignupPage.tsx` | Modified | 注册错误处理改为 `unknown` |
| `src/features/auth/ForgotPasswordPage.tsx` | Modified | OTP 流程错误处理改为 `unknown` |
| `src/features/auth/ProfilePage.tsx` | Modified | 资料/密码更新错误处理改为 `unknown` |
| `src/features/payment/PaymentResultPage.tsx` | Modified | 支付状态与数据模型类型化 |
| `src/types/database.ts` | Modified | `StringInventory` 增加 `description` 字段 |

## API Changes
- 无外部契约变更，仅输入校验与错误处理实现方式增强。

## Database Changes
- 无数据库 schema 变更。

## Testing
- [x] 类型检查通过 (`npm run type-check`)
- [x] Lint 检查通过（存在历史 warning，无 error） (`npm run lint`)
- [x] 测试通过 (`npm run test:run`)
- [x] 构建成功 (`npm run build`)
