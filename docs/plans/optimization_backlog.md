# Optimization Backlog — UI/UX & Reliability

> 记录“下一步还能优化什么”，用于后续迭代时按优先级逐个完成。  
> 设计基调：Breathing Light / Paper Court（轻盈、可信、清晰、移动端优先）

---

## ✅ Current State (已完成)

- **Admin ETA**: 管理员可手动设置订单 ETA，前端列表与详情页优先展示手动设置的时间 (2025-01-22)。
- **Mobile Touch Targets**: `OrderList` 中的状态标签、操作按钮全部应用 `Badge interactive` (44px 热区) (2025-01-22)。
- **Image Performance**: 订单照片展示 (`OrderPhotosDisplay`) 应用 `OptimizedImage` 懒加载与骨架屏 (2025-01-22)。
- **UI Consistency**: 全面替换原生 `window.confirm` 为自定义 `ConfirmDialog`，提升管理端操作体验 (2025-01-22)。
- 多球拍预约（Step 2/4）照片批量上传：支持替换全部、进度条、每球拍成功/失败诊断、失败重试队列（确认替换/重试/忽略）。
- 订单列表：增加 next-action chips（ETA/支付/取拍等），减少进入详情页的次数。
- ETA：通过 `getOrderEtaEstimate` 在订单列表与预约流程里统一展示“已接单 / 预计完成 X 天 / 已完成”等文案（支持 fallback）。
- 照片大小限制：预约球拍照片前端 5MB 校验已移除；后端上传大小限制默认禁用（除非设置 `MAX_FILE_SIZE`）。
- 上传文件不进 Git：忽略 `public/uploads/`。

---
---

## ⭐ P1 (下一阶段) — 体验提升/效率提升

### 4) 模板库（Repeat Order 2.0）
- [ ] **安全替换确认**：当模板照片覆盖当前槽位时，展示“将替换 X 张照片”的确认提示。

### 5) ETA 真正联动后端队列
- [ ] **队列字段标准化**：在订单数据里返回 `queuePosition / queueStartAt / estimatedDays / updatedAt` 等字段。
- [ ] **UI 显示一致**：列表 chip、详情页、预约确认页使用同一套 ETA 规则与语义色。

### 6) 移动端 QA & 触控一致性
- [ ] **热区统一**：所有 chip/button 最小触控 44px，高频动作保持一致布局。
- [ ] **滚动/吸顶行为**：验证 Step 2/4 sticky bar 在不同机型 safe-area 下不遮挡内容。

---

## 🧩 P2 (可延后) — 工程质量/长期维护

### 7) 可访问性（A11y）
- [ ] **键盘可操作**：弹层/下拉/模板选择器 focus trap 与 Esc 关闭。
- [ ] **语义标签**：为图片状态徽章、上传按钮、错误提示补齐 `aria-*` 与可读文本。

### 8) 性能与可维护性
- [ ] **减少重渲染**：对多球拍卡片列表做 memo / stable callbacks，避免输入时卡顿。
- [ ] **图片展示策略**：预览图统一尺寸与懒加载策略，减少布局抖动（CLS）。

### 9) 测试与回归
- [ ] **关键流程 E2E**：多球拍上传（批量/重试/模板）、下单、订单列表 chips 的回归用例。
- [ ] **纯逻辑单测**：`getOrderEtaEstimate` 的边界 case（无 items、有 queue meta、不同状态）。

---

## 📋 业务功能增强

> 详见 [`feature_backlog_v2.md`](./feature_backlog_v2.md) — 包含用户增长、收入优化、运营效率等完整规划。

**Quick Wins (Phase 1)**：
- 新用户首单优惠券自动发放
- 套餐「省 XX RM」价值标签
- 评价点赞 + 精选置顶
- 订单预计完成时间

**Core Enhancements (Phase 2)**：
- 阶梯式推荐奖励 + 推荐达人徽章
- 可视化订单进度时间轴
- 订单自动状态流转 + 超时提醒
- 库存智能补货建议

**Strategic Features (Phase 3)**：
- 会员等级系统 (Silver → Gold → VIP)
- 营销活动管理工具
- 业务洞察 Dashboard (LTV, 留存率, 客单价)

---

## ✅ How to Continue (建议工作流)11

1. 每完成一项：在对应 changelog（`docs/changelogs/YYYY-MM/`）补一条记录。
2. 每次合并前：至少通过 `npm run type-check`，并在移动端断点做一次手动回归（Step 2/4）。

