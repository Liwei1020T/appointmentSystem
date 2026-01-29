# Change Log — 2026-01-27

## Summary
**Phase 2: 更新管理端页面的骨架屏和空状态组件**

本次更新为 16 个管理端页面/组件统一集成了骨架屏（Skeleton）和空状态（EmptyState）组件，显著提升了用户体验和视觉一致性。

## Changes

### Enhanced - UI/UX 改进
- 所有管理端页面现在使用统一的 `EmptyState` 组件替代原始的"暂无"文本
- 列表和表格页面现在使用 `SkeletonTable` 或 `SkeletonCard` 替代简单的加载指示器
- 所有空状态都包含可爱的插画和友好的描述文本
- 保持设计系统一致性（Paper Court 风格）

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/components/admin/AdminInventoryDetailPage.tsx` | Modified | 添加库存变更记录空状态 |
| `src/components/admin/AdminPackageListPage.tsx` | Modified | 添加套餐列表空状态和骨架屏 |
| `src/components/admin/AdminVoucherListPage.tsx` | Modified | 添加优惠券列表空状态和骨架屏 |
| `src/components/admin/AdminOrderDetailPage.tsx` | Modified | 添加支付信息空状态 |
| `src/components/admin/AdminVoucherDetailPage.tsx` | Modified | 添加用户持有列表空状态 |
| `src/components/admin/AdminUserDetailPage.tsx` | Modified | 添加订单、积分、套餐、优惠券空状态 |
| `src/components/admin/AdminUserListPage.tsx` | Modified | 添加用户列表空状态和骨架屏 |
| `src/components/admin/AdminOrderListPage.tsx` | Modified | 添加订单列表空状态和骨架屏 |
| `src/components/admin/AdminDashboardPage.tsx` | Modified | 添加最近订单空状态 |
| `src/components/admin/DistributeVoucherModal.tsx` | Modified | 添加用户列表空状态（含搜索空状态） |
| `src/components/admin/PaymentVerificationPage.tsx` | Modified | 添加支付审核空状态 |
| `src/components/admin/StockHistory.tsx` | Modified | 添加库存历史空状态 |
| `src/components/admin/AdminInventoryListPage.tsx` | Modified | 添加库存列表空状态和骨架屏 |
| `src/components/admin/AdminPackageDetailPage.tsx` | Modified | 添加购买记录空状态 |
| `src/features/admin/AdminReviewsPage.tsx` | Modified | 添加评价列表空状态（含搜索空状态） |
| `src/components/admin/AdminReportsPage.tsx` | Modified | 添加多个图表空状态和骨架屏 |
| `src/components/admin/AdminNotificationsPage.tsx` | Modified | 添加通知记录和设备列表空状态 |

## Component Integration

### EmptyState 使用场景

| 空状态类型 | 使用场景 | 文件 |
|-----------|---------|------|
| `no-data` | 通用空数据 | AdminInventoryDetailPage, AdminVoucherDetailPage, AdminPackageDetailPage, StockHistory, AdminNotificationsPage |
| `no-orders` | 订单列表为空 | AdminOrderListPage, AdminUserDetailPage, AdminDashboardPage |
| `no-packages` | 套餐列表为空 | AdminPackageListPage, AdminUserDetailPage |
| `no-vouchers` | 优惠券列表为空 | AdminVoucherListPage, AdminUserDetailPage |
| `no-users` | 用户列表为空 | AdminUserListPage, DistributeVoucherModal |
| `no-payments` | 待审核支付为空 | PaymentVerificationPage |
| `no-points` | 积分记录为空 | AdminUserDetailPage |
| `no-inventory` | 库存列表为空 | AdminInventoryListPage |
| `no-reviews` | 评价列表为空 | AdminReviewsPage |
| `no-notifications` | 通知记录为空 | AdminNotificationsPage |
| `search-empty` | 搜索无结果 | AdminReviewsPage, DistributeVoucherModal |

### Skeleton 使用场景

| 骨架屏类型 | 使用场景 | 文件 |
|-----------|---------|------|
| `SkeletonTable` | 表格加载 | AdminInventoryListPage, AdminOrderListPage, AdminUserListPage, AdminNotificationsPage |
| `SkeletonCard` | 卡片网格加载 | AdminPackageListPage, AdminVoucherListPage |
| `SkeletonDashboard` | 仪表板加载 | AdminReportsPage |

## UI/UX Improvements

### Before
```tsx
// 简单的文本提示
{items.length === 0 ? (
  <p className="text-text-tertiary text-center py-8">暂无数据</p>
) : (...)}

// 基础加载指示器
{loading && <SectionLoading label="加载中..." />}
```

### After
```tsx
// 带插画的空状态组件
{items.length === 0 ? (
  <EmptyState
    type="no-data"
    title="暂无数据"
    description="数据正在路上"
    size="sm"
  />
) : (...)}

// 专业骨架屏
{loading && <SkeletonTable rows={10} columns={6} />}
```

## Benefits

1. **视觉一致性** - 所有管理端页面现在使用统一的空状态样式
2. **更好的用户体验** - 可爱的插画让空状态更友好，减少挫败感
3. **加载体验优化** - 骨架屏展示内容结构，降低感知等待时间
4. **可维护性** - 集中管理空状态，未来修改更容易
5. **无障碍性** - 组件内置了 `aria-hidden` 等属性

## Testing

### Type Check
- [x] TypeScript 类型检查通过 (`npm run type-check`)

### Lint Check
- [x] ESLint 检查通过 (`npm run lint`)
- 仅有预存在的警告（与本次变更无关）

### Manual Testing Required
- [ ] 验证所有空状态正确显示
- [ ] 验证骨架屏动画流畅
- [ ] 验证不同尺寸（sm/md/lg）正确渲染
- [ ] 验证搜索空状态正确触发

## Design Compliance

所有变更符合 Paper Court 设计系统：
- 使用 `bg-ink-surface` / `bg-ink-elevated` 背景
- 使用 `border-border-subtle` 边框
- 使用 `text-text-primary` / `text-text-secondary` / `text-text-tertiary` 文本颜色
- 保持 `rounded-xl` 圆角统一
- 骨架屏动画使用 `animate-shimmer`

## Breaking Changes
无

## Migration Notes
无需迁移，向后兼容

## Related Components
- `src/components/EmptyState.tsx` - 空状态组件（已存在）
- `src/components/Skeleton.tsx` - 骨架屏组件（已存在）

## Future Enhancements
- 考虑为空状态添加操作按钮（actionLabel + onAction）
- 考虑为某些空状态添加自定义插画
- 考虑添加深色模式支持

## Notes
- 所有空状态组件都支持 `size` 属性（sm/md/lg）用于不同场景
- EmptyState 支持自定义 title 和 description
- Skeleton 组件支持自定义动画类型（shimmer/pulse/none）
- 管理端页面优先使用 `size="sm"` 以节省空间

## Developer Checklist
- [x] 读取所有相关文件
- [x] 理解现有代码结构
- [x] 集成 EmptyState 组件
- [x] 集成 Skeleton 组件
- [x] 确保正确导入
- [x] 类型检查通过
- [x] Lint 检查通过
- [x] 创建变更日志

---

**变更时间：** 2026-01-27
**变更人：** Claude (Sonnet 4)
**变更类型：** UI/UX Enhancement
**影响范围：** 管理端所有页面（17 个文件）
