# Change Log — 2025-01-22

## Summary
实现了管理员手动设置/覆盖订单预计完成时间 (ETA) 的功能。

## Changes

### 新增功能: 管理员 ETA 编辑
- **新增 API**: `PATCH /api/admin/orders/[id]/eta`
  - 允许管理员更新订单的预计完成时间
  - 支持设置具体日期时间或恢复系统自动计算（传 null）
  - 使用 Zod 进行请求体验证

- **后端服务层**: `src/server/services/admin-order.service.ts`
  - 新增 `updateOrderEta()` 函数
  - 更新 `getAdminOrderById()` 返回 `queuePosition` 字段

- **前端服务层**: `src/services/adminOrderService.ts`
  - 新增 `updateOrderEta()` 函数调用后端 API

- **UI 组件**: `src/components/admin/AdminOrderProgress.tsx`
  - 新增 ETA 显示区域（显示预计完成时间、队列位置）
  - 新增"编辑"按钮打开日期时间选择模态框
  - 支持保存自定义 ETA 或恢复系统计算
  - 集成原生日期/时间选择器
  - 添加加载状态和错误处理

- **AdminOrderDetailPage**: 传递 `estimatedCompletionAt` 和 `queuePosition` props

## New Files
- `src/app/api/admin/orders/[id]/eta/route.ts` - ETA 更新 API 端点

## Updated Files
- `src/server/services/admin-order.service.ts` - 添加 updateOrderEta 函数，更新 getAdminOrderById
- `src/services/adminOrderService.ts` - 添加前端 updateOrderEta 服务
- `src/components/admin/AdminOrderProgress.tsx` - 添加 ETA 显示和编辑 UI
- `src/components/admin/AdminOrderDetailPage.tsx` - 传递 ETA 相关 props

## Tests
- TypeScript 检查通过
- 现有测试全部通过（18 个测试）

## How to Test

### 管理员 ETA 编辑功能
1. 登录管理员账户
2. 进入订单详情页（未完成订单）
3. 在"服务进度"区域查看 ETA 显示卡片
4. 点击"编辑"按钮
5. 选择新的日期和时间
6. 点击"保存"
7. 验证 ETA 已更新
8. 用户端订单详情页应显示更新后的 ETA

### 恢复系统计算
1. 打开 ETA 编辑模态框
2. 点击"恢复系统自动计算"
3. 验证 ETA 恢复为系统计算的值

### 边界情况
- 已完成/已取消订单不应显示 ETA 编辑区域
- 不能选择过去的日期

## Notes
- ETA 编辑功能仅对未完成且未取消的订单可用
- 恢复系统计算时，会根据当前队列情况重新计算 ETA
- 队列位置基于订单创建时间动态计算

---

## 优化应用: OptimizedImage 和 Badge interactive

### 变更说明
将之前创建但未使用的优化组件应用到实际场景：

### OptimizedImage 应用
- **文件**: `src/components/OrderPhotosDisplay.tsx`
  - 照片网格缩略图改用 `OptimizedImage` 组件
  - 启用懒加载 (`lazy={true}`)，提升页面加载性能
  - Lightbox 底部缩略图导航也改用 `OptimizedImage`

### Badge interactive 应用
- **文件**: `src/features/orders/OrderList.tsx`
  - 套餐标签、优惠标签改用 `Badge` 组件
  - 状态操作标签 (待付款、处理中等) 改用 `Badge` 组件
  - ETA 信息 chips 改用 `Badge` 组件
  - 所有 Badge 添加 `interactive` prop，确保 44px 触控热区

### 改善效果
- **性能提升**: 图片懒加载减少初始页面加载时间
- **渐进式加载**: 图片加载时显示骨架屏动画
- **可访问性**: 44px 触控热区符合移动端可访问性标准
- **一致性**: 使用统一的 Badge 组件保持视觉一致性

