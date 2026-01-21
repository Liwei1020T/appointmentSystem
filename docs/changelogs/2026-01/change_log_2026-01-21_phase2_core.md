# Change Log — 2026-01-21 (Phase 2)

## Summary

实现 Phase 2 Core Enhancements 功能增强：阶梯式推荐奖励、可视化订单进度、订单自动化、库存智能补货。

## 新功能

### 1. 阶梯式推荐奖励 + 推荐达人徽章

- **Schema 变更**：新增 `UserBadge` 模型
  - `userId` - 用户 ID
  - `badgeType` - 徽章类型
  - `earnedAt` - 获得时间

- **服务重构**：`src/server/services/referral.service.ts`
  - `REFERRAL_TIERS` - 阶梯式奖励配置（50→80→100→120 积分）
  - `BADGE_CONFIG` - 徽章配置（6 种徽章类型）
  - `processReferralReward()` - 阶梯式奖励计算
  - `checkAndAwardBadges()` - 自动徽章授予
  - `getMyReferralStats()` - 增强的推荐统计
  - `getReferralLeaderboard()` - 带徽章的排行榜
  - `getUserBadges()` - 获取用户徽章

- **新 API**：`GET /api/profile/badges` - 获取用户徽章列表

- **注册流程更新**：`POST /api/auth/signup`
  - 使用新的 `processReferralReward()` 替换固定积分奖励
  - 自动触发徽章检查和授予
  - 推荐奖励失败不影响注册流程

### 2. 可视化订单进度时间轴 + ETA 显示

- **组件增强**：`src/components/OrderTimeline.tsx`
  - 新增 `estimatedCompletionAt` 属性
  - 新增 `queuePosition` 属性
  - ETA 卡片显示（预计完成时间 + 队列位置）
  - 友好的时间格式化（今日完成、明天完成、X 天后完成）

- **服务增强**：`src/server/services/order.service.ts`
  - `getOrderById()` - 返回队列位置信息

- **前端更新**：`src/features/orders/OrderDetailPage.tsx`
  - 传递 ETA 和队列位置到时间线组件

### 3. 订单自动状态流转 + 超时提醒

- **新服务**：`src/server/services/order-automation.service.ts`
  - `cancelTimedOutOrders()` - 自动取消超时未支付订单（48 小时）
  - `checkInProgressOrderWarnings()` - 处理超时预警（72 小时）
  - `sendPickupReminders()` - 完成后取拍提醒
  - `runOrderAutomation()` - 运行所有自动化任务
  - `getOrderAutomationStats()` - 获取自动化统计

- **新 API**：`/api/admin/cron/order-automation`
  - `POST` - 运行自动化任务（可通过 cron job 调用）
  - `GET` - 获取自动化统计
  - 支持 `CRON_SECRET` 环境变量验证

### 4. 库存智能补货建议

- **新服务**：`src/server/services/restock.service.ts`
  - `getRestockSuggestions()` - 智能补货建议
    - 基于 30 天销售数据分析
    - 计算日均销售、预计缺货天数
    - 自动计算建议补货量
    - 优先级分类（critical/high/medium/low）
    - 预估补货成本
  - `getLowStockAlerts()` - 低库存警报

- **新 API**：`GET /api/admin/inventory/restock`
  - 获取智能补货建议
  - `?alerts=true` - 仅返回低库存警报

## 数据库迁移

新增迁移文件：

- `020_user_badges.sql` - 用户徽章表

## 文件变更

### 新增文件

- `src/server/services/order-automation.service.ts`
- `src/server/services/restock.service.ts`
- `src/app/api/profile/badges/route.ts`
- `src/app/api/admin/cron/order-automation/route.ts`
- `src/app/api/admin/inventory/restock/route.ts`
- `sql/migrations/020_user_badges.sql`

### 修改文件

- `src/server/services/referral.service.ts` - 完全重写为阶梯式奖励
- `src/server/services/order.service.ts` - 添加队列位置返回
- `src/app/api/auth/signup/route.ts` - 使用新的推荐奖励服务
- `src/app/api/referrals/leaderboard/route.ts` - 修复字段名
- `src/components/OrderTimeline.tsx` - 添加 ETA 显示
- `src/features/orders/OrderDetailPage.tsx` - 传递 ETA 属性

## 配置参数

### 推荐奖励阶梯

| 推荐人数 | 积分/人 | 徽章 |
|---------|--------|------|
| 1-5     | 50     | 无 |
| 6-10    | 80     | 🥉 推荐新秀 |
| 11-25   | 100    | 🥈 推荐达人 |
| 26+     | 120    | 🥇 推荐大师 |

### 订单自动化参数

| 参数 | 值 | 说明 |
|-----|---|------|
| ORDER_PENDING_TIMEOUT_HOURS | 48 | 待支付订单超时时间 |
| ORDER_INPROGRESS_WARNING_HOURS | 72 | 处理中订单预警时间 |
| ORDER_COMPLETION_REMINDER_HOURS | 24 | 完成后取拍提醒时间 |

### 补货分析参数

| 参数 | 值 | 说明 |
|-----|---|------|
| LOW_STOCK_THRESHOLD | 5 | 低库存阈值 |
| CRITICAL_STOCK_THRESHOLD | 2 | 紧急库存阈值 |
| SALES_ANALYSIS_DAYS | 30 | 销售分析周期 |
| RESTOCK_BUFFER_DAYS | 14 | 补货缓冲天数 |

## 环境变量

新增可选环境变量：

```env
# Cron 任务验证密钥（用于无需登录的定时任务）
CRON_SECRET=your-secret-key
```

## 测试建议

1. **阶梯式推荐奖励**
   - 注册新用户使用推荐码
   - 验证推荐人获得正确积分
   - 达到阈值后检查徽章授予
   - 查看推荐排行榜徽章显示

2. **订单进度时间轴**
   - 创建新订单
   - 查看订单详情页 ETA 显示
   - 验证队列位置计算

3. **订单自动化**
   - 调用 `POST /api/admin/cron/order-automation`
   - 验证超时订单取消
   - 检查通知发送

4. **库存补货建议**
   - 调用 `GET /api/admin/inventory/restock`
   - 验证优先级排序
   - 检查建议补货量计算

## 后续计划

Phase 3 Strategic Features：
- 会员等级系统（Silver→Gold→VIP）
- 营销活动管理模块
- 业务洞察 Dashboard
- WhatsApp 通知集成

---

> **本次更新由 Claude Code 完成**
