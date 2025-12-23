🧠 AGENTS.md — AI Coding Agent Development Protocol

String Service Platform — Development Governance Document  
版本：1.2  
最后更新：2025-12-23  

---

## 📌 1. 目的（Purpose）

此文档用于规范项目中所有 AI Codex / LLM Agent 的开发行为，使其能够：

- 在每次开发前 **自动理解整个项目上下文**  
- 在开发执行过程中 **遵守一致的架构、风格与规范**  
- 在开发结束后 **产出系统级文档并放入 `docs/` 文件夹**  
- 确保未来所有 Agent 都能基于历史文档持续开发，而不会偏离项目方向  

此文档是项目开发的 **唯一行为准则（Single Source of Truth for Agents）**。

---

## 📌 2. 开发前必须执行的步骤（MANDATORY）

每次开始写代码前，AI Agent 必须执行以下动作：

### ✔ STEP 1：加载 `docs/` 下所有文档

包括但不限于：

- `docs/System-Design-Document.md`  
- `docs/UI-Design-Guide.md`  
- `docs/api_spec.md`  
- `docs/erd.md`  
- `docs/components.md`  
- 以及所有最新的 `docs/change_log_*.md`（必须串读以确认上下文）  

Agent 必须阅读这些文件并建立上下文。

### ✔ STEP 2：理解或更新以下全局信息

Agent 需要对以下内容有清晰理解（或在变更时同步更新文档）：

- 系统架构  
- 数据结构（ERD）  
- API 规范  
- 文件结构  
- UI 组件规范（React + Tailwind）  
- 技术栈与依赖  
- 现有代码组织方式  
- 已完成与未完成功能  
- 命名规范（变量、文件、函数、组件）  
- 当前存在的临时 / 占位接口（Next.js API stubs），需要在未来替换为真实 Supabase/Edge Functions 时同步更新文档  

> Agent **不得在不了解上下文的情况下开始编码**。

### ✔ STEP 3：生成 “Development Plan”（开发任务计划）

在编写代码前，Agent 必须输出：

- 要修改 / 新增的文件列表  
- 各文件的修改说明  
- 新设计的数据库字段必须包含迁移方案  
- 新增 API 需描述输入 / 输出结构  
- 新组件需描述复用方式  

只有经过计划确认后，才能执行代码生成。

---

## 📌 3. 开发过程中的要求（BEST PRACTICES）

所有输出必须满足：

### 3.1 代码风格一致性

使用技术栈：

- React + TypeScript  
- Tailwind CSS  
- Supabase Client SDK  
- Functional Component + Hooks  

命名与结构：

- 文件命名采用 **kebab-case** 或组件使用 **PascalCase**  
- 逻辑模块化、可扩展  

### 3.2 代码必须可运行，不可只做示意

所有 Agent 生成代码必须：

- 可直接复制并运行  
- 不依赖未声明文件  
- 不引用不存在的变量或库  
- 遵循已有项目文件组织  

### 3.3 代码必须有注释

需要带解释性注释，包括：

- 函数用途  
- 参数说明  
- 返回值  
- 业务逻辑重点  
- 数据流解释  

### 3.4 新功能必须符合系统设计文档

不允许：

- 创建与现有结构冲突的 API  
- 重复定义已有功能  
- 破坏已定义的模块边界  

---

## 📌 4. 开发完成后必须执行的步骤（MANDATORY）

每次开发任务完成后，Agent 必须：

### ✔ STEP 1：生成对应文档，并放入 `docs/` 文件夹

必须产出的文档包括：

#### 4.1 `docs/change_log_<date>.md`

内容包含：

- 新增功能  
- 修改功能  
- API 更新  
- 组件更新  
- 数据库变更  
- 影响范围  
- 如何测试  

格式示例：

```markdown
# Change Log — 2025-12-11

## Summary
Added booking discount system + updated inventory logic.

## Changes
- Added function: applyCoupon() in booking API
- Updated table: orders (new field: discount_amount)
- Updated UI: BookingScreen shows coupon selector
- Updated AdminAnalytics dashboard profit logic

## Tests
- Created test cases for discount logic
- Manual UI test on booking flow
```

#### 4.2 更新相关文档（如需要）

可能需要同步更新的文档：

- `docs/system_design.md`  
- `docs/api_spec.md`  
- `docs/erd.md`  
- `docs/ui_design.md`  
- `docs/workflow.md`  

#### 4.3 调整 README 模块进度（如果有）

若 README 中含有模块进度或 TODO，需要同步更新状态。

---

## 📌 5. 文件组织规范（File Conventions）

项目目录建议如下：

```text
src/
  components/         # 复用组件
  features/           # 每个功能模块
  pages/ or app/      # 路由
  lib/                # 工具函数
  services/           # API service
  hooks/              # React hooks
docs/
  system_design.md
  ui_design.md
  erd.md
  api_spec.md
  change_log_*.md
AGENTS.md             # 本文件（Agent 行为规范）
```

---

## 📌 6. Agent 输出格式规范（Response Format）

无论需求多小，Agent 输出必须符合以下结构：

### `## Development Plan`

- 列出要修改、新增的内容  
- 简述每一项变更的目的与影响  

### `## Implementation`

- 按文件分段给出完整代码  
- 标明文件路径 + 修改内容  

### `## Updated Docs`

- 列出更新或新增的文档文件  
- 给出变更内容（可直接复制到对应文档）  

### `## Notes`

- 可选补充说明  
- 记录技术债 / 后续优化点  

---

## 📌 7. 禁止事项（Prohibited Behaviors）

Agent 不得：

- ❌ 无视 `docs/` 文件内容  
- ❌ 不根据系统设计文档随意定义 API  
- ❌ 修改数据库而不更新 ERD  
- ❌ 添加未记录在 change_log 的变更  
- ❌ 输出不完整、无法运行的代码  
- ❌ 生成与当前架构不一致的风格  
- ❌ 破坏组件命名与目录规划  

---

## 📌 8. Agent 行为总结（Core Behavior Summary）

Agent 在本项目中扮演：

- 架构遵守者  
- 文档维护者  
- 代码生成器  
- 项目上下文记忆管理者  

必须遵循：

> **Documentation-driven development & Context-driven generation**  
> 文档驱动开发 + 上下文驱动的代码生成

核心原则：

- 避免重复造轮子，复用既有组件与模块。  
- 严格参照文档执行，保持结构与风格一致性。  
- 每次开发都为“未来的 Agent”留下清晰的上下文。  

---

## 📌 9. 视觉设计系统（Visual Design System）

项目采用 **呼吸感设计（Breathing Design）**，Agent 在开发 UI 时必须遵循：

### 9.1 配色层级

| 元素 | 颜色 | 说明 |
|------|------|------|
| 页面背景 | `bg-gray-50` | 非常浅的灰色 |
| 卡片/模块 | `bg-white` | 白色，形成浮起效果 |
| 边框 | `border-gray-100` | 轻描边 |
| 阴影 | `shadow-sm` | 轻阴影 |
| 主强调色 | `accent` (橙色) | 仅用于主行动按钮 |

### 9.2 间距体系

- 内容区宽度：`max-w-xl` (~576px) 或 `max-w-2xl` (~672px)
- 区块垂直间距：`space-y-8` (32px) 或 `space-y-6` (24px)
- 卡片内边距：`p-4` / `p-5` / `p-6`
- 横向间隔：`px-5`

### 9.3 排版节奏

| 元素 | 字号 | 颜色 |
|------|------|------|
| 标题 | 15-18px (`text-[15px]` / `text-lg`) | `text-gray-900` |
| 描述 | 12-14px (`text-xs` / `text-sm`) | `text-gray-500` |
| 辅助文字 | 12px (`text-xs`) | `text-gray-400` |

### 9.4 卡片统一风格

```tsx
// 标准卡片样式
className="bg-white rounded-xl border border-gray-100 shadow-sm"

// 主行动卡片（橙色强调）
className="bg-accent/10 border border-accent/30 rounded-xl"

// 次要卡片（灰度）  
className="bg-white border border-gray-100 hover:shadow-md"
```

### 9.5 图标规范

- 固定容器尺寸：`w-10 h-10` 或 `w-8 h-8`
- 图标本身：`w-5 h-5` 或 `w-4 h-4`
- 背景色：`bg-gray-50` (次要) / `bg-accent` (主要)
- 使用 `lucide-react` 图标库

### 9.6 交互反馈

- Hover 效果：`hover:shadow-md` / `hover:border-gray-200`
- 过渡动画：`transition-all` / `transition-colors`
- 按钮 Hover：`hover:opacity-90`

### 9.7 票据/交易类组件设计 (Transactional Design)

对于订单收据、结算单等交易类组件，采用 **拟物化收据风格**：

- **锯齿边缘 (Zigzag Border)**：使用 CSS `linear-gradient` 实现真实纸质锯齿效果。
- **点状引导线 (Dot Leaders)**：使用 `border-dotted` 连接项目与金额，增强易读性。
- **等宽字体 (Monospace)**：金额与数量使用 `font-mono`，模拟打印机效果。
- **双线分隔 (Double Border)**：使用 `border-double` 强调合计金额。
- **信息层级**：
  - `OrderSummaryCard`：顶部摘要，包含状态、核心金额、主行动按钮。
  - `ReceiptCard`：底部详情，模拟物理收据，包含明细、支付方式、时间戳。

---

## 📌 10. Change Log 文档规范

每次开发完成后，必须在 `docs/` 创建 `change_log_YYYY-MM-DD.md`，格式参考：

- `docs/change_log_2025-12-23.md` — 视觉呼吸感优化 + UX 改进

---

> **本文档最后更新：2025-12-23**
```
