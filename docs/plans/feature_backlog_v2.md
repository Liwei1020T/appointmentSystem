# Feature Backlog v2.0 — 业务增长与运营效率

> 基于用户反馈与业务分析整理的功能增强路线图
> 最后更新：2026-01-27
> 设计基调：Breathing Light / Paper Court（轻盈、可信、清晰、移动端优先）

---

## 目录

1. [用户增长与留存](#1-用户增长与留存)
2. [收入优化](#2-收入优化)
3. [管理效率提升](#3-管理效率提升)
4. [用户体验增强](#4-用户体验增强)
5. [运营与增长策略](#5-运营与增长策略)
6. [实施优先级矩阵](#6-实施优先级矩阵)

---

## 1. 用户增长与留存

### 1.1 新用户激励机制增强

**问题分析**：当前仅有注册积分奖励（首次注册获得积分），转化激励不足，新用户从注册到首单的转化率有提升空间。

**现有基础**：
- ✅ `vouchers` 表支持固定金额/百分比折扣
- ✅ `user_vouchers` 表支持用户持有优惠券
- ✅ `points_log` 记录注册奖励
- ⚠️ 缺少自动发放首单优惠券的逻辑

**方案设计**：

| 功能 | 实现方式 | 复杂度 |
|------|---------|--------|
| 首单自动赠送优惠券 | 注册时自动创建 `user_vouchers` 记录 (RM3-5) | 低 |
| 限时体验价 | 新增 `packages` 类型：`first_order_special`，仅限首单可用 | 中 |
| 有效期紧迫感 | 优惠券设置 7 天有效期，前端显示倒计时 | 低 |
| 欢迎通知 | 注册成功推送通知，提醒使用首单礼包 | 低 |

**数据库变更**：
```prisma
// 无需新表，扩展 vouchers 逻辑
// 新增 voucher 标签类型
enum VoucherTag {
  WELCOME     // 新用户礼包
  REFERRAL    // 推荐奖励
  REVIEW      // 评价奖励
  PROMOTION   // 促销活动
}

model Voucher {
  // ... 现有字段
  tag         VoucherTag?   // 可选标签，用于分类统计
  isFirstOrderOnly Boolean @default(false)  // 仅限首单
}
```

**API 变更**：
- `POST /api/auth/signup` — 注册成功后自动调用 `issueWelcomeVoucher(userId)`
- `GET /api/vouchers/user` — 返回优惠券时包含 `expiresIn` 天数倒计时

**预估工作量**：1 天

---

### 1.2 推荐系统优化 — 阶梯式奖励

**问题分析**：当前推荐奖励固定（50 积分/人），随着推荐人数增加，激励效果递减，缺乏持续动力。

**现有基础**：
- ✅ `referral_logs` 表记录推荐关系
- ✅ `users.referralCode` 唯一推荐码
- ✅ 推荐双方各获 50 积分
- ⚠️ 奖励规则硬编码，无法灵活调整

**方案设计**：

| 推荐人数 | 奖励/人 | 累计激励 |
|---------|--------|---------|
| 1-5 人 | 50 积分 | 250 积分 |
| 6-10 人 | 80 积分 | 400 积分 |
| 10+ 人 | 100 积分 | 无上限 |

**额外功能**：
- 「推荐达人」徽章：推荐满 10 人解锁
- 推荐排行榜：展示 Top 10 推荐者
- 月度推荐王：每月第一名额外奖励

**数据库变更**：
```prisma
model User {
  // ... 现有字段
  badges      UserBadge[]   // 用户徽章列表
}

model UserBadge {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  badgeType   BadgeType
  earnedAt    DateTime @default(now())

  @@unique([userId, badgeType])
}

enum BadgeType {
  REFERRAL_BRONZE   // 推荐 5 人
  REFERRAL_SILVER   // 推荐 10 人
  REFERRAL_GOLD     // 推荐 25 人
  REVIEW_MASTER     // 评价达人 (10+ 评价)
  VIP_CUSTOMER      // VIP 会员
}
```

**系统配置表扩展**：
```json
// system_settings 新增条目
{
  "referral_rewards": {
    "tier1": { "max": 5, "points": 50 },
    "tier2": { "max": 10, "points": 80 },
    "tier3": { "max": null, "points": 100 }
  }
}
```

**API 变更**：
- `GET /api/referrals/stats` — 返回当前推荐数、当前阶梯、下一阶梯进度
- `GET /api/referrals/leaderboard` — 推荐排行榜
- `GET /api/profile/badges` — 用户徽章列表

**预估工作量**：2 天

---

### 1.3 用户分层运营 — 会员等级系统

**问题分析**：所有用户享受同等服务，忠诚用户无差异化体验，缺乏用户粘性激励。

**现有基础**：
- ✅ `users.role` 字段 (customer/admin)
- ✅ `points` 积分系统
- ⚠️ 无会员等级概念

**方案设计**：

| 等级 | 条件 | 权益 |
|------|------|------|
| Silver | 注册即得 | 基础服务 |
| Gold | 累计消费 RM200 或 5 单 | 积分 1.2x、专属客服 |
| VIP | 累计消费 RM500 或 12 单 | 积分 1.5x、优先处理、专属折扣 |

**数据库变更**：
```prisma
enum MembershipTier {
  SILVER
  GOLD
  VIP
}

model User {
  // ... 现有字段
  membershipTier    MembershipTier @default(SILVER)
  totalSpent        Decimal        @default(0) @db.Decimal(10, 2)
  totalOrders       Int            @default(0)
  tierUpdatedAt     DateTime?
}

model TierBenefit {
  id                String         @id @default(cuid())
  tier              MembershipTier
  benefitType       String         // "points_multiplier", "priority_queue", "exclusive_discount"
  benefitValue      String         // "1.2", "true", "5%"
  description       String
}
```

**自动升级逻辑**：
- 每次订单完成时检查用户累计消费/订单数
- 满足条件自动升级，发送通知
- 降级策略：可选（建议不降级，保持用户激励）

**API 变更**：
- `GET /api/profile/membership` — 返回当前等级、权益、升级进度
- `GET /api/admin/users/:id/membership` — 管理员查看/手动调整等级

**预估工作量**：3 天

---

## 2. 收入优化

### 2.1 套餐设计优化

**问题分析**：套餐价值感知不够直观，用户难以快速判断划算程度。

**现有基础**：
- ✅ `packages` 表完整支持套餐
- ✅ `user_packages` 支持购买与使用
- ⚠️ 缺少价值标签、节省金额展示

**方案设计**：

| 功能 | 实现方式 | 复杂度 |
|------|---------|--------|
| 「省 XX RM」标签 | 计算 `originalPrice - packagePrice`，前端展示 | 低 |
| 「最受欢迎」标签 | 根据销量统计，后台可配置 `isPopular` 字段 | 低 |
| 「性价比之选」标签 | 后台可配置 `tag` 字段 | 低 |
| 到期提醒 | Cron 任务检查 7 天内到期套餐，推送通知 | 中 |
| 续购优惠 | 套餐到期前续购享 5% 折扣 | 中 |

**数据库变更**：
```prisma
model Package {
  // ... 现有字段
  originalPrice   Decimal?       @db.Decimal(10, 2)  // 原价（用于计算节省金额）
  tag             PackageTag?    // 标签
  isPopular       Boolean        @default(false)
  renewalDiscount Int            @default(0)         // 续购折扣百分比
}

enum PackageTag {
  BEST_VALUE      // 性价比之选
  MOST_POPULAR    // 最受欢迎
  LIMITED_TIME    // 限时优惠
  NEW             // 新上架
}
```

**预估工作量**：1.5 天

---

## 3. 管理效率提升

### 3.1 订单流程自动化 — 智能状态流转

**问题分析**：订单状态更新依赖手动操作，缺少自动化流转和超时提醒。

**现有基础**：
- ✅ 订单状态：pending → in_progress → completed
- ✅ 支付成功触发 `pending_verification → success`
- ⚠️ 缺少自动状态流转、超时提醒

**方案设计**：

| 功能 | 触发条件 | 动作 |
|------|---------|------|
| 自动进入处理中 | 支付成功 | `pending` → `in_progress` |
| 预计完成时间 | 订单创建时 | 基于队列位置计算 ETA |
| 超时提醒 | 订单停留 >24h 未更新 | 推送管理员通知 |
| 自动完成确认 | 订单完成 >48h 未取拍 | 发送取拍提醒 |

**数据库变更**：
```prisma
model Order {
  // ... 现有字段
  estimatedCompletionAt  DateTime?    // 预计完成时间
  lastStatusChangeAt     DateTime     @default(now())
  reminderSentAt         DateTime?    // 提醒发送时间（避免重复）
}

model AdminNotification {
  id          String   @id @default(cuid())
  type        String   // "order_timeout", "low_stock", "payment_pending"
  orderId     String?
  message     String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

**Cron 任务**：
```typescript
// 每小时运行
async function checkOrderTimeouts() {
  const overdueOrders = await prisma.order.findMany({
    where: {
      status: 'in_progress',
      lastStatusChangeAt: { lt: subHours(new Date(), 24) },
      reminderSentAt: null
    }
  });

  for (const order of overdueOrders) {
    await createAdminNotification('order_timeout', order.id);
    await prisma.order.update({
      where: { id: order.id },
      data: { reminderSentAt: new Date() }
    });
  }
}
```

**预估工作量**：2 天

---

### 3.2 库存智能补货

**问题分析**：当前仅有低库存警告，未提供决策支持。

**现有基础**：
- ✅ `string_inventory` 库存表
- ✅ `stock_logs` 库存变动记录
- ✅ 低库存警告（阈值可配置）
- ⚠️ 缺少销售预测、补货建议

**方案设计**：

| 功能 | 实现方式 | 复杂度 |
|------|---------|--------|
| 销售预测 | 基于过去 30/60/90 天销量计算周均消耗 | 中 |
| 补货建议量 | `(周均消耗 × 补货周期) - 当前库存 + 安全库存` | 中 |
| 供应商快捷入口 | `string_inventory` 新增 `supplierContact` 字段 | 低 |
| 补货成本预估 | `补货数量 × 成本价` | 低 |
| 利润预估 | `(售价 - 成本) × 预测销量` | 低 |

**数据库变更**：
```prisma
model StringInventory {
  // ... 现有字段
  supplierName    String?
  supplierContact String?
  reorderPoint    Int      @default(5)   // 补货点
  reorderQuantity Int      @default(10)  // 建议补货量
  leadTimeDays    Int      @default(3)   // 供应商交货天数
}
```

**API 变更**：
- `GET /api/admin/inventory/restock-suggestions` — 返回需补货商品列表及建议量
- `GET /api/admin/inventory/:id/forecast` — 单品销售预测

**预估工作量**：2.5 天

---

### 3.3 数据分析增强 — 业务洞察 Dashboard

**问题分析**：当前报表偏静态，缺少深度洞察。

**现有基础**：
- ✅ 收入报表、利润分析
- ✅ 订单趋势、热销商品
- ✅ CSV 导出
- ⚠️ 缺少 LTV、留存率、客单价趋势

**方案设计**：

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 用户 LTV | 累计消费 / 用户数 | 数字 + 趋势线 |
| 复购率 | 多次下单用户 / 总用户 | 百分比 + 环比 |
| 留存率 | 30/60/90 天活跃用户比例 | 留存曲线 |
| 热门时段 | 按小时统计订单量 | 热力图 |
| 客单价趋势 | 月均订单金额 | 折线图 |

**预估工作量**：3 天

---

## 4. 用户体验增强

### 4.1 可视化订单进度

**问题分析**：订单状态较简单 (pending/in_progress/completed)，用户不清楚当前进度。

**现有基础**：
- ✅ 订单状态三阶段
- ✅ ETA 预估显示
- ⚠️ 缺少可视化时间轴、中间状态

**方案设计**：

```
已下单 → 已收拍 → 穿线中 → 已完成 → 已取拍
   ●--------○--------○--------○--------○
         当前状态
```

**数据库变更**：
```prisma
enum OrderStatus {
  PENDING           // 已下单，待支付/待收拍
  RECEIVED          // 已收拍
  IN_PROGRESS       // 穿线中
  COMPLETED         // 已完成
  PICKED_UP         // 已取拍
  CANCELLED         // 已取消
}

model OrderStatusLog {
  id          String      @id @default(cuid())
  orderId     String
  order       Order       @relation(fields: [orderId], references: [id])
  status      OrderStatus
  note        String?     // 管理员备注
  createdAt   DateTime    @default(now())
}
```

**UI 组件**：
- `OrderTimeline` — 时间轴组件，显示每个状态及时间戳
- 管理员可在状态变更时添加备注

**预估工作量**：2 天

---

### 4.2 评价与社交化

**问题分析**：评价功能完整但互动性弱。

**现有基础**：
- ✅ 评价提交、星级、照片、管理员回复
- ⚠️ 缺少点赞、精选、分享

**方案设计**：

| 功能 | 实现方式 | 复杂度 |
|------|---------|--------|
| 评价点赞 | `review_likes` 关联表 | 低 |
| 精选置顶 | `reviews.isFeatured` 字段 | 低 |
| 社交分享 | 分享链接带推荐码，使用 Web Share API | 中 |

**数据库变更**：
```prisma
model Review {
  // ... 现有字段
  isFeatured   Boolean      @default(false)
  likesCount   Int          @default(0)
  likes        ReviewLike[]
}

model ReviewLike {
  id         String   @id @default(cuid())
  reviewId   String
  review     Review   @relation(fields: [reviewId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  createdAt  DateTime @default(now())

  @@unique([reviewId, userId])
}
```

**预估工作量**：1.5 天

---

## 5. 运营与增长策略

### 5.1 营销活动工具

**问题分析**：缺少系统化营销工具，活动依赖手动操作。

**现有基础**：
- ✅ 优惠券系统
- ✅ 套餐系统
- ⚠️ 缺少活动管理、效果追踪

**方案设计**：

| 活动类型 | 实现方式 | 复杂度 |
|---------|---------|--------|
| 限时折扣 | `promotions` 表，指定时间范围、折扣规则 | 中 |
| 积分翻倍日 | `system_settings.points_multiplier` + 时间规则 | 低 |
| 满减活动 | `promotions` 表，条件：满 RM50 减 RM5 | 中 |
| 效果追踪 | `promotion_usage` 记录使用情况 | 中 |

**数据库变更**：
```prisma
model Promotion {
  id              String          @id @default(cuid())
  name            String
  type            PromotionType
  discountType    DiscountType    // FIXED, PERCENTAGE
  discountValue   Decimal         @db.Decimal(10, 2)
  minPurchase     Decimal?        @db.Decimal(10, 2)  // 满减门槛
  startAt         DateTime
  endAt           DateTime
  isActive        Boolean         @default(true)
  usageLimit      Int?            // 总使用次数限制
  usageCount      Int             @default(0)
  usages          PromotionUsage[]
  createdAt       DateTime        @default(now())
}

enum PromotionType {
  FLASH_SALE       // 限时折扣
  POINTS_BOOST     // 积分翻倍
  SPEND_SAVE       // 满减
  HOLIDAY          // 节日促销
}

model PromotionUsage {
  id           String    @id @default(cuid())
  promotionId  String
  promotion    Promotion @relation(fields: [promotionId], references: [id])
  userId       String
  orderId      String?
  savedAmount  Decimal   @db.Decimal(10, 2)
  createdAt    DateTime  @default(now())
}
```

**管理后台功能**：
- 活动创建/编辑/启停
- 活动效果看板（参与人数、总优惠金额、转化率）
- 活动日历视图

**预估工作量**：4 天

---

## 6. 实施优先级矩阵

基于 **业务价值** × **实现复杂度** 评估：

### Phase 1 — Quick Wins (1-2 周)

| 功能 | 价值 | 复杂度 | 预估 |
|------|------|--------|------|
| 新用户首单优惠券 | 高 | 低 | 1 天 |
| 套餐价值标签 | 中 | 低 | 0.5 天 |
| 评价点赞 + 精选 | 中 | 低 | 1 天 |
| 订单预计完成时间 | 中 | 低 | 0.5 天 |

### Phase 2 — Core Enhancements (2-3 周)

| 功能 | 价值 | 复杂度 | 预估 |
|------|------|--------|------|
| 阶梯式推荐奖励 | 高 | 中 | 2 天 |
| 可视化订单进度 | 高 | 中 | 2 天 |
| 订单自动状态流转 | 高 | 中 | 2 天 |
| 库存补货建议 | 中 | 中 | 2.5 天 |

### Phase 3 — Strategic Features (3-4 周)

| 功能 | 价值 | 复杂度 | 预估 |
|------|------|--------|------|
| 会员等级系统 | 高 | 高 | 3 天 |
| 营销活动工具 | 高 | 高 | 4 天 |
| 业务洞察 Dashboard | 中 | 高 | 3 天 |

---

## 附录：与现有功能对照

| 提案功能 | 现有状态 | 需要新建 |
|---------|---------|---------|
| 新用户优惠券 | 部分（有优惠券系统，缺自动发放） | 逻辑 |
| 阶梯式推荐 | 部分（有推荐系统，奖励固定） | 规则 + 徽章表 |
| 会员等级 | 无 | 完整模块 |
| 套餐标签 | 无 | 字段 + UI |
| 订单自动化 | 部分（有状态，缺自动流转） | Cron + 通知 |
| 库存补货 | 部分（有预警，缺建议） | 算法 + API |
| 数据分析 | 部分（有基础报表，缺深度指标） | 新指标 + 图表 |
| 订单时间轴 | 无 | 状态扩展 + UI |
| 评价社交化 | 部分（有评价，缺互动） | 点赞表 + 分享 |
| 营销活动 | 无 | 完整模块 |

---

> **本文档最后更新：2026-01-27**
> **下次审阅：根据 Phase 1 完成情况调整优先级**
