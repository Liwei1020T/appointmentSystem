# Change Log — 2026-01-30

## Summary
修复后端已实现但前端未使用的功能浪费，添加徽章系统 UI、实时订单更新、Cron 监控面板和补货建议 UI。同时清理了多处死代码。

## Changes

### Added
1. **徽章系统 UI** - 在用户资料页展示成就徽章
   - 添加 `getUserBadges()` 到 profileService
   - 在 ProfilePage.tsx 添加徽章展示区域
   - 显示已获得和未获得徽章，包含获得日期

2. **实时订单更新** - 实现基于 polling 的订单状态更新
   - 重写 realtimeService.ts，实现 10 秒轮询机制
   - `subscribeToOrderUpdates()` 订阅单个订单更新
   - `subscribeToUserOrders()` 订阅用户所有订单更新

3. **Cron 任务监控面板** - 管理员可查看和手动触发定时任务
   - 新增 `/api/admin/cron/status` API 获取任务状态
   - 新增 `/admin/cron` 管理页面
   - 支持手动执行订单自动化、套餐续费提醒、清理超时订单
   - 在管理端侧边栏添加入口

4. **补货建议 UI** - 展示智能补货建议
   - 新增 `/admin/inventory/restock` 页面
   - 按优先级（紧急/高/中/低）展示补货建议
   - 显示预估成本和利润
   - 在库存管理页面添加入口按钮

### Removed (Dead Code Cleanup)
1. **tngPaymentService.ts** - 移除未使用的函数
   - `verifyTngPayment()` - 调用不存在的 API
   - `getTngQRCode()` - 调用不存在的 API
   - 保留 `handleTNGCallback()` 供 webhook 使用

2. **adminOrderService.ts** - 移除未使用的函数
   - `assignOrderPhotographer()` - 调用不存在的 API
   - `updateOrderPhotos()` - 从未被调用

3. **/api/admin/stats** - 删除未使用的 API
   - 与 `/api/admin/dashboard-stats` 功能重复
   - 同时删除 `getAdminStats()` 函数

4. **AdminOrderDetailPage.tsx** - 移除未使用的 import
   - `updateOrderPhotos` 仅 import 未调用

### Modified
- `src/features/profile/ProfilePage.tsx` - 添加徽章展示区域
- `src/services/profileService.ts` - 添加 getUserBadges 函数
- `src/services/realtimeService.ts` - 从空壳改为 polling 实现
- `src/app/admin/layout.tsx` - 添加 Cron 监控导航入口
- `src/components/admin/AdminInventoryListPage.tsx` - 添加补货建议按钮

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/features/profile/ProfilePage.tsx` | Modified | 添加徽章展示区域 |
| `src/services/profileService.ts` | Modified | 添加 getUserBadges 函数和类型 |
| `src/services/realtimeService.ts` | Modified | 实现 polling 机制 |
| `src/services/tngPaymentService.ts` | Modified | 移除死代码，保留必要函数 |
| `src/services/adminOrderService.ts` | Modified | 移除未使用的函数 |
| `src/server/services/stats.service.ts` | Modified | 移除 getAdminStats 函数 |
| `src/components/admin/AdminOrderDetailPage.tsx` | Modified | 移除未使用的 import |
| `src/app/api/admin/cron/status/route.ts` | Added | Cron 状态汇总 API |
| `src/app/admin/cron/page.tsx` | Added | Cron 监控页面 |
| `src/app/admin/layout.tsx` | Modified | 添加 Cron 监控导航 |
| `src/app/admin/inventory/restock/page.tsx` | Added | 补货建议页面 |
| `src/components/admin/AdminInventoryListPage.tsx` | Modified | 添加补货建议按钮 |
| `src/app/api/admin/stats/route.ts` | Deleted | 移除未使用的 API |

## API Changes
- `GET /api/admin/cron/status` - 新增，获取所有 cron 任务状态
- `GET /api/admin/stats` - 删除，使用 `/api/admin/dashboard-stats` 替代

## Testing
- [x] 类型检查通过 (npm run type-check)
- [x] Lint 检查通过 (仅 warning)

## Notes
- 实时更新使用 10 秒 polling 而非 WebSocket，避免额外基础设施
- 会员详情展示已完整实现，无需修改
- 徽章数据需要通过 seed 初始化 TierBenefit 表
- TNG 支付当前使用手动流程（扫码+上传收据），自动回调功能预留
