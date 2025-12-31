# 🏸 String Service Platform — Kinetic Precision 2.0 UI 设计规范

- 版本：v4.0（深色 + 精密动感 + 玻璃拟态）

---

## 📘 目录

1. 设计理念（Design Philosophy）
2. 色彩系统（Color System — Kinetic Precision）
3. 字体系统（Typography）
4. 圆角、阴影、边框规范
5. 布局与间距（Spacing System）
6. UI 组件（Components）
7. 用户端页面风格（App UI）
8. 管理后台风格（Admin Dashboard）
9. 图表风格（Data Visualization）
10. 动效与微交互（Micro-interaction）
11. 玻璃拟态规范（Glassmorphism）

---

## 🧠 1. 设计理念（Design Philosophy）

关键词：**Precision / Kinetic / Controlled Energy**

- 信息层级清晰优先于炫技视觉
- 动效短、准、可预期，强调“响应快”
- Volt Green 只用于关键强调，不大面积铺色
- 深色背景 + 玻璃拟态必须保持高对比与可读性

---

## 🎨 2. 色彩系统（Kinetic Precision）

### 2.1 主体色板（Token 建议）

**Brand / Base**
- `bg/primary`: Deep Navy `#0F172A`
- `bg/elevated`: `#111C33`
- `surface/solid`: `#1E293B`
- `border/subtle`: `rgba(148,163,184,0.18)`

**Text**
- `text/primary`: `#E2E8F0`
- `text/secondary`: `#94A3B8`
- `text/tertiary`: `rgba(148,163,184,0.70)`
- `text/onAccent`: `#0B1220`

**Accent: Volt Green**
- `accent/solid`: `#D4FF00`
- `accent/soft`: `rgba(212,255,0,0.14)`
- `accent/border`: `rgba(212,255,0,0.38)`

**Secondary Accent: Electric Blue**
- `info/solid`: `#3B82F6`
- `info/soft`: `rgba(59,130,246,0.14)`

**状态色**
- `success`: `#14B8A6`
- `warning`: `#F59E0B`
- `danger`: `#EF4444`

### 2.2 Light / Dark 策略

- Dark Mode 为主战场
- Light Mode 若启用需保持 Volt 低占比

---

## 🔤 3. 字体系统（Typography）

- 标题 / 正文：Inter / SF Pro / system-ui
- 数据等宽：JetBrains Mono / SF Mono / ui-monospace

### 3.1 字体规格（App 端）

| 用途       | 字重 | 大小 |
| ---------- | ---- | ---- |
| 大标题 H1  | 700  | 24px |
| 小标题 H2  | 600  | 20px |
| 卡片标题   | 600  | 16px |
| 正文       | 400  | 14px |
| 次要文字   | 400  | 12px |

### 3.2 文字规则

- 标题 Tracking 轻微收紧（-1% ~ -2%）
- 数据展示使用等宽字体 + 固定宽度容器
- 单位字体缩小一档，颜色降低一档

---

## 🔳 4. 圆角、阴影、边框规范

**圆角**
- 按钮 / 输入框：`8px`
- 卡片：`12px`
- 弹窗 / 大容器：`16px`

**阴影（深色环境）**
- `shadow-sm`: 低强度分层阴影
- `shadow-md`: 适度体积阴影
- `shadow-glow`: Volt 轻微光晕（CTA 或关键 KPI）

**边框**
- 1px `border/subtle` 作为主要分割

---

## 📏 5. 布局与间距（Spacing System）

- 4pt 间距系统：4/8/12/16/24/32
- 卡片内边距：16 或 24
- 列表项高度稳定，减少视觉噪音

---

## 🧩 6. UI 组件（Components）

### 6.1 Button

**Primary CTA**
- 背景：`accent/solid`
- 文字：`text/onAccent`
- Hover：轻微 Glow

**Secondary**
- 深底 + `accent/border` 描边
- Hover：`accent/soft`

**Tertiary**
- 透明底 + 文字强调

### 6.2 Card

- Solid Card：信息容器（列表 / 表格 / 设置）
- Glass Card：KPI / 关键推荐

### 6.3 表格 / 列表

- 斑马纹极弱，选中态用 `accent/soft` + 左侧指示条

### 6.4 票据类 (Transactional)
- **收据风格**：拟物化设计，模拟真实打印机输出
- **边缘处理**：锯齿边 (Zigzag) `linear-gradient` 实现
- **引导线**：点状 (Dotted) `border-dotted` 连接项目与金额
- **字体**：关键金额使用 Font Mono (等宽)

---

## 📱 7. 用户端页面（App UI）

- 深色背景 + 分层卡片
- 关键数据使用等宽字体
- 关键按钮（预约/支付）使用 Volt

---

## 💼 8. 管理后台（Admin Dashboard）

- 统一深色背景
- Sidebar 使用 `bg/elevated`
- 统计卡片强调数字对齐与固定宽度

---

## 📊 9. 图表（Charts）

- 线图：Electric Blue
- 关键点：Volt Green
- 图表容器使用 Solid Card

---

## ✨ 10. 动效（Micro-interactions）

- Hover：上浮 2–4px + 阴影增强
- Press：scale-97
- Skeleton：轻 shimmer 或淡入淡出

---

## 🧊 11. 玻璃拟态规范（Glassmorphism）

**配方**
- 背景：`rgba(30,41,59,0.55)`
- Blur：12–20
- 描边：`rgba(226,232,240,0.10)` + 暗边

**使用边界**
- 顶部导航 / 关键 KPI / 弹层
- 大列表与表格用 Solid Card

---

本规范用于指导 String Service Platform 在 App + Admin 上的统一视觉与交互呈现，确保风格精准、稳定、专业、耐用。
