# Change Log — 2025-01-21

## Summary
实现了优化 backlog 中的 P1 和 P2 任务，包括模板照片安全确认、ETA 队列标准化、触控优化、可访问性增强、性能优化和测试基础设施。

## Changes

### P1-4: 模板库安全替换确认
- **新增组件**: `src/components/ConfirmDialog.tsx`
  - 通用确认对话框组件，支持 warning/danger/info 三种样式
  - 包含标题、消息、详情区域和操作按钮
  - 支持加载状态显示
- **更新文件**: `src/features/booking/MultiRacketBookingFlow.tsx`
  - 新增 `syncPhotos` 状态和复选框
  - 新增 `photoReplaceConfirmOpen` 和 `pendingPhotoSync` 状态
  - 新增 `checkPhotoReplaceConfirmation()` 函数检测是否需要确认
  - 新增 `handleConfirmPhotoReplace()` 函数执行确认后的照片同步
  - 更新 `applyTemplateToItems()` 支持 `applyPhotos` 选项
  - 快速配置 UI 增加照片同步选项和预览

### P1-5: ETA 队列字段标准化
- **更新文件**: `src/server/services/order-eta.service.ts`
  - 新增 `EtaQueueMeta` 接口定义标准化字段结构
  - 新增 `getOrderEtaQueueMeta()` 获取单个订单的 ETA 元数据
  - 新增 `batchGetOrderEtaQueueMeta()` 批量获取订单 ETA 元数据
  - 标准化字段: `queuePosition`, `queueStartAt`, `estimatedDays`, `updatedAt`, `etaLabel`, `minDays`, `maxDays`
- **更新文件**: `src/server/services/order.service.ts`
  - 更新 `getUserOrders()` 返回 `workQueueEstimate` 字段
  - 更新 `getOrderById()` 返回标准化 ETA 元数据

### P1-6: 触控热区优化
- **更新文件**: `src/components/Badge.tsx`
  - 新增 `interactive` 属性，启用时增加最小 44px 触控热区
- **更新文件**: `src/components/Button.tsx`
  - 更新 `sm` 尺寸从 h-9 (36px) 到 h-10 (40px)，添加 `min-h-[40px]`
  - 更新 `md` 和 `lg` 尺寸添加 min-h 确保一致性
- **更新文件**: `src/features/orders/OrderList.tsx`
  - 更新 chip 样式从 `py-1 text-[11px]` 到 `py-2 min-h-[36px] text-xs`
  - 更新"再来一单"按钮增加触控热区
  - 更新状态标签增加触控热区

### P2-7: 可访问性增强
- **新增组件**: `src/components/FocusTrap.tsx`
  - 焦点陷阱组件，用于模态框和弹出层
  - 支持 Tab/Shift+Tab 循环导航
  - 支持关闭时恢复原焦点
- **更新文件**: `src/components/Modal.tsx`
  - 集成 FocusTrap 组件
  - 添加 `role="presentation"` 到容器
  - 优化 ARIA 属性

### P2-8: 性能优化
- **更新文件**: `src/features/booking/RacketItemCard.tsx`
  - 使用 `React.memo()` 包装组件
  - 实现自定义比较函数优化重渲染判断
  - 比较关键字段: id, racketPhoto, tension, notes, photoStatus, index, disabled, isTemplate
- **新增组件**: `src/components/OptimizedImage.tsx`
  - 图片懒加载组件，使用 IntersectionObserver
  - 渐进式加载体验（骨架屏 → 图片淡入）
  - 错误状态处理
  - 可配置 rootMargin 和占位背景色

### P2-9: 测试基础设施
- **新增配置**: `vitest.config.ts`
  - Vitest 测试框架配置
  - 集成 React Testing Library
  - 配置路径别名和覆盖率报告
- **新增配置**: `vitest.setup.ts`
  - 测试环境初始化
- **更新文件**: `package.json`
  - 新增测试脚本: `test`, `test:run`, `test:coverage`
  - 新增开发依赖: vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @vitejs/plugin-react
- **新增测试**: `src/__tests__/orderEta.test.ts`
  - `getOrderEtaEstimate()` 函数的单元测试
  - 覆盖基本状态、队列数据和边界情况
- **新增测试**: `src/__tests__/ConfirmDialog.test.tsx`
  - ConfirmDialog 组件的 React 测试
  - 覆盖渲染、交互和加载状态

## New Files
- `src/components/ConfirmDialog.tsx`
- `src/components/FocusTrap.tsx`
- `src/components/OptimizedImage.tsx`
- `src/__tests__/orderEta.test.ts`
- `src/__tests__/ConfirmDialog.test.tsx`
- `vitest.config.ts`
- `vitest.setup.ts`

## Updated Files
- `src/features/booking/MultiRacketBookingFlow.tsx`
- `src/features/booking/RacketItemCard.tsx`
- `src/features/orders/OrderList.tsx`
- `src/server/services/order-eta.service.ts`
- `src/server/services/order.service.ts`
- `src/components/Modal.tsx`
- `src/components/Badge.tsx`
- `src/components/Button.tsx`
- `package.json`

## Tests
- 运行 `npm run test` 执行所有测试
- 运行 `npm run test:coverage` 查看覆盖率报告
- 现有测试覆盖:
  - `getOrderEtaEstimate()` 边界情况
  - ConfirmDialog 组件交互

## How to Test

### 模板照片安全确认
1. 进入多球拍预约流程
2. 添加 2+ 球拍
3. 为第一支球拍上传照片
4. 勾选"同步照片"
5. 点击"应用到其余 X 支"
6. 应看到确认弹窗显示将替换的照片数量

### ETA 队列显示
1. 创建新订单
2. 查看订单列表
3. 验证 ETA chip 显示正确的预估时间和队列位置

### 触控热区
1. 在移动设备上访问订单列表
2. 验证所有 chip 和按钮易于点击
3. 无需精确定位即可触发

### 可访问性
1. 打开任意模态框
2. 按 Tab 键，验证焦点在模态框内循环
3. 按 Esc 关闭模态框
4. 验证焦点返回原位置

### 测试运行
```bash
npm install
npm run test
```

## Notes
- 测试框架需要先运行 `npm install` 安装新依赖
- ETA 队列数据现在在订单列表 API 中自动返回
- 性能优化的 memo 比较函数可能需要根据实际使用情况调整
