# 🧩 UI Components Library

**String Service Platform — Component Specification**
**Version:** 2.1
**Last Updated:** 2026-01-28
**Framework:** React 18 + TypeScript + Tailwind CSS

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
  // Light Mode
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
  danger: '#EF4444',

  // Dark Mode (use with dark: prefix)
  dark: '#1a1a1a',
  darkElevated: '#2a2a2a',
  darkSurface: '#333333',
  darkBorder: '#374151', // gray-700
  darkTextPrimary: '#f3f4f6', // gray-100
  darkTextSecondary: '#9ca3af', // gray-400
  darkTextTertiary: '#6b7280', // gray-500
}
```

### Dark Mode Usage

```tsx
// Container backgrounds
<div className="bg-ink dark:bg-dark" />

// Card backgrounds
<div className="bg-white dark:bg-dark-elevated" />

// Borders
<div className="border-border-subtle dark:border-gray-700" />

// Text colors
<p className="text-text-primary dark:text-gray-100" />
<p className="text-text-secondary dark:text-gray-400" />
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

### 11. Membership Card

- 会员中心卡片（Profile）
- 展示当前等级、积分、消费进度与权益
- 使用 DB enum：`SILVER/GOLD/VIP`

```tsx
// File: src/components/MembershipCard.tsx
<MembershipCard currentTier="SILVER" points={120} totalSpent={300} nextTier="GOLD" spentProgress={45} ordersProgress={20} spentTarget={200} ordersTarget={5} benefits={[]} />
```

### 12. Order Timeline

- 用户订单详情状态时间轴
- 支持 `received/picked_up` 阶段与状态备注

```tsx
// File: src/components/OrderTimeline.tsx
<OrderTimeline status="in_progress" statusLogs={[]} />
```

### 13. Admin Order Progress

- 管理端订单状态管理 + ETA/排队信息
- 搭配 `PATCH /api/admin/orders/:id/status` 写入状态备注

```tsx
// File: src/components/admin/AdminOrderProgress.tsx
<AdminOrderProgress orderId={order.id} currentStatus={order.status} onStatusUpdate={refresh} />
```

### 11. Order Status Capsule

- 首页“当前订单状态”胶囊卡片
- 展示最新订单状态 + 主行动按钮 + 一键复单入口
- 与 Paper Court 卡片体系一致

```tsx
// File: src/features/home/OrderStatusCapsule.tsx
<OrderStatusCapsule order={latestOrder} loading={loading} />
```

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

### 12. EmptyState

空状态占位组件，13 种可爱 SVG 插画：

```tsx
<EmptyState
  type="no-orders"
  title="暂无订单"
  description="预约穿线服务开始您的第一单"
  actionLabel="立即预约"
  actionHref="/booking"
/>
```

可用类型：`no-orders`, `no-reviews`, `no-vouchers`, `no-packages`, `no-notifications`, `no-points`, `no-referrals`, `no-inventory`, `no-users`, `no-payments`, `no-data`, `search-empty`, `error`

### 13. OnboardingTutorial

步骤式用户引导组件：

```tsx
<OnboardingTutorial
  steps={[
    { id: 'step1', title: '欢迎', description: '...', position: 'center' },
    { id: 'step2', title: '功能A', description: '...', targetSelector: '#feature-a' },
  ]}
  storageKey="my-tutorial"
  onComplete={() => console.log('完成')}
/>
```

### 14. Confetti

庆祝动效组件：

```tsx
import { useConfetti, OrderCompleteConfetti } from '@/components/Confetti';

// Hook 方式
const { fire } = useConfetti();
fire('celebration');

// 组件方式（订单完成时自动触发）
<OrderCompleteConfetti trigger={orderCompleted} />
```

可用效果：`celebration`, `fireworks`, `stars`, `snow`, `emoji`

---

## Navigation Components

### 15. Bottom Navigation

- 背景：`glass-surface`
- Active：`text-accent`

### 16. Admin Sidebar

- 背景：`bg-ink-surface`
- Active：`bg-accent/10` + 左侧 `border-accent`

### 17. ThemeProvider

主题管理系统，支持浅色/深色/跟随系统：

```tsx
// layout.tsx 中包裹应用
<ThemeProvider defaultTheme="system">
  {children}
</ThemeProvider>

// 使用主题切换按钮
import { ThemeToggle } from '@/components/ThemeProvider';
<ThemeToggle />

// 使用主题选择器（三选一）
import { ThemeSelector } from '@/components/ThemeProvider';
<ThemeSelector />

// 在组件中获取当前主题
import { useTheme } from '@/components/ThemeProvider';
const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
```

---

## Usage Guidelines

- 关键 CTA 使用 Primary Button
- 关键数值使用 `font-mono`
- 玻璃拟态仅用于导航、弹层、关键卡片
- 表格与列表使用 Solid Card

---

**End of Components Documentation**

---

## Appendix: Component Reference

### Core Components (src/components/)

| Component | File | Description |
|-----------|------|-------------|
| `Button` | Button.tsx | Primary button with variants |
| `Badge` | Badge.tsx | Status and label badges |
| `Input` | Input.tsx | Form input field |
| `Select` | Select.tsx | Dropdown select |
| `Checkbox` | Checkbox.tsx | Form checkbox |
| `Card` | Card.tsx | Container card |
| `Container` | Container.tsx | Layout container |
| `AvatarUploader` | AvatarUploader.tsx | Profile avatar upload |
| `BrandLogo` | BrandLogo.tsx | App logo component |
| `ConfirmDialog` | ConfirmDialog.tsx | Confirmation modal |
| `FeaturedReviews` | FeaturedReviews.tsx | Reviews carousel |
| `ImagePreview` | ImagePreview.tsx | Image zoom modal |
| `ImageUploader` | ImageUploader.tsx | General image upload |
| `InviteCard` | InviteCard.tsx | Referral invite UI |
| `MembershipCard` | MembershipCard.tsx | Membership status display |
| `NotificationBell` | NotificationBell.tsx | Header notification icon |
| `NotificationItem` | NotificationItem.tsx | Single notification |
| `NotificationPanel` | NotificationPanel.tsx | Notification dropdown |
| `OptimizedImage` | OptimizedImage.tsx | Next.js Image wrapper |
| `OrderPaymentSection` | OrderPaymentSection.tsx | Payment options |
| `OrderPhotosDisplay` | OrderPhotosDisplay.tsx | Photo gallery viewer |
| `OrderStatusBadge` | OrderStatusBadge.tsx | Order status indicator |
| `OrderTimeline` | OrderTimeline.tsx | Order progress timeline |
| `PackageCard` | PackageCard.tsx | Package purchase card |
| `PaymentReceiptUploader` | PaymentReceiptUploader.tsx | Receipt upload |
| `ReferralList` | ReferralList.tsx | Referral history |
| `ReferralStatsCard` | ReferralStatsCard.tsx | Referral statistics |
| `ReviewCard` | ReviewCard.tsx | Single review display |
| `ReviewForm` | ReviewForm.tsx | Review submission |
| `Sidebar` | Sidebar.tsx | Navigation sidebar |
| `Skeleton` | Skeleton.tsx | Loading placeholder |
| `Spinner` | Spinner.tsx | Loading spinner |
| `InlineLoading` | InlineLoading.tsx | Inline loading indicator |
| `PageLoading` | PageLoading.tsx | Full page loading |
| `SectionLoading` | SectionLoading.tsx | Section loading placeholder |
| `StarRating` | StarRating.tsx | 5-star rating |
| `Tabs` | Tabs.tsx | Tab navigation |
| `TngQRCodeDisplay` | TngQRCodeDisplay.tsx | TNG payment QR |
| `WhatsAppButton` | WhatsAppButton.tsx | WhatsApp contact |
| `ThemeProvider` | ThemeProvider.tsx | 主题上下文、切换器、选择器 |
| `OnboardingTutorial` | OnboardingTutorial.tsx | 通用步骤式引导教程 |
| `HomeOnboarding` | HomeOnboarding.tsx | 首页用户引导 |
| `ServiceWorkerRegistration` | ServiceWorkerRegistration.tsx | PWA Service Worker 注册 |
| `EmptyState` | EmptyState.tsx | 空状态插画组件 |
| `FirstOrderModal` | FirstOrderModal.tsx | 首单优惠弹窗 |
| `Confetti` | Confetti.tsx | 庆祝动效组件 |

### Admin Components (src/components/admin/)

| Component | File | Description |
|-----------|------|-------------|
| `AdminDashboardPage` | AdminDashboardPage.tsx | Dashboard overview |
| `AdminInventoryDetailPage` | AdminInventoryDetailPage.tsx | Inventory detail |
| `AdminInventoryListPage` | AdminInventoryListPage.tsx | Inventory list |
| `AdminNotificationsPage` | AdminNotificationsPage.tsx | Notifications mgmt |
| `AdminOrderDetailPage` | AdminOrderDetailPage.tsx | Order detail |
| `AdminOrderListPage` | AdminOrderListPage.tsx | Order list |
| `AdminOrderProgress` | AdminOrderProgress.tsx | Status management |
| `AdminPackageDetailPage` | AdminPackageDetailPage.tsx | Package detail |
| `AdminPackageListPage` | AdminPackageListPage.tsx | Package list |
| `AdminReportsPage` | AdminReportsPage.tsx | Reports dashboard |
| `AdminUserDetailPage` | AdminUserDetailPage.tsx | User detail |
| `AdminUserListPage` | AdminUserListPage.tsx | User list |
| `AdminVoucherDetailPage` | AdminVoucherDetailPage.tsx | Voucher detail |
| `AdminVoucherListPage` | AdminVoucherListPage.tsx | Voucher list |
| `DistributeVoucherModal` | DistributeVoucherModal.tsx | Voucher distribution |
| `LowStockAlert` | LowStockAlert.tsx | Low stock warnings |
| `OrderPhotosUploader` | OrderPhotosUploader.tsx | Photo upload for orders |
| `PaymentReceiptVerifier` | PaymentReceiptVerifier.tsx | Receipt verification |
| `PaymentVerificationPage` | PaymentVerificationPage.tsx | Payment review |
| `RestockModal` | RestockModal.tsx | Restock dialog |
| `StockHistory` | StockHistory.tsx | Stock change log |

### Feature Components (src/features/)

| Feature | Key Components | Description |
|---------|----------------|-------------|
| `booking/` | BookingFlow, MultiRacketBookingFlow, StringSelector, ServiceMethodSelector | Order creation flow |
| `landing/` | LandingPage, Features, SpotlightCard, HeroSection | Public landing page |
| `profile/` | ProfilePage, EditProfilePage, ChangePasswordPage, PointsCenterPage | User profile mgmt |
| `reviews/` | MyReviewsPage, ReviewDetailPage | Review management |
| `referrals/` | ReferralLeaderboardPage, ReferralDashboard | Referral program |
| `payment/` | PaymentPage, PaymentStatusPage | Payment flow |

### Payment Components (src/components/payment/)

| Component | File | Description |
|-----------|------|-------------|
| `PaymentPage` | PaymentPage.tsx | Main payment flow |
| `PaymentMethodSelector` | PaymentMethodSelector.tsx | Method selection |
| `PaymentSummary` | PaymentSummary.tsx | Order summary |
| `PaymentStatus` | PaymentStatus.tsx | Status display |

---

## Component Props Reference

### Button

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

### Badge

```typescript
interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}
```

### OrderTimeline

```typescript
interface OrderTimelineProps {
  status: OrderStatus;
  statusLogs?: StatusLog[];
  createdAt?: string;
  completedAt?: string;
}
```

### MembershipCard

```typescript
interface MembershipCardProps {
  currentTier: 'REGULAR' | 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP';
  points: number;
  totalSpent: number;
  nextTier?: string;
  spentProgress: number;
  ordersProgress: number;
  spentTarget?: number;
  ordersTarget?: number;
  benefits?: Benefit[];
}
```

### PackageCard

```typescript
interface PackageCardProps {
  package: Package;
  onPurchase?: () => void;
  showPurchaseButton?: boolean;
  highlighted?: boolean;
}
```

---

**End of Component Reference**
