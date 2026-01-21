# Change Log — 2026-01-21

## Summary

实现 Phase 1 Quick Wins 功能增强：新用户激励、套餐优化、评价社交化、订单追踪。

## 新功能

### 1. 新用户首单优惠券自动发放

- **Schema 变更**：`Voucher` 模型新增字段
  - `tag` - 优惠券标签 (welcome/referral/review/promotion)
  - `isFirstOrderOnly` - 仅限首单使用
  - `isAutoIssue` - 注册时自动发放
  - `validityDays` - 发放后有效天数

- **新服务**：`src/server/services/welcome.service.ts`
  - `issueWelcomeVouchers()` - 发放欢迎礼包
  - `isUserFirstOrder()` - 检查是否为首单
  - `validateVoucherForOrder()` - 验证优惠券（含首单检查）

- **API 变更**：`POST /api/auth/signup`
  - 注册成功后自动调用 `issueWelcomeVouchers()`
  - 失败不影响注册流程，仅记录日志

### 2. 套餐价值标签增强

- **Schema 变更**：`Package` 模型新增字段
  - `tag` - 套餐标签 (best_value/most_popular/limited_time/new)
  - `isPopular` - 是否为热门套餐

- **组件更新**：`PackageCard.tsx`
  - 支持 4 种标签显示（性价比之选、最受欢迎、限时优惠、新上架）
  - 优先使用数据库 `originalPrice` 计算节省金额
  - 动态图标与样式

### 3. 评价点赞 + 精选置顶

- **Schema 变更**
  - `Review` 新增：`isFeatured`、`likesCount`
  - 新模型：`ReviewLike` 关联表

- **新 API**
  - `POST /api/reviews/[id]/like` - 点赞/取消点赞
  - `POST /api/admin/reviews/[id]/featured` - 切换精选状态

- **服务更新**：`review.service.ts`
  - `toggleReviewLike()` - 点赞/取消
  - `toggleReviewFeatured()` - 精选切换
  - `getFeaturedReviews()` - 按精选、点赞数排序

### 4. 订单预计完成时间

- **Schema 变更**：`Order` 新增 `estimatedCompletionAt`

- **新服务**：`src/server/services/order-eta.service.ts`
  - `calculateEstimatedCompletion()` - 基于队列计算 ETA
  - `getOrderQueuePosition()` - 获取队列位置
  - `formatEstimatedCompletion()` - 友好时间格式化
  - `getOrderEtaInfo()` - 获取 ETA 信息

- **订单创建更新**
  - `createOrder()` - 添加 ETA 计算
  - `createOrderWithPackage()` - 添加 ETA 计算
  - `createMultiRacketOrder()` - 添加 ETA 计算

## 数据库迁移

新增 4 个迁移文件：

1. `016_welcome_voucher_fields.sql` - 欢迎优惠券字段
2. `017_package_tag_fields.sql` - 套餐标签字段
3. `018_review_likes_featured.sql` - 评价点赞与精选
4. `019_order_estimated_completion.sql` - 订单预计完成时间

## 文件变更

### 新增文件

- `src/server/services/welcome.service.ts`
- `src/server/services/order-eta.service.ts`
- `src/app/api/reviews/[id]/like/route.ts`
- `src/app/api/admin/reviews/[id]/featured/route.ts`
- `docs/plans/feature_backlog_v2.md`
- `sql/migrations/016_welcome_voucher_fields.sql`
- `sql/migrations/017_package_tag_fields.sql`
- `sql/migrations/018_review_likes_featured.sql`
- `sql/migrations/019_order_estimated_completion.sql`

### 修改文件

- `prisma/schema.prisma` - 多处 Schema 更新
- `prisma/seed.ts` - 欢迎优惠券 + 套餐标签数据
- `src/app/api/auth/signup/route.ts` - 欢迎礼包发放
- `src/server/services/order.service.ts` - ETA 计算
- `src/server/services/review.service.ts` - 点赞/精选服务
- `src/components/PackageCard.tsx` - 标签显示
- `docs/plans/optimization_backlog.md` - 交叉引用

## 测试建议

1. **新用户优惠券**
   - 注册新用户，检查是否自动获得优惠券
   - 确认优惠券有效期为 7 天
   - 测试首单使用限制

2. **套餐标签**
   - 查看套餐列表页面
   - 确认标签显示正确
   - 验证节省金额计算

3. **评价点赞**
   - 登录用户点赞评价
   - 管理员设置精选
   - 确认首页精选排序

4. **订单 ETA**
   - 创建新订单
   - 检查 `estimatedCompletionAt` 字段
   - 验证队列位置计算

## 后续计划

Phase 2 Core Enhancements：
- 阶梯式推荐奖励 + 推荐达人徽章
- 可视化订单进度时间轴
- 订单自动状态流转 + 超时提醒
- 库存智能补货建议

---

> **本次更新由 Claude Code 完成**
