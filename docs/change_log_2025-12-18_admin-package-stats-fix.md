# Change Log — 2025-12-18

## Summary
Fixed admin “套餐管理”页面统计与销售数据一直为 0 的问题：将 `/api/admin/packages/stats` 与 `/api/admin/packages/sales` 从占位实现改为真实数据聚合。

## Changes
- API: `GET /api/admin/packages/stats` 统计套餐总数、上架数、总购买数、总收入、本月购买数、本月收入、最受欢迎套餐（按已确认支付聚合）。
- API: `GET /api/admin/packages/sales` 返回每个套餐的销量/收入/活跃用户（按已确认支付聚合），支持 `startDate/endDate/packageId` 筛选。
- API: `GET/POST/PATCH /api/admin/packages` 兼容 `validityDays` 与 `validity_days`，并在返回中补齐 `validity_days` 等别名字段，修复管理端“有效期只显示 天”的数据问题。
- Docs: `docs/api_spec.md` 更新为“已实现端点”，移除相关占位说明。

## Data Rules
统计口径与现有支付状态保持一致：
- 仅统计已确认的套餐支付：`payments.packageId != null` 且 `payments.status in ['success','completed']`
- 销量 = 支付记录数量
- 收入 = `payments.amount` 求和
- 活跃用户 = `userId` 去重数量

## Impact
- 管理员可在“套餐管理”正确看到总销售量、总收入、本月数据与最受欢迎套餐。
- 每个套餐卡片可正确显示销量、销售额与活跃用户数。

## Tests
- Manual: 在数据库存在已确认套餐支付记录（status=success/completed）时，打开 `/admin/packages`，统计卡与各套餐卡片数据不为 0 且与支付记录一致。
- Manual: 访问 `GET /api/admin/packages/sales?packageId=<id>` 返回该套餐聚合数据。
