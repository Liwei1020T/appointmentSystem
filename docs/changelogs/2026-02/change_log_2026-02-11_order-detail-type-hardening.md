# Change Log — 2026-02-11

## Summary

完成订单详情相关页面的类型安全加固，移除用户端/管理员端详情页中的高密度 `any`，并提取可复用的订单详情工具函数与测试。

## Changes

### Added
- 新增 `src/lib/orderDetailUtils.ts`，统一处理：
  - 支付记录选择（`pickRelevantPayment`）
  - 状态日志规范化（`normalizeStatusLogs`）
  - 服务方式/地址解析
  - 管理端状态到进度状态映射
- 新增 `src/__tests__/orderDetailUtils.test.ts`，覆盖支付选择、状态日志规范化、状态映射。

### Modified
- `src/features/orders/OrderDetailPage.tsx`
  - 移除页面内 `any` 使用，改为显式类型与工具函数。
  - 实时更新回调改为类型化处理（兼容 polling 与 legacy payload）。
  - 时间线、支付状态、服务方式、球拍清单读取改为类型安全路径。
- `src/components/admin/AdminOrderDetailPage.tsx`
  - 移除页面内 `any` 使用，改为显式类型与工具函数。
  - 支付信息读取统一使用 `pickRelevantPayment`。
  - 管理进度组件入参改为类型化映射（不再使用 `as any`）。
- `src/components/OrderSummaryCard.tsx`
  - 支付/球拍字段改为显式接口。
  - 金额支持 `number|string|Decimal-like`，新增安全解析函数。

### Fixed
- 修复管理员详情页在多支付记录场景下支付记录选择不稳定的问题（优先直接支付记录，否则按时间挑选最新有效记录）。
- 修复订单详情页在蛇形/驼峰字段混用情况下的状态日志与时间字段读取不稳定问题。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/lib/orderDetailUtils.ts` | Added | 订单详情类型工具函数 |
| `src/__tests__/orderDetailUtils.test.ts` | Added | 订单详情工具函数测试 |
| `src/features/orders/OrderDetailPage.tsx` | Modified | 用户端订单详情去 `any` 与类型加固 |
| `src/components/admin/AdminOrderDetailPage.tsx` | Modified | 管理端订单详情去 `any` 与类型加固 |
| `src/components/OrderSummaryCard.tsx` | Modified | 摘要卡金额与支付类型加固 |

## API Changes

无 API 协议变更（前端类型与展示逻辑加固）。

## Database Changes

无。

## Testing
- [x] 类型检查通过（`npm run type-check`）
- [x] Lint 检查通过（`npm run lint`，仍有历史 warning）
- [x] 测试通过（`npm run test:run`，25 文件 63 测试）
- [x] 构建成功（`npm run build`）
