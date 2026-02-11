# Change Log — 2026-02-11

## Summary
收敛订单列表与套餐卡片的类型安全问题，移除关键路径 `any`，并修复用户订单轮询更新结构兼容性（`data[]` / `data.orders[]`）。

## Changes

### Added
- 新增 `extractOrderUpdatesFromPayload`，统一解析订单轮询响应结构。
- 新增 `src/__tests__/realtimeService.test.ts` 覆盖轮询解析兼容逻辑。

### Modified
- `OrderList`：替换 `any` 回调与支付判定逻辑，加入严格 payload type guard。
- `RealtimeOrderProvider`：替换 `any`，支持 polling payload 状态变更通知。
- `PackageCard`：移除 `(pkg as any)`，改为明确扩展元数据类型。
- `orderService`：补充订单详情嵌套字段类型定义，去除多个 `any` 占位。
- `OrderSummaryCard`：兼容 `order.string` 为空的场景。

### Fixed
- 修复 `/api/orders` 轮询结果在 `realtimeService` 中仅读取 `data.orders` 导致更新丢失的问题。
- 修复订单状态更新路径中的类型不收敛问题（`newData.status` 等）。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/services/realtimeService.ts` | Modified | 增加响应提取函数并兼容两类 payload |
| `src/features/orders/OrderList.tsx` | Modified | 移除 `any`，补齐 type guard 与状态更新 |
| `src/components/RealtimeOrderProvider.tsx` | Modified | 轮询通知逻辑改为强类型 |
| `src/components/PackageCard.tsx` | Modified | 移除 `pkg as any` 并保留现有展示逻辑 |
| `src/services/orderService.ts` | Modified | 细化 `OrderWithDetails` 类型 |
| `src/components/OrderSummaryCard.tsx` | Modified | 允许 `order.string` 为 `null` |
| `src/__tests__/realtimeService.test.ts` | Added | 新增解析兼容性测试 |

## API Changes
- 无 API 协议变更（仅客户端轮询解析兼容增强）。

## Database Changes
- 无数据库变更。

## Testing
- [x] 类型检查通过（`npm run type-check`）
- [x] Lint 检查通过（`npm run lint`）
- [x] 测试通过（`npm run test:run`）
- [x] 构建成功（`npm run build`）
