# Change Log — 2026-02-11

## Summary
完成金融相关端点限流补强，并在文件上传链路增加 Magic Byte 内容签名校验，阻断 MIME 伪造上传风险。

## Changes

### Added
- 在 `src/lib/upload.ts` 新增图片文件头签名校验（JPEG/PNG/GIF/WebP）。
- 新增安全回归测试：
  - `src/__tests__/uploadMagicBytes.test.ts`
  - `src/__tests__/financialRouteRateLimit.test.ts`

### Modified
- 在以下金融相关 API 接入 `financialLimiter`：
  - `src/app/api/payments/route.ts`
  - `src/app/api/payments/cash/route.ts`
  - `src/app/api/payments/[id]/proof/route.ts`
  - `src/app/api/payments/[id]/receipt/route.ts`
  - `src/app/api/vouchers/redeem/route.ts`
  - `src/app/api/vouchers/redeem-with-points/route.ts`
  - `src/app/api/orders/create/route.ts`
  - `src/app/api/points/redeem/route.ts`
- `saveFile` 现会在写盘前验证图片 MIME 与内容签名一致性。

### Fixed
- 修复“金融端点缺少速率限制”安全缺口。
- 修复“上传文件仅依赖 MIME 类型”安全缺口。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/lib/upload.ts` | Modified | 增加 Magic Byte 校验并接入保存流程 |
| `src/app/api/payments/route.ts` | Modified | 新增支付创建限流 |
| `src/app/api/payments/cash/route.ts` | Modified | 新增现金支付限流 |
| `src/app/api/payments/[id]/proof/route.ts` | Modified | 新增凭证上传限流 |
| `src/app/api/payments/[id]/receipt/route.ts` | Modified | 新增回执记录限流 |
| `src/app/api/vouchers/redeem/route.ts` | Modified | 新增兑换限流 |
| `src/app/api/vouchers/redeem-with-points/route.ts` | Modified | 新增积分兑换限流 |
| `src/app/api/orders/create/route.ts` | Modified | 新增旧下单入口限流 |
| `src/app/api/points/redeem/route.ts` | Modified | 新增积分兑换限流 |
| `src/__tests__/uploadMagicBytes.test.ts` | Added | 覆盖 Magic Byte 校验行为 |
| `src/__tests__/financialRouteRateLimit.test.ts` | Added/Modified | 覆盖 8 个金融端点限流 429 回归 |

## API Changes
- 所有以上端点在触发限流时返回 `429`（含统一限流响应）。
- 上传图片内容签名与 MIME 不一致时，接口返回错误并拒绝写盘。

## Database Changes
- 无

## Testing
- [x] 类型检查通过（`npm run type-check`）
- [x] Lint 检查通过（`npm run lint`，存在既有 warning）
- [x] 测试通过（`npm run test:run`）
- [x] 构建成功（`npm run build`）
