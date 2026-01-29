# 🤖 AGENTS.md — AI Agent Development Protocol

**String Service Platform — 通用 AI Agent 开发规范**
**版本：2.0**
**最后更新：2026-01-27**
**适用于：Claude, GPT, Gemini, Copilot 及其他 AI 编程助手**

---

## 📌 1. 概述

本文档是所有 AI Agent 在本项目中进行开发的**唯一行为准则**。

无论你是 Claude、GPT、Gemini 还是其他 AI 模型，在本项目中开发时**必须**遵循此规范。

### 核心原则

```
┌─────────────────────────────────────────────────────────────┐
│                    开发黄金法则                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 先读后写 - 了解上下文再编码                              │
│  2. 复用优先 - 使用现有组件和模块                            │
│  3. 类型安全 - 拒绝 any，拥抱 TypeScript                    │
│  4. 文档驱动 - 每次变更都有记录                              │
│  5. 测试保障 - 关键逻辑必须有测试                            │
│  6. 验证必过 - type-check + lint + test + build            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📌 2. 开发前必须执行（BEFORE CODING）

### STEP 1：阅读项目文档

**必读文档清单：**

| 优先级 | 文档 | 路径 | 内容 |
|--------|------|------|------|
| 🔴 高 | 系统设计 | `docs/core/System-Design-Document.md` | 架构、技术栈、数据流 |
| 🔴 高 | API 规范 | `docs/core/api_spec.md` | 114 个 API 端点定义 |
| 🔴 高 | 数据库设计 | `docs/core/erd.md` | 25 个数据模型 |
| 🟡 中 | 服务架构 | `docs/core/SERVICE_ARCHITECTURE.md` | 27 个服务层说明 |
| 🟡 中 | 业务逻辑 | `docs/core/BUSINESS_LOGIC.md` | 核心算法规则 |
| 🟡 中 | 组件库 | `docs/core/components.md` | UI 组件规范 |
| 🟢 低 | 工具库 | `docs/core/LIB_UTILITIES.md` | Lib 函数说明 |
| 🟢 低 | 最新变更 | `docs/changelogs/` | 最近的变更记录 |

> ⚠️ **禁止在未阅读相关文档的情况下编码**

---

### STEP 2：理解现有代码

在修改任何文件前，必须：

1. **阅读目标文件** - 理解现有实现
2. **追踪数据流** - 从 API → Service → Database
3. **检查依赖** - 确认修改不会破坏其他模块
4. **查看测试** - 了解现有测试覆盖

---

### STEP 3：生成开发计划

在编写代码前，必须输出开发计划：

```markdown
## Development Plan

### 目标
[一句话描述要实现的功能]

### 影响范围
- 修改文件：[列出所有要修改的文件]
- 新增文件：[列出所有新增的文件]
- 数据库变更：[如有 Prisma schema 变更]
- API 变更：[如有新增/修改 API]

### 技术方案
[简述实现思路]

### 风险评估
[可能的风险和缓解措施]
```

---

## 📌 3. 技术栈规范

### 3.1 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 14.x |
| 语言 | TypeScript (严格模式) | 5.3+ |
| 数据库 | PostgreSQL + Prisma ORM | 15 / 6.19 |
| 认证 | NextAuth.js | v5 |
| 样式 | Tailwind CSS | 3.4 |
| 测试 | Vitest + React Testing Library | latest |
| 图标 | Lucide React | latest |

### 3.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase.tsx | `OrderCard.tsx` |
| 工具文件 | camelCase.ts | `formatDate.ts` |
| API 路由 | kebab-case 文件夹 | `api/orders/[id]/route.ts` |
| 变量 | camelCase | `orderTotal` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 类型/接口 | PascalCase | `OrderStatus` |
| 数据库表 | snake_case | `order_items` |
| API 字段 | camelCase | `createdAt` |

### 3.3 文件结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由 (114 个端点)
│   ├── admin/             # 管理端页面
│   └── (user)/            # 用户端页面
├── components/            # 复用组件 (85+)
│   ├── admin/            # 管理端专用组件
│   └── payment/          # 支付相关组件
├── features/              # 功能模块
│   ├── booking/          # 预订流程
│   ├── profile/          # 用户资料
│   └── ...
├── services/              # 业务服务层 (27 个服务)
├── lib/                   # 工具函数 (22 个工具)
├── types/                 # TypeScript 类型定义
└── __tests__/             # 测试文件
```

---

## 📌 4. 代码质量标准

### 4.1 TypeScript 规范

```typescript
// ✅ 正确：使用明确类型
async function getOrder(orderId: string): Promise<Order | null> {
  return prisma.order.findUnique({ where: { id: orderId } });
}

// ❌ 错误：使用 any
async function getOrder(orderId: any): Promise<any> { ... }
```

### 4.2 React 组件规范

```tsx
// ✅ 正确：函数组件 + Props 接口
interface OrderCardProps {
  order: Order;
  onSelect?: (id: string) => void;
}

export function OrderCard({ order, onSelect }: OrderCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      {/* 内容 */}
    </div>
  );
}

// ❌ 错误：无类型、Class 组件
export default class OrderCard extends React.Component { ... }
```

### 4.3 API 路由规范

```typescript
// ✅ 正确：标准 API 结构
import { requireAuth } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { AppError } from '@/lib/api-errors';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const data = await getOrdersForUser(user.id);
    return successResponse(data);
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error('[API] Unexpected error:', error);
    return errorResponse('SYSTEM_ERROR', 'An unexpected error occurred', 500);
  }
}
```

### 4.4 错误处理规范

```typescript
// ✅ 正确：使用 AppError
import { AppError } from '@/lib/api-errors';

if (!order) {
  throw new AppError('ORDER_NOT_FOUND', 'Order does not exist', 404);
}

// ❌ 错误：直接抛出 Error
throw new Error('Order not found');
```

**错误码必须在 `docs/ERROR_CODES.md` 中定义**

### 4.5 日志规范

```typescript
// ✅ 正确：使用 console.info，带上下文
console.info('[OrderService] Order created:', { orderId, userId });

// ❌ 错误：使用 console.log
console.log('order created');
```

### 4.6 注释规范

```typescript
/**
 * 计算订单积分（包含会员倍率）
 * @param orderAmount - 订单金额（RM）
 * @param membershipTier - 会员等级
 * @returns 应获得的积分数
 */
function calculateOrderPoints(
  orderAmount: number,
  membershipTier: MembershipTier
): number {
  // NOTE: 仅在订单完成时调用，不处理退款场景
  const basePoints = Math.floor(orderAmount);
  const multiplier = getPointsMultiplier(membershipTier);
  return Math.floor(basePoints * multiplier);
}
```

**注释规则：**
- 使用 `NOTE:` 代替 `TODO:` 和 `FIXME:`
- 复杂业务逻辑必须有注释
- 公共函数使用 JSDoc 风格

---

## 📌 5. 安全规范

### 5.1 认证检查

```typescript
// 需要认证的 API
const user = await requireAuth();

// 需要管理员权限的 API
const admin = await requireAdmin();
```

### 5.2 输入验证

```typescript
import { z } from 'zod';

const createOrderSchema = z.object({
  stringId: z.string().cuid(),
  tension: z.number().min(15).max(35),
  notes: z.string().max(500).optional()
});

// 使用验证
const data = createOrderSchema.parse(body);
```

### 5.3 禁止事项

- ❌ 硬编码密钥或密码
- ❌ 在响应中返回敏感信息
- ❌ 直接拼接 SQL（使用 Prisma）
- ❌ 跳过权限检查
- ❌ 信任客户端输入

---

## 📌 6. UI/UX 规范

### 6.1 设计系统 - Paper Court

| 元素 | Tailwind 类 |
|------|-------------|
| 页面背景 | `bg-gray-50` |
| 卡片背景 | `bg-white` |
| 卡片边框 | `border border-gray-100` |
| 卡片阴影 | `shadow-sm` |
| 圆角 | `rounded-xl` |
| 主色调 | `accent` (#0F766E) |

### 6.2 标准卡片样式

```tsx
// 基础卡片
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">

// 强调卡片
<div className="bg-accent/10 border border-accent/30 rounded-xl p-4">

// 可点击卡片
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
```

### 6.3 间距规范

| 元素 | 间距类 |
|------|--------|
| 页面内边距 | `px-4` / `px-5` |
| 区块间距 | `space-y-6` / `space-y-8` |
| 卡片内边距 | `p-4` / `p-5` / `p-6` |
| 内容宽度 | `max-w-xl` / `max-w-2xl` |

### 6.4 组件复用

**必须复用现有组件：**

```tsx
// ✅ 正确
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';

// ❌ 错误：创建重复组件
const MyButton = () => <button className="...">...</button>;
```

---

## 📌 7. 开发完成后必须执行（AFTER CODING）

### STEP 1：运行验证命令

```bash
# 类型检查
npm run type-check

# Lint 检查
npm run lint

# 运行测试
npm run test:run

# 构建验证
npm run build
```

**所有命令必须通过**

---

### STEP 2：创建变更日志

在 `docs/changelogs/YYYY-MM/` 创建 `change_log_YYYY-MM-DD_<feature>.md`：

```markdown
# Change Log — YYYY-MM-DD

## Summary
[简述变更内容]

## Changes

### Added
- [新增功能]

### Modified
- [修改功能]

### Fixed
- [修复问题]

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/...` | Added/Modified | [描述] |

## API Changes
[如有 API 变更]

## Database Changes
[如有数据库变更]

## Testing
- [ ] 类型检查通过
- [ ] Lint 检查通过
- [ ] 测试通过
- [ ] 构建成功
```

---

### STEP 3：更新相关文档

| 变更类型 | 需要更新的文档 |
|----------|----------------|
| 新增 API | `docs/core/api_spec.md` |
| 新增模型 | `docs/core/erd.md` |
| 新增服务 | `docs/core/SERVICE_ARCHITECTURE.md` |
| 新增组件 | `docs/core/components.md` |
| 新增工具 | `docs/core/LIB_UTILITIES.md` |
| 业务逻辑 | `docs/core/BUSINESS_LOGIC.md` |
| 环境变量 | `docs/guides/ENVIRONMENT_SETUP.md` |
| 新增错误码 | `docs/ERROR_CODES.md` |

---

## 📌 8. 禁止事项（PROHIBITED）

| 序号 | 禁止行为 | 原因 |
|------|----------|------|
| 1 | 不读上下文就编码 | 会破坏现有架构 |
| 2 | 随意创建 API | 必须符合 api_spec.md |
| 3 | 修改数据库不更新 ERD | 文档失去同步 |
| 4 | 不写变更日志 | 无法追踪历史 |
| 5 | 输出不完整代码 | 无法运行 |
| 6 | 使用 `any` 类型 | 类型不安全 |
| 7 | 使用 `console.log` | 生产环境用 `console.info` |
| 8 | 使用 `TODO/FIXME` | 使用 `NOTE` |
| 9 | 跳过验证步骤 | 代码质量无法保证 |
| 10 | 破坏现有功能 | 必须向后兼容 |

---

## 📌 9. 质量检查清单

每次开发完成前检查：

### 代码验证
- [ ] `npm run type-check` 通过
- [ ] `npm run lint` 通过
- [ ] `npm run test:run` 通过
- [ ] `npm run build` 成功

### 代码规范
- [ ] 使用正确的命名规范
- [ ] 使用 AppError 处理错误
- [ ] 使用 console.info 而非 console.log
- [ ] 复杂逻辑有注释说明
- [ ] 复用现有组件和工具

### 安全规范
- [ ] API 有正确的认证检查
- [ ] 输入数据经过验证
- [ ] 无硬编码敏感信息

### 文档规范
- [ ] 创建变更日志
- [ ] 更新相关文档

---

## 📌 10. 快速参考

### 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run type-check   # TypeScript 检查
npm run lint         # ESLint 检查
npm run test         # 运行测试 (watch)
npm run test:run     # 运行测试 (单次)
npm run db:push      # 推送数据库 schema
npm run db:studio    # 打开 Prisma Studio
```

### 常用导入

```typescript
// 数据库
import { prisma } from '@/lib/prisma';

// 认证
import { requireAuth, requireAdmin } from '@/lib/server-auth';

// API 响应
import { successResponse, errorResponse } from '@/lib/api-response';

// 错误处理
import { AppError } from '@/lib/api-errors';

// 验证
import { z } from 'zod';
```

### 文档快速索引

| 需要了解 | 查看文档 |
|----------|----------|
| 项目概述 | `README.md` |
| API 列表 | `docs/core/api_spec.md` |
| 数据模型 | `docs/core/erd.md` |
| 组件库 | `docs/core/components.md` |
| 业务逻辑 | `docs/core/BUSINESS_LOGIC.md` |
| 错误码 | `docs/ERROR_CODES.md` |
| 开发模板 | `docs/DEVELOPMENT_TEMPLATES.md` |
| 检查清单 | `docs/CODE_REVIEW_CHECKLIST.md` |
| 测试指南 | `docs/guides/TESTING_GUIDE.md` |
| 故障排除 | `docs/guides/TROUBLESHOOTING.md` |

---

## 📌 11. 响应格式规范

所有 Agent 输出必须符合以下结构：

```markdown
## Development Plan
[开发计划]

## Implementation
[按文件分段的完整代码]

## Updated Docs
[需要更新的文档内容]

## Notes
[补充说明、技术债、后续优化点]
```

---

> **本文档适用于所有 AI 编程助手**
> **版本：2.0**
> **最后更新：2026-01-27**
