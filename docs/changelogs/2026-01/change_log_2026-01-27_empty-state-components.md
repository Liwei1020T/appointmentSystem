# Change Log — 2026-01-27

## Summary
更新剩余公共组件，统一使用 EmptyState 组件替换简单的空状态文本，提升用户体验一致性和视觉友好度。

## Changes

### Modified
- MembershipCard.tsx - 会员权益列表空状态优化
- OrderPhotosDisplay.tsx - 订单照片空状态优化
- ReferralList.tsx - 邀请记录空状态优化
- Table.tsx - 表格空状态优化
- VoucherSelector.tsx - 优惠券列表空状态优化
- RecentOrders.tsx - 最近订单空状态优化
- OrderStatusCapsule.tsx - 订单状态空状态优化

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/components/MembershipCard.tsx` | Modified | 使用 EmptyState 替换会员权益空状态文本 |
| `src/components/OrderPhotosDisplay.tsx` | Modified | 使用 EmptyState 替换订单照片空状态 |
| `src/components/ReferralList.tsx` | Modified | 使用 EmptyState 替换邀请记录空状态 |
| `src/components/Table.tsx` | Modified | 使用 EmptyState 替换表格空数据状态 |
| `src/features/booking/VoucherSelector.tsx` | Modified | 使用 EmptyState 替换优惠券列表空状态 |
| `src/features/home/RecentOrders.tsx` | Modified | 使用 EmptyState 替换最近订单空状态 |
| `src/features/home/OrderStatusCapsule.tsx` | Modified | 使用 EmptyState 替换订单状态空状态 |

## Implementation Details

### 统一的空状态模式
所有组件现在使用 EmptyState 组件，提供：
- 可爱的 SVG 插画
- 一致的文案风格
- 可选的行动按钮
- 响应式尺寸选项（sm/md/lg）

### 具体改进

#### 1. MembershipCard.tsx
- **变更**: 会员权益列表为空时显示 EmptyState
- **类型**: `no-data`
- **尺寸**: `sm`
- **文案**: "暂无特殊权益 / 继续消费升级会员等级解锁更多权益"

#### 2. OrderPhotosDisplay.tsx
- **变更**: 无照片时显示 EmptyState
- **类型**: `no-data`
- **尺寸**: `sm`
- **文案**: "暂无照片 / 订单完成后管理员会上传穿线照片"

#### 3. ReferralList.tsx
- **变更**: 无邀请记录时显示 EmptyState
- **类型**: `no-referrals`
- **尺寸**: `md`
- **文案**: "暂无邀请记录 / 分享你的邀请码给好友，开始赚取积分奖励"

#### 4. Table.tsx
- **变更**: 表格无数据时显示 EmptyState
- **类型**: `no-data`
- **尺寸**: `sm`
- **文案**: 使用 emptyMessage prop 作为描述

#### 5. VoucherSelector.tsx
- **变更**: 优惠券列表为空时显示 EmptyState
- **类型**: `no-vouchers`
- **尺寸**: `sm`
- **文案**:
  - 可用优惠券: "暂无此类优惠券 / 去积分中心兑换优惠券吧"
  - 不可用优惠券: "暂无此类优惠券 / 继续消费解锁更多优惠"

#### 6. RecentOrders.tsx
- **变更**: 无订单记录时显示 EmptyState
- **类型**: `no-orders`
- **尺寸**: `sm`
- **文案**: "暂无订单记录 / 预约你的第一次穿线服务吧"
- **行动**: "立即预约穿线" 按钮

#### 7. OrderStatusCapsule.tsx
- **变更**: 无进行中订单时显示 EmptyState
- **类型**: `no-orders`
- **尺寸**: `sm`
- **文案**: "暂无进行中的订单 / 创建新订单开始预约"
- **行动**: "立即预约" 按钮

## UI/UX Improvements

### 视觉一致性
- 所有空状态现在使用相同的设计语言
- 统一的可爱风格 SVG 插画
- 一致的间距和排版

### 用户引导
- 清晰的行动召唤（CTA）
- 友好的文案提示
- 明确的下一步操作指引

### 响应式设计
- 根据上下文选择合适的尺寸（sm/md/lg）
- 适配不同屏幕尺寸
- 保持视觉平衡

## Testing

- [x] TypeScript 类型检查通过
- [x] 所有导入正确
- [x] EmptyState 类型匹配
- [x] 文案准确无误
- [x] 尺寸选择合理

## Notes

### 保留的简单空状态
以下组件的空状态保持简单文本，因为它们是内联状态或已有良好的设计：
- MultiRacketBookingFlow.tsx - 复杂的多步骤流程，使用自定义空状态
- ReviewCard.tsx - 单个卡片组件，不需要空状态

### 设计原则
1. **上下文适配**: 根据组件位置和功能选择合适的空状态类型
2. **尺寸选择**:
   - `sm`: 内嵌空状态、紧凑空间
   - `md`: 独立卡片、标准空状态
   - `lg`: 页面级空状态
3. **行动按钮**: 仅在有明确下一步操作时添加

### 后续改进建议
1. 考虑为 EmptyState 添加动画效果
2. 可以添加更多类型的插画
3. 支持自定义插画颜色主题
4. 添加国际化支持

## Impact

### 用户体验
- ✅ 更友好的空状态展示
- ✅ 清晰的操作引导
- ✅ 一致的视觉体验

### 开发体验
- ✅ 统一的空状态处理方式
- ✅ 减少重复代码
- ✅ 更易维护

### 可访问性
- ✅ 语义化的内容结构
- ✅ 清晰的文本描述
- ✅ 可操作的按钮元素

---

**完成时间**: 2026-01-27
**影响范围**: UI 组件优化
**测试状态**: 类型检查通过
**后续任务**: 无
