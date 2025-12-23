# Change Log — 2025-12-23

## Summary
视觉呼吸感设计优化 + 待评价功能 + 通知铃铛自动刷新 + 订单详情页 UX 重构

---

## Changes

### 新增功能
- **待评价订单**: `getPendingReviewOrdersAction()` 获取已完成但未评价的订单
- **导航栏入口**: 添加"评价"链接 `/reviews`
- **通知自动刷新**: 标记已读后铃铛数字立即更新
- **订单摘要卡**: 新增 `OrderSummaryCard` 组件，显示状态+球拍数+金额+行动按钮

### 修改功能
- **首页布局**: 收窄宽度 `max-w-xl`，增大间距 `space-y-8`，灰底白卡片
- **QuickActions**: 主行动橙色全宽卡片，次要行动统一白色风格
- **RecentOrders**: 紧凑单行设计，限制3条，状态驱动按钮
- **FeaturedReviews**: 横向滚动轮播，5秒自动切换
- **MyReviewsPage**: 与订单页风格统一，新增待评价标签
- **订单详情页**: 重构为"摘要卡 + 可折叠球拍卡 + 拟物化收据"结构，优化评价交互

### API 更新
- `src/actions/reviews.actions.ts`: 新增 `getPendingReviewOrdersAction`
- `src/services/reviewService.ts`: 新增 `getPendingReviewOrders`, `PendingReviewOrder` 接口

### 组件更新
- `NotificationBell`: 新增 `refreshTrigger` prop
- `NotificationPanel`: 新增 `onUnreadCountChange` 回调
- `Navbar`: 连接通知组件的刷新机制
- `OrderSummaryCard`: 新增组件，显示订单摘要与行动按钮
- `OrderDetailPage`: 重构布局，合并卡片，优化信息层级

---

## 订单详情页 UX 重构

### 优化目标
以用户任务为中心，让用户第一屏清楚知道「状态」「内容」「费用」「下一步行动」

### 主要改动
| 区域 | 改动 |
|------|------|
| **摘要卡** | 新增：状态+球拍数+金额+支付状态+行动按钮（状态驱动） |
| **收据信息** | 新增：拟物化收据风格（锯齿边+点状线），显示明细+合计+支付方式 |
| **球拍列表** | 独立卡片，默认折叠摘要，展开显示带图片的详细列表 |
| **评价区域** | 摘要卡"评价"按钮点击自动平滑滚动至底部评价表单 |

### 代码减少
- 删除重复的支付信息卡（~120行）
- 简化球拍列表布局（~40行）
- 简化评价CTA卡片（~20行）
- 删除冗余的订单信息卡片（~40行）
- **净减少约130行代码**

---

## Affected Files

| File | Type |
|------|------|
| `src/features/home/HomePage.tsx` | Modified |
| `src/features/home/QuickActions.tsx` | Modified |
| `src/features/home/RecentOrders.tsx` | Modified |
| `src/components/FeaturedReviews.tsx` | Modified |
| `src/features/reviews/MyReviewsPage.tsx` | Modified |
| `src/features/booking/MultiRacketBookingFlow.tsx` | Modified |
| `src/components/layout/Navbar.tsx` | Modified |
| `src/components/NotificationBell.tsx` | Modified |
| `src/components/NotificationPanel.tsx` | Modified |
| `src/actions/reviews.actions.ts` | Modified |
| `src/services/reviewService.ts` | Modified |
| `src/components/OrderSummaryCard.tsx` | **New** |
| `src/features/orders/OrderDetailPage.tsx` | Modified |

---

## Tests
- 手动测试首页各区块显示正常
- 验证会员折扣正确计算和显示
- 测试评价轮播自动滚动
- 验证导航栏评价链接跳转正确
- 测试待评价订单列表显示
- 验证"全部标记已读"后铃铛数字立即消失
- 测试订单详情页摘要卡按钮（待付款/已完成）
- 验证复制订单号 Toast 提示
- 验证复制订单号 Toast 提示
- 测试拟物化收据显示（明细、锯齿边、合计）
- 验证球拍列表折叠/展开功能
- 测试评价按钮自动滚动行为
- 验证多球拍订单紧凑布局
