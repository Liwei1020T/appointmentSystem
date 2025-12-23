# Kinetic Precision 2.0 设计规范

## 0. 设计原则

*   **Precision 优先**：信息层级清晰 > 炫技视觉；数字与对齐纪律是“精密感”的核心。
*   **Kinetic 有节制**：动效短、准、可预期；让用户感到“响应快”，而不是“动得多”。
*   **高能强调可控**：Volt Green 只负责“关键一击”，不做大面积铺色。
*   **耐用与可读**：深色+玻璃拟态必须保证对比度和边界结构，长期使用不疲劳。

## 1. 色彩系统（Color System）

### 1.1 语义分层（强烈建议按 Token 管理）

**Brand / Base**
*   `bg/primary`：**Deep Navy #0F172A**（全局背景）
*   `bg/elevated`：**#111C33**（高一层的背景，用于布局区块）
*   `surface/solid`：**#1E293B**（实体卡片/容器）
*   `border/subtle`：`rgba(148,163,184,0.18)`（分割线/边框）
*   `shadow`：使用低强度、多层阴影（避免“脏灰”）

**Text**
*   `text/primary`：**#E2E8F0**
*   `text/secondary`：**#94A3B8**
*   `text/tertiary`：`rgba(148,163,184,0.70)`
*   `text/onAccent`：**#0B1220**（放在 Volt 上的文字，确保清晰）

**Accent：Volt Green 拆成三档（关键优化点）**
*   `accent/solid`：**Volt Green #D4FF00**（只用于 CTA、关键数值、选中态点亮）
*   `accent/soft`：`rgba(212,255,0,0.14)`（hover 背景、Tag/Chip 底）
*   `accent/border`：`rgba(212,255,0,0.38)`（选中描边、focus ring 的一部分）

**Secondary Accent：Electric Blue**
*   `info/solid`：**#3B82F6**（链接、科技线条、次级强调）
*   `info/soft`：`rgba(59,130,246,0.14)`

**状态色（补齐产品必需）**
*   `success`：建议偏青绿（避开 Volt 的黄绿段）
*   `warning`：琥珀系（提示/风险）
*   `danger`：红系（错误/删除）
*   *规则：状态色只表达“语义”，不要抢品牌强调（品牌仍以 Volt 为第一优先）。*

### 1.2 Light / Dark 模式策略
*   **Dark Mode 为主战场**（符合“高端装备/护目镜数据感”）
*   **Light Mode 保留但更克制**：Volt 仍小面积使用，避免刺眼。

## 2. 排版系统（Typography）

### 2.1 字体建议（跨平台稳、偏运动科技）
*   **标题/正文**：Inter / SF Pro / system-ui，中文用 PingFang SC / Noto Sans SC
*   **数据等宽**：JetBrains Mono / SF Mono / ui-monospace

### 2.2 字阶与规则（更“精准”的可落地写法）
*   **标题（力量感）**：Bold，Tracking Tight（建议 -1% 到 -2%）
*   **正文（耐读）**：Regular/Medium，行高 1.6–1.75
*   **数据（精密感）**：
    *   数字统一右对齐（或小数点对齐）
    *   单位/币种缩小一档、颜色降一档（单位不抢主数值）
    *   关键 KPI 用等宽字体 + 固定宽度容器，避免跳动

## 3. 布局与层级（Layout & Depth）

### 3.1 间距体系（耐用、像装备结构）
*   以 4 为基准：4/8/12/16/24/32
*   卡片内部 padding 常用 16 或 24
*   列表项高度稳定：减少视觉噪音（“精密”来自秩序）

### 3.2 层级规范（解决玻璃拟态“糊”问题）
*   **L0**：全局背景 `bg/primary`
*   **L1**：区块背景 `bg/elevated`
*   **L2**：实体卡片 `surface/solid`
*   **L3**：玻璃卡片（只在关键区域）
*   **L4**：弹层/抽屉（玻璃 + 更强描边 + 更明确阴影）

## 4. 玻璃拟态（Glassmorphism）使用规范（关键升级）

### 4.1 Glass 配方（建议固定下来）
*   **背景**：`rgba(30,41,59,0.55)`（不要纯透明）
*   **Blur**：12–20（导航用 16；弹层可 20）
*   **描边**：`1px rgba(226,232,240,0.10)` + 外侧再加 `rgba(15,23,42,0.35)` 的暗边
*   **阴影**：轻、分层（不要一坨黑影）

### 4.2 使用边界（避免“全站雾化”）
*   **玻璃只用于**：顶部导航 / 浮层 / 关键 KPI 卡 / 关键推荐位
*   **大列表、大表格优先用实体 Surface**（可读性第一）
*   **背景纹理要干净**：允许轻微噪点/渐变，但避免复杂图穿透

## 5. 交互与动效（Interaction & Motion）

### 5.1 动效 Token（把“快且平滑”变成可执行标准）
*   `motion/fast`：140ms ease-out（hover/press）
*   `motion/base`：200ms ease-out（常规切换）
*   `motion/slow`：260ms ease-out（抽屉/弹层）

### 5.2 微交互（更像“专业装备反馈”）
*   **Press**：scale-95 + 轻微内阴影（模拟按压）
*   **Hover**：上浮 2–4px + 阴影增强 + 边框提亮（强调“可点击”）
*   **Focus**：使用 `accent/border` + `info/soft` 组合环（清晰但不刺眼）

### 5.3 加载策略（你原本很好，这里再升级）
*   首选 Skeleton（保持布局稳定）
*   Skeleton 动画要克制：弱 shimmer 或轻微明暗过渡（避免“闪”）
*   数据刷新：数字可用短暂淡入/上滚 150–220ms（不要弹跳）

### 5.4 可访问性（必须写进规范）
*   支持 `prefers-reduced-motion`：位移动效降级为淡入淡出
*   交互控件 focus ring 不可省略（键盘用户必需）
*   小字号 + 玻璃背景必须确保足够对比（不够就提高 Surface 不透明度）

## 6. 组件规范（最能体现“动感精准”的落地部分）

### 6.1 Button（建议做三种体系）
*   **Primary CTA（爆发一击）**
    *   背景：`accent/solid`
    *   文本：`text/onAccent`
    *   Hover：加亮或加微光晕（小范围）
*   **Secondary（专业耐用）**
    *   深底 + `accent/border` 描边 + `accent/solid` 文本
    *   Hover：底用 `accent/soft`
*   **Tertiary（轻操作）**
    *   透明底 + 文字强调（用于工具栏）
*   **状态必须齐**：Default / Hover / Active / Focus / Disabled / Loading

### 6.2 Card（两条路线）
*   **Solid Card（信息容器）**：用于表格、列表、设置页（可读性最稳）
*   **Glass Card（展示容器）**：用于 KPI、里程碑、关键推荐（氛围最强）

### 6.3 Data Panel（你的核心优势，强化“Precision”）
*   **关键数值**：等宽 + 大号
*   **单位**：小一档 + secondary 色
*   **趋势**：Electric Blue 负责“线/科技”，Volt 负责“关键点/峰值”
*   **对齐**：统一基线、统一小数位规则

### 6.4 表格/列表（耐用产品最常用）
*   行高固定，斑马纹用极弱对比（不要花）
*   选中态：`accent/soft` 背景 + `accent/border` 左侧指示条（“精准锁定”感很强）

### 6.5 票据类 (Transactional)
*   **拟物化收据**：使用锯齿边 (`linear-gradient`) + 点状引导线
*   **字体**：金额使用 Font Mono
*   **布局**：双线合计，模拟真实打印小票

## 7. 视觉纹理与品牌符号（让“运动装备感”更具体）
*   允许轻微 **碳纤维/磨砂涂层** 质感（极弱、不可抢文本）
*   图形语言：速度线、轨迹弧线、切角（但要统一角度与粗细）
*   圆角建议统一：8（控件）/ 12（卡片）/ 16（大容器），不要混乱
