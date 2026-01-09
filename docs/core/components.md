# 🧩 UI Components Library

**String Service Platform — Component Specification**  
**Version:** 2.0  
**Last Updated:** 2025-12-19  
**Framework:** React + TypeScript + Tailwind CSS

---

## 📋 Table of Contents

1. Design Principles
2. Color Tokens
3. Core Components
4. Form Components
5. Layout Components
6. Data Display Components
7. Feedback Components
8. Navigation Components
9. Usage Guidelines

---

## Design Principles

All components follow **Paper Court (Breathing Light)**:

- ✅ Paper-like palette with warm whitespace
- ✅ Deep teal accent only for key emphasis
- ✅ Consistent 4pt spacing system
- ✅ Clear layers (page / card / surface)
- ✅ Subtle glass usage for navigation and overlays
- ✅ Space Grotesk + Noto Sans SC + JetBrains Mono typography

---

## Color Tokens

Use Tailwind utility classes mapped to design tokens:

```typescript
const colors = {
  ink: '#F7F3EE',
  elevated: '#FFFFFF',
  surface: '#FFFFFF',
  borderSubtle: '#E6E1DA',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  accent: '#0F766E',
  accentAlt: '#84CC16',
  accentSoft: 'rgba(15,118,110,0.12)',
  accentBorder: 'rgba(15,118,110,0.30)',
  info: '#2563EB',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444'
}
```

---

## Core Components

### 1. Button

**Variants:** Primary, Secondary, Ghost, Danger

```tsx
// File: src/components/Button.tsx

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-150 active:scale-97 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

  const variants = {
    primary: 'bg-accent text-text-onAccent hover:bg-accent/90',
    secondary: 'bg-white text-text-primary border border-border-subtle hover:bg-ink',
    ghost: 'bg-transparent text-text-secondary hover:bg-ink',
    danger: 'bg-danger text-white hover:bg-danger/90'
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
};
```

---

### 2. Badge

```tsx
// File: src/components/Badge.tsx

const variants = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-danger/15 text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-ink-elevated text-text-secondary border border-border-subtle'
};
```

---

## Form Components

### 3. Input

```tsx
// File: src/components/Input.tsx

<input
  className="w-full h-11 px-3 rounded-lg border bg-ink-surface text-text-primary border-border-subtle focus:ring-2 focus:ring-accent-border focus:ring-offset-2 focus:ring-offset-ink"
/>
```

### 4. Select

```tsx
// File: src/components/Select.tsx

<select className="w-full h-11 px-3 rounded-lg border bg-ink-surface text-text-primary border-border-subtle focus:ring-2 focus:ring-accent-border" />
```

### 5. Checkbox

```tsx
// File: src/components/Checkbox.tsx

<input
  type="checkbox"
  className="w-5 h-5 rounded border-border-subtle bg-ink-surface text-accent focus:ring-2 focus:ring-accent-border focus:ring-offset-2 focus:ring-offset-ink"
/>
```

---

## Layout Components

### 6. Card

```tsx
// File: src/components/Card.tsx

<div className="bg-ink-surface rounded-xl border border-border-subtle shadow-sm p-5">
  ...
</div>
```

### 7. Container

```tsx
// File: src/components/Container.tsx

<div className="mx-auto px-4 sm:px-6 max-w-6xl">
  ...
</div>
```

---

## Data Display Components

### 8. Table

- 头部：`text-text-secondary`
- 行 Hover：`bg-ink-elevated/70`

### 9. Stats Card

- 数值使用等宽字体：`font-mono`

### 10. Order Summary Card

- 订单详情页顶部摘要组件
- 包含状态图标、球拍数量、实付金额、状态驱动的主行动按钮

### 11. Receipt Card (Transactional)

- 拟物化收据风格
- 包含：锯齿边缘、点状引导线、双线合计、详细清单
- 字体：金额使用 `font-mono`

---

## Feedback Components

### 10. Toast

- 使用玻璃背景 `glass-strong`
- 左侧色条表达语义（success / warning / danger / info）

### 11. Modal

- `glass-strong` 容器 + `border-border-subtle`
- 关闭方式支持 ESC

---

## Navigation Components

### 12. Bottom Navigation

- 背景：`glass-surface`
- Active：`text-accent`

### 13. Admin Sidebar

- 背景：`bg-ink-surface`
- Active：`bg-accent/10` + 左侧 `border-accent`

---

## Usage Guidelines

- 关键 CTA 使用 Primary Button
- 关键数值使用 `font-mono`
- 玻璃拟态仅用于导航、弹层、关键卡片
- 表格与列表使用 Solid Card

---

**End of Components Documentation**
