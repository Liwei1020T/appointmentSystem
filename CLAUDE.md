# 🧠 Claude Agent Development Protocol

**String Service Platform — Agent 开发治理规范**
**版本：2.0**
**最后更新：2026-01-27**

---

## 📌 1. 目的（Purpose）

此文档规范所有 Claude Agent 的开发行为，确保：

- ✅ 每次开发都是 **高质量、可维护、无回归** 的
- ✅ 代码风格、架构、命名 **完全一致**
- ✅ 所有变更都有 **完整文档记录**
- ✅ 未来的 Agent 能 **无缝接续开发**

**此文档是项目的唯一行为准则（Single Source of Truth）。**

---

## 📌 2. 开发前必须执行的步骤（MANDATORY PRE-WORK）

### ✔ STEP 1：加载项目上下文

**必读文档清单：**

| 文档 | 路径 | 内容 |
|------|------|------|
| 系统设计 | `docs/core/System-Design-Document.md` | 架构、技术栈 |
| API 规范 | `docs/core/api_spec.md` | 114 个 API 端点 |
| ERD | `docs/core/erd.md` | 25 个数据模型 |
| 服务架构 | `docs/core/SERVICE_ARCHITECTURE.md` | 27 个服务 |
| 业务逻辑 | `docs/core/BUSINESS_LOGIC.md` | 核心算法 |
| 组件库 | `docs/core/components.md` | UI 组件 |
| 工具库 | `docs/core/LIB_UTILITIES.md` | Lib 函数 |

**最近变更日志：**
- 查阅 `docs/changelogs/` 最新记录

> ⚠️ **不得在未读取上下文的情况下编码**

---

### ✔ STEP 2：理解现有代码

在修改任何文件前，必须：

1. **阅读相关文件** - 使用 Read 工具查看现有实现
2. **理解数据流** - 追踪从 API → Service → Database 的完整路径
3. **检查依赖关系** - 确认修改不会破坏其他模块
4. **查看测试文件** - 了解现有测试覆盖

---

### ✔ STEP 3：生成开发计划

在编写代码前，必须输出：

```markdown
## Development Plan

### 目标
[简述要实现的功能]

### 影响范围
- 修改文件：[列出所有要修改的文件]
- 新增文件：[列出所有新增的文件]
- 数据库变更：[如有]
- API 变更：[如有]

### 技术方案
[简述实现思路]

### 风险评估
[可能的风险和缓解措施]
```

---

## 📌 3. 代码质量标准（CODE QUALITY STANDARDS）

### 3.1 技术栈规范

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 14.x |
| 语言 | TypeScript | 5.3+ |
| 数据库 | PostgreSQL + Prisma | 15 / 6.19 |
| 认证 | NextAuth.js | v5 |
| 样式 | Tailwind CSS | 3.4 |
| 测试 | Vitest | latest |

---

### 3.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件 (组件) | PascalCase | `OrderCard.tsx` |
| 文件 (工具) | camelCase | `formatDate.ts` |
| 文件 (API) | kebab-case 文件夹 | `api/orders/[id]/route.ts` |
| 变量 | camelCase | `orderTotal` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 类型/接口 | PascalCase | `OrderStatus` |
| React 组件 | PascalCase | `OrderTimeline` |
| 数据库表 | snake_case | `order_items` |
| API 响应字段 | camelCase | `createdAt` |

---

### 3.3 文件组织规范

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── admin/             # 管理端页面
│   └── (user)/            # 用户端页面
├── components/            # 复用组件
│   ├── admin/            # 管理端组件
│   └── payment/          # 支付组件
├── features/              # 功能模块
│   ├── booking/          # 预订流程
│   ├── profile/          # 用户资料
│   └── ...
├── services/              # 业务服务层
├── lib/                   # 工具函数
├── types/                 # TypeScript 类型
└── __tests__/             # 测试文件
```

---

### 3.4 代码风格规范

#### TypeScript 规范

```typescript
// ✅ 正确：使用明确类型
async function getOrder(orderId: string): Promise<Order | null> {
  return prisma.order.findUnique({ where: { id: orderId } });
}

// ❌ 错误：使用 any
async function getOrder(orderId: any): Promise<any> {
  return prisma.order.findUnique({ where: { id: orderId } });
}
```

#### React 组件规范

```tsx
// ✅ 正确：函数组件 + 类型定义
interface OrderCardProps {
  order: Order;
  onSelect?: (id: string) => void;
}

export function OrderCard({ order, onSelect }: OrderCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      {/* 组件内容 */}
    </div>
  );
}

// ❌ 错误：无类型、class 组件
export default class OrderCard extends React.Component {
  render() { return <div>...</div> }
}
```

#### API 路由规范

```typescript
// ✅ 正确：标准 API 结构
import { requireAuth } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const data = await getOrdersForUser(user.id);
    return successResponse(data);
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error('Unexpected error:', error);
    return errorResponse('SYSTEM_ERROR', 'An unexpected error occurred', 500);
  }
}
```

---

### 3.5 注释规范

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
  const basePoints = Math.floor(orderAmount);
  const multiplier = getPointsMultiplier(membershipTier);
  return Math.floor(basePoints * multiplier);
}

// NOTE: 此函数仅在订单完成时调用，不处理退款场景
```

**注释规则：**
- 使用 `NOTE:` 代替 `TODO:` 和 `FIXME:`
- 复杂业务逻辑必须有注释说明
- 使用 JSDoc 风格注释函数

---

### 3.6 错误处理规范

```typescript
// ✅ 正确：使用 AppError
import { AppError } from '@/lib/api-errors';

if (!order) {
  throw new AppError('ORDER_NOT_FOUND', 'Order does not exist', 404);
}

if (order.status !== 'pending') {
  throw new AppError('ORDER_CANNOT_CANCEL', 'Cannot cancel order in current status', 400);
}

// ❌ 错误：直接抛出 Error
throw new Error('Order not found');
```

**错误码必须在 `docs/ERROR_CODES.md` 中定义**

---

### 3.7 日志规范

```typescript
// ✅ 正确：使用 console.info
console.info('[OrderService] Order created:', { orderId, userId });

// ❌ 错误：使用 console.log（生产环境）
console.log('order created');
```

---

## 📌 4. 安全规范（SECURITY STANDARDS）

### 4.1 认证检查

```typescript
// 所有需要认证的 API 必须调用
const user = await requireAuth();

// 管理员 API 必须调用
const admin = await requireAdmin();
```

### 4.2 输入验证

```typescript
import { z } from 'zod';
import { validateInput } from '@/lib/validation';

const createOrderSchema = z.object({
  stringId: z.string().cuid(),
  tension: z.number().min(15).max(35),
  notes: z.string().max(500).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const data = validateInput(createOrderSchema, body);
  // 使用验证后的 data
}
```

### 4.3 禁止事项

- ❌ 在代码中硬编码密钥或密码
- ❌ 在响应中返回敏感信息（密码哈希等）
- ❌ 直接拼接 SQL 查询（使用 Prisma）
- ❌ 跳过权限检查
- ❌ 信任客户端输入

---

## 📌 5. 测试规范（TESTING STANDARDS）

### 5.1 测试要求

| 类型 | 要求 | 工具 |
|------|------|------|
| 单元测试 | 新业务逻辑必须有测试 | Vitest |
| 组件测试 | 关键组件必须有测试 | React Testing Library |
| 集成测试 | API 路由建议有测试 | Vitest |

### 5.2 测试命名

```typescript
// 文件命名：与被测试文件同名 + .test
// orderService.ts → orderService.test.ts

describe('orderService', () => {
  describe('calculateOrderPrice', () => {
    it('should apply percentage voucher correctly', () => {
      // Arrange
      const items = [{ price: 100 }];
      const voucher = { type: 'percentage', value: 10 };

      // Act
      const result = calculateOrderPrice(items, voucher);

      // Assert
      expect(result.discount).toBe(10);
      expect(result.finalPrice).toBe(90);
    });

    it('should not allow discount to exceed order total', () => {
      // ...
    });
  });
});
```

### 5.3 运行测试

```bash
# 开发时运行
npm test

# 提交前运行
npm run test:run

# 查看覆盖率
npm run test:coverage
```

---

## 📌 6. 开发完成后必须执行的步骤（MANDATORY POST-WORK）

### ✔ STEP 1：代码验证

```bash
# 类型检查
npm run type-check

# Lint 检查
npm run lint

# 测试
npm run test:run

# 构建验证
npm run build
```

**所有检查必须通过后才能完成开发**

---

### ✔ STEP 2：生成变更日志

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
| `src/...` | Modified | [描述] |

## API Changes
- [如有 API 变更]

## Database Changes
- [如有数据库变更]

## Testing
- [ ] 单元测试通过
- [ ] 类型检查通过
- [ ] 构建成功

## Notes
- [其他说明]
```

---

### ✔ STEP 3：更新相关文档

根据变更类型，更新对应文档：

| 变更类型 | 需要更新的文档 |
|----------|----------------|
| 新增 API | `docs/core/api_spec.md` |
| 新增模型 | `docs/core/erd.md` |
| 新增服务 | `docs/core/SERVICE_ARCHITECTURE.md` |
| 新增组件 | `docs/core/components.md` |
| 新增工具 | `docs/core/LIB_UTILITIES.md` |
| 业务逻辑 | `docs/core/BUSINESS_LOGIC.md` |
| 环境变量 | `docs/guides/ENVIRONMENT_SETUP.md` |

---

## 📌 7. 视觉设计规范（UI/UX STANDARDS）

### 7.1 设计系统

项目采用 **Paper Court (呼吸感设计)**：

| 元素 | 样式 |
|------|------|
| 页面背景 | `bg-gray-50` |
| 卡片背景 | `bg-white` |
| 卡片边框 | `border border-gray-100` |
| 卡片阴影 | `shadow-sm` |
| 圆角 | `rounded-xl` |
| 主色调 | `accent` (深青色 #0F766E) |

### 7.2 间距规范

| 元素 | 间距 |
|------|------|
| 页面内边距 | `px-4` / `px-5` |
| 区块间距 | `space-y-6` / `space-y-8` |
| 卡片内边距 | `p-4` / `p-5` / `p-6` |
| 内容宽度 | `max-w-xl` / `max-w-2xl` |

### 7.3 组件复用

**必须复用现有组件：**

```tsx
// ✅ 正确：使用现有组件
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';

// ❌ 错误：创建重复组件
const MyCustomButton = () => <button className="...">...</button>;
```

---

## 📌 8. 禁止事项（PROHIBITED BEHAVIORS）

### 绝对禁止 ❌

1. **不读取上下文就编码** - 必须先了解现有代码
2. **随意创建 API** - 必须符合 api_spec.md 规范
3. **修改数据库不更新 ERD** - 必须同步文档
4. **不写变更日志** - 每次开发都必须记录
5. **输出不完整代码** - 代码必须可直接运行
6. **使用 `any` 类型** - 必须使用明确类型
7. **使用 `console.log`** - 使用 `console.info`
8. **使用 `TODO/FIXME`** - 使用 `NOTE`
9. **跳过验证步骤** - 必须通过所有检查
10. **破坏现有功能** - 必须保持向后兼容

---

## 📌 9. 质量检查清单（QUALITY CHECKLIST）

每次开发完成前，确认以下事项：

### 代码质量
- [ ] 类型检查通过 (`npm run type-check`)
- [ ] Lint 检查通过 (`npm run lint`)
- [ ] 测试通过 (`npm run test:run`)
- [ ] 构建成功 (`npm run build`)

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
- [ ] API 变更更新 api_spec.md
- [ ] 数据库变更更新 erd.md

---

## 📌 10. 核心原则总结

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

## 📌 11. 快速参考

### 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run type-check   # TypeScript 类型检查
npm run lint         # ESLint 检查
npm run test         # 运行测试（watch 模式）
npm run test:run     # 运行测试（单次）
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
import { validateInput } from '@/lib/validation';
```

### 文档索引

| 需要了解 | 查看文档 |
|----------|----------|
| 项目概述 | `README.md` |
| API 列表 | `docs/core/api_spec.md` |
| 数据模型 | `docs/core/erd.md` |
| 组件库 | `docs/core/components.md` |
| 业务逻辑 | `docs/core/BUSINESS_LOGIC.md` |
| 错误码 | `docs/ERROR_CODES.md` |
| 测试指南 | `docs/guides/TESTING_GUIDE.md` |
| 故障排除 | `docs/guides/TROUBLESHOOTING.md` |

---

> **本文档最后更新：2026-01-27**
> **版本：2.0**
