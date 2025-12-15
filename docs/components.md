# 🧩 UI Components Library

**String Service Platform — Component Specification**  
**Version:** 1.0  
**Last Updated:** 2025-12-11  
**Framework:** React + TypeScript + Tailwind CSS

---

## 📋 Table of Contents

1. [Design Principles](#design-principles)
2. [Color Tokens](#color-tokens)
3. [Component Categories](#component-categories)
4. [Core Components](#core-components)
5. [Form Components](#form-components)
6. [Layout Components](#layout-components)
7. [Data Display Components](#data-display-components)
8. [Feedback Components](#feedback-components)
9. [Navigation Components](#navigation-components)
10. [Usage Guidelines](#usage-guidelines)

---

## Design Principles

All components follow the **UI Design Guide** principles:

- ✅ Modern flat design (no gradients)
- ✅ Consistent spacing (4pt system)
- ✅ Clean neutral colors
- ✅ Rounded corners (8px buttons, 12px cards)
- ✅ Soft shadows
- ✅ Inter font family
- ✅ Fully accessible (WCAG 2.1 AA)

---

## Color Tokens

Use Tailwind CSS utility classes matching our design system:

```typescript
// Primary Colors
const colors = {
  primary: '#2563EB',      // bg-blue-600
  primaryHover: '#1D4ED8', // bg-blue-700
  
  // Neutrals
  gray900: '#0F172A',      // text-slate-900
  gray700: '#334155',      // text-slate-700
  gray500: '#64748B',      // text-slate-500
  gray300: '#CBD5E1',      // border-slate-300
  gray200: '#E2E8F0',      // border-slate-200
  gray100: '#F8FAFC',      // bg-slate-100
  gray50: '#FDFDFE',       // bg-slate-50
  
  // Functional
  success: '#16A34A',      // bg-green-600
  warning: '#F59E0B',      // bg-amber-500
  error: '#DC2626',        // bg-red-600
  info: '#0284C7'          // bg-sky-600
}
```

---

## Component Categories

1. **Core Components** - Buttons, Badges, Icons
2. **Form Components** - Inputs, Selects, Checkboxes
3. **Layout Components** - Cards, Containers, Grid
4. **Data Display** - Tables, Lists, Stats
5. **Feedback** - Toasts, Modals, Loading
6. **Navigation** - Bottom Nav, Sidebar, Tabs

---

## Core Components

### 1. Button

**Variants:** Primary, Secondary, Ghost, Danger

#### 1.1 Primary Button

```tsx
// File: src/components/Button.tsx

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

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
  const baseStyles = 'font-semibold rounded-lg transition-all duration-150 active:scale-97 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300',
    ghost: 'bg-transparent hover:bg-slate-100 text-blue-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };
  
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-12 px-6 text-base'
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {icon && !loading && icon}
      {children}
    </button>
  );
};
```

**Usage:**
```tsx
<Button variant="primary">Continue</Button>
<Button variant="secondary" icon={<PlusIcon />}>Add Item</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button loading>Processing...</Button>
```

---

### 2. Badge

**Usage:** Status indicators, labels, counts

```tsx
// File: src/components/Badge.tsx

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'neutral', 
  size = 'md',
  children 
}) => {
  const variants = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-sky-100 text-sky-700',
    neutral: 'bg-slate-100 text-slate-700'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  
  return (
    <span className={`inline-flex items-center rounded-md font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
```

**Usage:**
```tsx
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
```

---

## Form Components

### 3. Input

**Types:** Text, Email, Tel, Number, Password

```tsx
// File: src/components/Input.tsx

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full h-11 px-3 rounded-lg border 
            ${error ? 'border-red-300' : 'border-slate-300'}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            placeholder:text-slate-400
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="text-sm text-slate-500">{helperText}</p>}
    </div>
  );
};
```

**Usage:**
```tsx
<Input 
  label="Email"
  type="email"
  placeholder="you@example.com"
  leftIcon={<MailIcon />}
/>

<Input 
  label="Password"
  type="password"
  error="Password is too short"
/>
```

---

### 4. Select

```tsx
// File: src/components/Select.tsx

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className,
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        className={`
          w-full h-11 px-3 rounded-lg border 
          ${error ? 'border-red-300' : 'border-slate-300'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          bg-white
          ${className}
        `}
        {...props}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
```

---

### 5. Checkbox & Radio

```tsx
// File: src/components/Checkbox.tsx

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...props }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        {...props}
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
};
```

---

## Layout Components

### 6. Card

```tsx
// File: src/components/Card.tsx

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  padding = 'md',
  shadow = true 
}) => {
  const paddings = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };
  
  return (
    <div className={`
      bg-white rounded-xl border border-slate-200 
      ${shadow ? 'shadow-sm' : ''}
      ${paddings[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
};
```

**Usage:**
```tsx
<Card>
  <h3 className="font-semibold text-slate-900">Order Details</h3>
  <p className="text-sm text-slate-600 mt-1">View your order information</p>
</Card>
```

---

### 7. Container

```tsx
// File: src/components/Container.tsx

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  size = 'lg' 
}) => {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    full: 'max-w-full'
  };
  
  return (
    <div className={`mx-auto px-4 sm:px-6 ${sizes[size]}`}>
      {children}
    </div>
  );
};
```

---

## Data Display Components

### 8. Table

```tsx
// File: src/components/Table.tsx

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
}

export function Table<T>({ columns, data, keyExtractor }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={keyExtractor(item)} className="border-b border-slate-100 hover:bg-slate-50">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm text-slate-600">
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 9. Stats Card

```tsx
// File: src/components/StatsCard.tsx

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon,
  trend 
}) => {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
```

---

## Feedback Components

### 10. Toast Notification

```tsx
// File: src/components/Toast.tsx

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const styles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-500',
    info: 'bg-blue-600'
  };
  
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`${styles[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white">
        ✕
      </button>
    </div>
  );
};
```

---

### 11. Modal

```tsx
// File: src/components/Modal.tsx

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title,
  children,
  size = 'md' 
}) => {
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizes[size]}`}>
        {title && (
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};
```

---

### 12. Loading Spinner

```tsx
// File: src/components/Spinner.tsx

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <div className={`${sizes[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
};
```

---

## Navigation Components

### 13. Bottom Navigation (Mobile)

```tsx
// File: src/components/BottomNav.tsx

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface BottomNavProps {
  items: NavItem[];
}

export const BottomNav: React.FC<BottomNavProps> = ({ items }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {items.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-2 ${
              item.active ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <div className="w-6 h-6">{item.icon}</div>
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};
```

---

### 14. Admin Sidebar

```tsx
// File: src/components/Sidebar.tsx

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 p-4">
      <div className="space-y-1">
        {items.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg
              ${item.active 
                ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600' 
                : 'text-slate-700 hover:bg-slate-100'}
            `}
          >
            <div className="w-5 h-5">{item.icon}</div>
            <span className="text-sm">{item.label}</span>
          </a>
        ))}
      </div>
    </aside>
  );
};
```

---

### 15. Tabs

```tsx
// File: src/components/Tabs.tsx

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              pb-3 px-1 font-medium text-sm border-b-2 transition-colors
              ${activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-600 hover:text-slate-900'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
```

---

## Usage Guidelines

### Component Composition Example

```tsx
// Example: Order Card
<Card>
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="font-semibold text-slate-900">Order #12345</h3>
      <p className="text-sm text-slate-500 mt-1">YONEX BG66UM · 26 lbs</p>
    </div>
    <Badge variant="success">Completed</Badge>
  </div>
  
  <div className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-slate-600">Price</span>
      <span className="font-medium text-slate-900">RM 28.00</span>
    </div>
    <div className="flex justify-between">
      <span className="text-slate-600">Date</span>
      <span className="text-slate-700">Dec 11, 2025</span>
    </div>
  </div>
  
  <Button variant="ghost" fullWidth className="mt-4">
    View Details
  </Button>
</Card>
```

---

### Responsive Design Pattern

```tsx
// Mobile-first responsive layout
<Container>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <StatsCard title="Revenue" value="RM 1,240" />
    <StatsCard title="Orders" value="45" />
    <StatsCard title="Profit" value="RM 560" />
  </div>
</Container>
```

---

### Form Pattern

```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <Input 
    label="Email"
    type="email"
    required
  />
  <Input 
    label="Password"
    type="password"
    required
  />
  <Checkbox label="Remember me" />
  <Button type="submit" fullWidth>
    Sign In
  </Button>
</form>
```

---

## Accessibility Notes

- All interactive elements have focus states
- Color contrast meets WCAG AA standards
- Forms have proper labels and ARIA attributes
- Buttons have descriptive text (no icon-only without aria-label)
- Tables have semantic HTML structure
- Modals trap focus and can be closed with ESC key

---

## File Organization

```
src/
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Table.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── Spinner.tsx
│   ├── BottomNav.tsx
│   ├── Sidebar.tsx
│   ├── Tabs.tsx
│   ├── Checkbox.tsx
│   ├── Container.tsx
│   ├── StatsCard.tsx
│   └── index.ts  // Export all components
```

---

**End of Components Documentation**
