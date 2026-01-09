# 🏸 String Service Platform — Breathing Light UI 设计规范

- 版本：v5.0（Breathing Light · 温暖橙色主强调）

---

## 📘 目录

1. 设计理念（Design Philosophy）
2. 色彩系统（Color System — Breathing Light）
3. 字体系统（Typography）
4. 圆角、阴影、边框规范
5. 布局与间距（Spacing System）
6. UI 组件（Components）
7. 用户端页面风格（App UI）
8. 管理后台风格（Admin Dashboard）
9. 图表风格（Data Visualization）
10. 动效与微交互（Micro-interaction）
11. 交易类组件（Transactional Design）

---

## 🧠 1. 设计理念（Design Philosophy）

关键词：**Breathing / Calm / Trust / Clean**

- 白色与浅灰为主，让信息“呼吸”，降低视觉疲劳
- 主强调色仅用于关键动作与重要状态
- 通过清晰层级和轻阴影强调重点而非复杂装饰
- 动效轻且可预期，优先保证信息读取效率

---

## 🎨 2. 色彩系统（Breathing Light）

### 2.1 主体色板（Token 建议）

**Base / Surface**
- `bg/primary`: Gray-50 `#F9FAFB`
- `bg/card`: White `#FFFFFF`
- `border/subtle`: Gray-100 `#F3F4F6`

**Text**
- `text/primary`: Gray-900 `#111827`
- `text/secondary`: Gray-500 `#6B7280`
- `text/tertiary`: Gray-400 `#9CA3AF`
- `text/onAccent`: `#FFFFFF`

**Accent (Orange)**
- `accent/solid`: `#F97316`
- `accent/soft`: `rgba(249,115,22,0.10)`
- `accent/border`: `rgba(249,115,22,0.30)`

**状态色**
- `success`: `#10B981`
- `warning`: `#F59E0B`
- `danger`: `#EF4444`
- `info`: `#3B82F6`

### 2.2 Light / Dark 策略

- 全系统以 Light 为主
- 不使用大面积深色背景

---

## 🔤 3. 字体系统（Typography）

- 标题 / 正文：Poppins / system-ui
- 数字 / 金额：JetBrains Mono / ui-monospace

### 3.1 字体规格

| 用途       | 字重 | 大小 |
| ---------- | ---- | ---- |
| H1         | 700  | 24px |
| H2         | 600  | 20px |
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

**阴影（Light）**
- `shadow-sm`: 轻阴影
- `shadow-md`: 重要层级卡片
- `shadow-card`: 普通卡片
- `shadow-card-hover`: Hover 强调

**边框**
- 使用 `border-gray-100` 作为主分割线

---

## 📏 5. 布局与间距（Spacing System）

- 4pt 间距系统：4/8/12/16/24/32
- 内容区宽度：`max-w-xl` 或 `max-w-2xl`
- 卡片内边距：`p-4` / `p-5` / `p-6`
- 区块垂直间距：`space-y-6` / `space-y-8`

---

## 🧩 6. UI 组件（Components）

### 6.1 Button

**Primary CTA**
- 背景：`accent/solid`
- 文字：`text/onAccent`
- Hover：`hover:shadow-sm` + `hover:opacity-90`

**Secondary**
- 白底 + `accent/border`
- Hover：`accent/soft`

**Ghost**
- 透明底 + 文字强调

### 6.2 Card

- `bg-white` + `border-gray-100` + `shadow-sm`
- 可点击卡片使用 `hover:shadow-md`

### 6.3 表格 / 列表

- 头部文字 `text-text-secondary`
- Hover 行：`bg-gray-50`

### 6.4 图标

- 使用 `lucide-react`
- 容器：`w-10 h-10`
- 图标本体：`w-5 h-5`

---

## 📱 7. 用户端页面（App UI）

- 页面背景：`bg-gray-50`
- 卡片：白色 + 轻边框 + 轻阴影
- 关键 CTA 使用橙色主强调

---

## 💼 8. 管理后台（Admin Dashboard）

- 主背景保持 `bg-gray-50`
- 侧边栏使用白色卡片化
- 数据表格默认紧凑排列 + 明确对齐

---

## 📊 9. 图表（Charts）

- 线图：`info` 作为主色
- 关键点：`accent`
- 图表容器：白色卡片 + 轻阴影

---

## ✨ 10. 动效（Micro-interaction）

- Hover：轻微阴影 + 1-2px 上浮
- Press：`scale-97`
- Skeleton：浅灰 shimmer

---

## 🧾 11. 交易类组件（Transactional Design）

针对订单与支付信息，使用“拟物化收据风格”：

- **锯齿边缘**：`linear-gradient` 模拟纸质边缘
- **点状引导线**：`border-dotted` 连接项目与金额
- **等宽字体**：金额 / 数量使用 `font-mono`
- **双线分隔**：`border-double` 强调合计

---

本规范用于指导 String Service Platform 的统一视觉与交互呈现，确保轻盈、清晰、可信与易用。
