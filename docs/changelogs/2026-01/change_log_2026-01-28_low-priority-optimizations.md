# Change Log — 2026-01-28 低优先级优化

## Summary

完成四项低优先级 UI/UX 优化：
1. 深色模式支持
2. 图片懒加载优化
3. PWA 离线访问支持
4. 用户引导教程

## Changes

### Added

#### 深色模式支持

- **ThemeProvider 组件** (`src/components/ThemeProvider.tsx`)
  - 主题上下文 (ThemeContext) 管理 light/dark/system 三种模式
  - ThemeToggle 按钮组件（太阳/月亮图标切换）
  - ThemeSelector 选择器组件（三选一按钮组）
  - localStorage 持久化用户偏好
  - 监听系统主题变化自动切换
  - 防闪烁脚本（内联在 layout.tsx）

- **Tailwind 深色模式配置** (`tailwind.config.js`)
  - 启用 `darkMode: 'class'`
  - 新增深色调色板：
    ```js
    dark: {
      DEFAULT: '#1a1a1a',
      elevated: '#2a2a2a',
      surface: '#333333',
    }
    ```

#### PWA 离线支持

- **Service Worker 增强** (`public/sw.js`)
  - 静态资源缓存策略 (Cache First)
  - API 请求缓存策略 (Network First with Cache Fallback)
  - 离线页面回退
  - 缓存版本管理和清理

- **Service Worker 注册组件** (`src/components/ServiceWorkerRegistration.tsx`)
  - 生产环境自动注册
  - 更新检测和通知
  - 正确的事件监听器清理

- **离线页面** (`src/app/offline/page.tsx`)
  - 友好的离线提示
  - 网络诊断建议
  - 重试按钮
  - 深色模式支持

#### 用户引导教程

- **OnboardingTutorial 组件** (`src/components/OnboardingTutorial.tsx`)
  - 步骤式引导框架
  - 目标元素高亮显示
  - 自适应定位（top/bottom/left/right/center）
  - Portal 渲染避免 z-index 问题
  - localStorage 记录完成状态
  - 键盘导航支持

- **HomeOnboarding 组件** (`src/components/HomeOnboarding.tsx`)
  - 6 步首页引导流程：
    1. 欢迎页
    2. 在线预约介绍
    3. 订单追踪介绍
    4. 评价功能介绍
    5. 个人中心介绍
    6. 首单优惠提示

### Modified

#### 核心组件深色模式适配

| 组件 | 文件路径 | 变更内容 |
|------|----------|----------|
| Card | `src/components/Card.tsx` | 添加 `dark:bg-dark-elevated`, `dark:border-gray-700` |
| Button | `src/components/Button.tsx` | Secondary/Ghost 变体深色样式 |
| Navbar | `src/components/layout/Navbar.tsx` | 导航栏深色样式 |
| BottomNav | `src/components/BottomNav.tsx` | 底部导航深色样式 |
| PageHeader | `src/components/layout/PageHeader.tsx` | 页面标题栏深色样式 |
| Modal | `src/components/Modal.tsx` | 弹窗深色样式 |
| Badge | `src/components/Badge.tsx` | 标签深色样式 |
| Input | `src/components/Input.tsx` | 输入框深色样式 |
| Skeleton | `src/components/Skeleton.tsx` | 骨架屏深色样式 |

#### 页面深色模式适配

| 页面 | 文件路径 |
|------|----------|
| ProfilePage | `src/features/profile/ProfilePage.tsx` |
| LandingPage | `src/features/landing/LandingPage.tsx` 及子组件 |
| LoginPage | `src/features/auth/LoginPage.tsx` |

#### 图片优化

| 组件 | 文件路径 | 变更内容 |
|------|----------|----------|
| TngQRCodeDisplay | `src/components/TngQRCodeDisplay.tsx` | 使用 Next.js Image + blur placeholder |
| AvatarUploader | `src/components/AvatarUploader.tsx` | 添加 loading 属性 |
| ImageUploader | `src/components/ImageUploader.tsx` | 添加 `loading="lazy"` |

#### 布局集成

- **RootLayout** (`src/app/layout.tsx`)
  - 集成 ThemeProvider
  - 集成 ServiceWorkerRegistration
  - 添加防主题闪烁脚本
  - 主内容区添加 `dark:bg-dark`

- **HomePage** (`src/features/home/HomePage.tsx`)
  - 集成 HomeOnboarding 组件

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/components/ThemeProvider.tsx` | Added | 主题管理组件 |
| `src/components/ServiceWorkerRegistration.tsx` | Added | SW 注册组件 |
| `src/components/OnboardingTutorial.tsx` | Added | 通用引导教程组件 |
| `src/components/HomeOnboarding.tsx` | Added | 首页引导教程 |
| `src/app/offline/page.tsx` | Added | 离线页面 |
| `public/sw.js` | Modified | 增强离线缓存功能 |
| `tailwind.config.js` | Modified | 添加深色模式配置 |
| `src/app/layout.tsx` | Modified | 集成新功能 |
| `src/features/home/HomePage.tsx` | Modified | 集成引导教程 |
| `src/components/Card.tsx` | Modified | 深色模式 |
| `src/components/Button.tsx` | Modified | 深色模式 |
| `src/components/layout/Navbar.tsx` | Modified | 深色模式 |
| `src/components/BottomNav.tsx` | Modified | 深色模式 |
| `src/components/layout/PageHeader.tsx` | Modified | 深色模式 |
| `src/components/Modal.tsx` | Modified | 深色模式 |
| `src/components/Badge.tsx` | Modified | 深色模式 |
| `src/components/Input.tsx` | Modified | 深色模式 |
| `src/components/Skeleton.tsx` | Modified | 深色模式 |
| `src/components/TngQRCodeDisplay.tsx` | Modified | 图片优化 + 深色模式 |
| `src/components/AvatarUploader.tsx` | Modified | 图片优化 + 深色模式 |
| `src/components/ImageUploader.tsx` | Modified | 图片优化 + 深色模式 |
| `src/features/profile/ProfilePage.tsx` | Modified | 深色模式 + 主题选择器 |
| `src/features/landing/LandingPage.tsx` | Modified | 深色模式 |
| `src/features/auth/LoginPage.tsx` | Modified | 深色模式 |

## API Changes

无

## Database Changes

无

## Dependencies

无新增依赖（使用现有的 lucide-react）

## Testing

- [x] TypeScript 类型检查通过
- [x] ESLint 检查通过
- [x] 57 个单元测试全部通过
- [x] 生产构建成功

## Usage

### 深色模式切换

用户可在以下位置切换主题：
- 个人中心 → 账户设置 → 外观主题

支持三种模式：
- 浅色：始终使用浅色主题
- 深色：始终使用深色主题
- 系统：跟随系统设置自动切换

### 离线访问

1. 用户首次访问时，Service Worker 自动缓存静态资源
2. 断网时，已缓存的页面可正常访问
3. 未缓存的页面显示离线提示页面

### 用户引导教程

- 新用户首次登录后自动显示
- 完成或跳过后不再显示（localStorage 记录）
- 开发者可调用 `resetTutorial('home-tutorial')` 重置

## Notes

- 深色模式使用 `darkMode: 'class'` 策略，通过在 `<html>` 元素添加 `dark` 类实现
- Service Worker 仅在生产环境注册，开发环境不启用
- 引导教程使用 Portal 渲染，确保覆盖在所有内容之上
- 所有新组件均支持深色模式

## Screenshots

### 深色模式
- 个人中心主题选择器：浅色/深色/系统三选一按钮
- 深色模式下使用 #1a1a1a 背景，#2a2a2a 卡片背景

### 离线页面
- WifiOff 图标 + 友好提示
- 网络诊断建议列表
- 重试按钮

### 用户引导
- 6 步引导流程
- 高亮目标元素
- 步骤指示器
- 上一步/下一步导航
