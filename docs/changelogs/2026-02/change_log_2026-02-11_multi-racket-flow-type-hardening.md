# Change Log — 2026-02-11

## Summary
对多球拍下单流程进行类型安全加固，移除 `MultiRacketBookingFlow` 中全部 `any`，统一复单数据和优惠券兼容字段解析。

## Changes

### Modified
- `src/features/booking/MultiRacketBookingFlow.tsx`
  - 移除 `userPackages`、复单构建、上传错误处理、优惠券折扣计算、提交错误处理中的 `any`。
  - 新增 `RepeatOrderLike`、`RepeatOrderItemLike`、`VoucherWithLegacyFields` 等显式类型。
  - 新增 `toNumberValue`、`toErrorMessage`、`normalizeServiceType` 工具函数。
  - 将 `getUserPackages()` 改为 `getUserPackages('active')`，并按 `remaining` 过滤。

### Fixed
- 修复复单/优惠券解析依赖 `any` 导致的类型保护缺失问题。
- 保持 snake_case / camelCase 双字段兼容（如 `service_type`、`pickup_address`、`discount_type`）。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/features/booking/MultiRacketBookingFlow.tsx` | Modified | 多球拍流程类型重构，移除 `any` |

## API Changes
- 无。

## Database Changes
- 无。

## Testing
- [x] `npm run type-check`
- [x] `npm run lint`
- [x] `npm run test:run`
- [x] `npm run build`
