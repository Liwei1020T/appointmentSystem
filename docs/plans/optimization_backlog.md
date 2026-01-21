# Optimization Backlog — UI/UX & Reliability

> 记录“下一步还能优化什么”，用于后续迭代时按优先级逐个完成。  
> 设计基调：Breathing Light / Paper Court（轻盈、可信、清晰、移动端优先）

---

## ✅ Current State (已完成)

- 多球拍预约（Step 2/4）照片批量上传：支持替换全部、进度条、每球拍成功/失败诊断、失败重试队列（确认替换/重试/忽略）。
- 订单列表：增加 next-action chips（ETA/支付/取拍等），减少进入详情页的次数。
- ETA：通过 `getOrderEtaEstimate` 在订单列表与预约流程里统一展示“已接单 / 预计完成 X 天 / 已完成”等文案（支持 fallback）。
- 照片大小限制：预约球拍照片前端 5MB 校验已移除；后端上传大小限制默认禁用（除非设置 `MAX_FILE_SIZE`）。
- 上传文件不进 Git：忽略 `public/uploads/`。

---

## 🔥 P0 (本周优先) — 高价值/高风险

### 1) Upload 体验与稳定性
- [ ] **上传进度 + 可取消**：对大图给出“压缩中/上传中”阶段提示，支持取消当前上传，避免用户误以为卡死。
- [ ] **失败原因更清晰**：区分网络失败/超时/服务端 5xx，并在重试队列里保留最近一次错误（用于定位）。
- [ ] **平台限制兜底**：即使移除 5MB 校验，托管平台（如 Serverless Request Body 限制）仍可能拦截大文件；建议增加“自动压缩强度”选项或改为直传存储（Signed URL）。

### 2) Retry Queue 持久化
- [ ] **localStorage 持久化 retry queue**：刷新/返回不丢失失败槽位的确认状态，直到用户明确清理。
- [ ] **清理入口**：提供“一键清空重试队列”与“清空并恢复批量填充”的显式动作。

### 3) Motion/Haptics 偏好
- [ ] **偏好开关**：在个人设置里增加“震动反馈/动效反馈”开关，并默认遵循 `prefers-reduced-motion`。

---

## ⭐ P1 (下一阶段) — 体验提升/效率提升

### 4) 模板库（Repeat Order 2.0）
- [ ] **可选历史订单作为模板**：不仅限于最近一单，支持选择过去 N 单（显示时间/金额/球拍数）。
- [ ] **安全替换确认**：当模板照片覆盖当前槽位时，展示“将替换 X 张照片”的确认提示。
- [ ] **可选复用项**：张力/备注/球线/照片分别可勾选复用，降低误操作成本。

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
- [ ] **错误监控**：接入轻量错误上报（如 Sentry）或至少在服务端记录 upload 失败原因与 request id。

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

## ✅ How to Continue (建议工作流)

1. 每完成一项：在对应 changelog（`docs/changelogs/YYYY-MM/`）补一条记录。
2. 每次合并前：至少通过 `npm run type-check`，并在移动端断点做一次手动回归（Step 2/4）。

