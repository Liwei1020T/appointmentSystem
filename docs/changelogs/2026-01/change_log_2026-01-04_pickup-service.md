# Change Log — 2026-01-04

## Summary

添加上门取拍服务选项，用户在预约时可选择"到店自取"或"上门取送"两种服务方式。

## Changes

### Database
- **新增字段**：`orders.service_type` — 服务方式（'in_store' | 'pickup_delivery'），默认 'in_store'
- **新增字段**：`orders.pickup_address` — 上门取送地址（可选，仅 pickup_delivery 时使用）

### Components
- **新增**：`src/features/booking/ServiceMethodSelector.tsx` — 服务方式选择器组件
  - 提供两张选择卡片：到店自取 / 上门取送
  - 选择上门取送时显示地址输入框
  - 默认填充用户个人资料地址

### Booking Flow
- **修改**：`src/features/booking/MultiRacketBookingFlow.tsx`
  - 添加服务方式选择器到确认订单步骤 (Step 4)
  - 提交订单时传递 serviceType 和 pickupAddress

### API
- **修改**：`src/services/orderService.ts` — 接口添加 serviceType 和 pickupAddress
- **修改**：`src/app/api/orders/route.ts` — 验证 schema 添加新字段
- **修改**：`src/server/services/order.service.ts` — 创建订单时存储新字段

### Order Display
- **修改**：`src/features/orders/OrderDetailPage.tsx` — 订单详情页显示服务方式和地址

### Documentation
- **更新**：`docs/core/erd.md` — 添加新字段说明

## Tests

### 手动测试步骤
1. 进入预约流程，完成球线选择和球拍配置
2. 在确认订单页面（Step 4）验证服务方式选择器
3. 默认选中"到店自取"
4. 切换到"上门取送"，验证地址输入框显示
5. 提交订单后，在订单详情页确认服务方式和地址正确显示

## Impact

- 用户预约流程增加服务方式选择
- 订单数据增加两个新字段
- 管理员可在订单中查看用户选择的服务方式

## Notes

- 服务方式暂不影响价格，后续可扩展添加上门服务费
- 地址信息可在后续迭代中与地图/导航功能集成
