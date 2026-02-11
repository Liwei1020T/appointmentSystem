# Change Log — 2026-02-11

## Summary
完成 `adminOrderService` 类型加固：移除服务内 `any`，统一错误提取为 `unknown` 类型守卫，并为订单列表与分页字段增加运行时归一化，避免异常 payload 透传到 UI。

## Changes

### Added
- 新增 `src/__tests__/adminOrderService.test.ts`：
  - 覆盖订单列表 payload 异常结构（`orders` 非数组）时的兜底行为。
  - 覆盖分页总数字段字符串输入时的数字归一化。
  - 覆盖请求异常抛出字符串时的错误消息透传。

### Modified
- `src/services/adminOrderService.ts`
  - 新增 `AdminOrderListPayload`、`UpdateOrderEtaPayload` 类型，替换弱约束 payload。
  - 新增 `toNumber`、`normalizeOrderList`、`getErrorMessage` 工具函数。
  - 所有 `catch (error: any)` 改为 `catch (error: unknown)`。
  - `getAllOrders`、`searchOrders` 增加 `orders` 与 `pagination.total` 归一化。
  - `updateOrderEta` 在缺失 `order` 字段时回退为 `null`，返回值更稳定。

### Fixed
- 修复订单列表接口在服务端返回异常结构时可能透传非法 `orders` 值的问题。
- 修复订单详情请求异常抛字符串时错误消息丢失的问题。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/services/adminOrderService.ts` | Modified | 移除 `any`，增强错误处理与 payload 归一化 |
| `src/__tests__/adminOrderService.test.ts` | Added | admin 订单服务类型归一化与错误处理单测 |

## API Changes
- 无。

## Database Changes
- 无。

## Testing
- [x] `npm run type-check`
- [x] `npm run lint`
- [x] `npm run test:run`
- [x] `npm run build`
