# Development Templates

**String Service Platform — 开发模板集**
**版本：1.0**
**最后更新：2026-01-27**

---

## 用途

此文档提供常见开发场景的标准模板，确保代码一致性。

---

## 1. API 路由模板

### GET 路由（需要认证）

```typescript
// src/app/api/example/route.ts
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { AppError } from '@/lib/api-errors';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const data = await prisma.example.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(data);
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error('[ExampleAPI] GET error:', error);
    return errorResponse('SYSTEM_ERROR', 'An unexpected error occurred', 500);
  }
}
```

### POST 路由（带验证）

```typescript
// src/app/api/example/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { AppError } from '@/lib/api-errors';
import { prisma } from '@/lib/prisma';

const createExampleSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.number().positive(),
  optional: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // 验证输入
    const parseResult = createExampleSchema.safeParse(body);
    if (!parseResult.success) {
      throw new AppError('VALIDATION_FAILED', parseResult.error.message, 400);
    }

    const { name, value, optional } = parseResult.data;

    // 业务逻辑
    const result = await prisma.example.create({
      data: {
        userId: user.id,
        name,
        value,
        optional
      }
    });

    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error('[ExampleAPI] POST error:', error);
    return errorResponse('SYSTEM_ERROR', 'An unexpected error occurred', 500);
  }
}
```

### 管理员路由

```typescript
// src/app/api/admin/example/route.ts
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { AppError } from '@/lib/api-errors';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    // 管理员逻辑
    const data = await getAdminData();

    return successResponse(data);
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error('[AdminExampleAPI] error:', error);
    return errorResponse('SYSTEM_ERROR', 'An unexpected error occurred', 500);
  }
}
```

---

## 2. 服务层模板

```typescript
// src/services/exampleService.ts
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/api-errors';

// 类型定义
interface CreateExampleInput {
  name: string;
  value: number;
  userId: string;
}

interface ExampleWithRelations {
  id: string;
  name: string;
  value: number;
  user: {
    id: string;
    fullName: string;
  };
}

/**
 * 获取用户的所有 Example
 * @param userId - 用户 ID
 * @returns Example 列表
 */
export async function getExamplesForUser(userId: string): Promise<ExampleWithRelations[]> {
  return prisma.example.findMany({
    where: { userId },
    include: {
      user: {
        select: { id: true, fullName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * 根据 ID 获取 Example
 * @param id - Example ID
 * @throws AppError 如果不存在
 */
export async function getExampleById(id: string): Promise<ExampleWithRelations> {
  const example = await prisma.example.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, fullName: true }
      }
    }
  });

  if (!example) {
    throw new AppError('EXAMPLE_NOT_FOUND', 'Example does not exist', 404);
  }

  return example;
}

/**
 * 创建新的 Example
 * @param input - 创建参数
 * @returns 创建的 Example
 */
export async function createExample(input: CreateExampleInput): Promise<ExampleWithRelations> {
  // 业务验证
  if (input.value < 0) {
    throw new AppError('VALIDATION_FAILED', 'Value must be positive', 400);
  }

  return prisma.example.create({
    data: {
      name: input.name,
      value: input.value,
      userId: input.userId
    },
    include: {
      user: {
        select: { id: true, fullName: true }
      }
    }
  });
}

/**
 * 删除 Example（带权限检查）
 * @param id - Example ID
 * @param userId - 当前用户 ID
 */
export async function deleteExample(id: string, userId: string): Promise<void> {
  const example = await prisma.example.findUnique({
    where: { id }
  });

  if (!example) {
    throw new AppError('EXAMPLE_NOT_FOUND', 'Example does not exist', 404);
  }

  if (example.userId !== userId) {
    throw new AppError('FORBIDDEN_OWNER_ONLY', 'You can only delete your own examples', 403);
  }

  await prisma.example.delete({ where: { id } });
}
```

---

## 3. React 组件模板

### 基础组件

```tsx
// src/components/ExampleCard.tsx
'use client';

import { cn } from '@/lib/utils';

interface ExampleCardProps {
  title: string;
  description?: string;
  value: number;
  onClick?: () => void;
  className?: string;
}

export function ExampleCard({
  title,
  description,
  value,
  onClick,
  className
}: ExampleCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-sm p-4',
        'hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <h3 className="text-[15px] font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
      <div className="mt-3 text-lg font-semibold text-accent font-mono">
        RM {value.toFixed(2)}
      </div>
    </div>
  );
}
```

### 带状态的组件

```tsx
// src/components/ExampleList.tsx
'use client';

import { useState, useEffect } from 'react';
import { ExampleCard } from './ExampleCard';
import { Spinner } from './Spinner';

interface Example {
  id: string;
  title: string;
  value: number;
}

interface ExampleListProps {
  userId: string;
  onSelect?: (id: string) => void;
}

export function ExampleList({ userId, onSelect }: ExampleListProps) {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExamples() {
      try {
        setLoading(true);
        const response = await fetch(`/api/examples?userId=${userId}`);
        const data = await response.json();

        if (!data.ok) {
          throw new Error(data.error?.message || 'Failed to fetch');
        }

        setExamples(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchExamples();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: {error}
      </div>
    );
  }

  if (examples.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No examples found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {examples.map((example) => (
        <ExampleCard
          key={example.id}
          title={example.title}
          value={example.value}
          onClick={() => onSelect?.(example.id)}
        />
      ))}
    </div>
  );
}
```

---

## 4. 测试模板

### 单元测试

```typescript
// src/__tests__/exampleService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateExample, validateExample } from '@/services/exampleService';

describe('exampleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateExample', () => {
    it('should calculate correctly with valid input', () => {
      // Arrange
      const input = { value: 100, multiplier: 1.5 };

      // Act
      const result = calculateExample(input);

      // Assert
      expect(result).toBe(150);
    });

    it('should return 0 for zero value', () => {
      const result = calculateExample({ value: 0, multiplier: 2 });
      expect(result).toBe(0);
    });

    it('should throw error for negative value', () => {
      expect(() => {
        calculateExample({ value: -10, multiplier: 1 });
      }).toThrow('Value must be positive');
    });
  });

  describe('validateExample', () => {
    it('should return true for valid example', () => {
      const example = { name: 'Test', value: 100 };
      expect(validateExample(example)).toBe(true);
    });

    it('should return false for empty name', () => {
      const example = { name: '', value: 100 };
      expect(validateExample(example)).toBe(false);
    });
  });
});
```

### 组件测试

```typescript
// src/__tests__/ExampleCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExampleCard } from '@/components/ExampleCard';

describe('ExampleCard', () => {
  it('should render title and value', () => {
    render(
      <ExampleCard title="Test Title" value={100} />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('RM 100.00')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <ExampleCard
        title="Test"
        value={50}
        description="Test description"
      />
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();

    render(
      <ExampleCard
        title="Test"
        value={50}
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText('Test'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 5. 变更日志模板

```markdown
# Change Log — YYYY-MM-DD

## Summary

[一句话描述此次变更的主要内容]

## Changes

### Added
- 新增 `ExampleCard` 组件，用于显示示例数据
- 新增 `GET /api/examples` 端点，获取用户的示例列表
- 新增 `exampleService` 服务，封装示例相关业务逻辑

### Modified
- 更新 `OrderCard` 组件，添加新的 `highlighted` 属性
- 优化 `pointsService` 积分计算逻辑，支持会员倍率

### Fixed
- 修复订单取消后优惠券未恢复的问题
- 修复管理端用户列表分页不正确的问题

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/components/ExampleCard.tsx` | Added | 新增示例卡片组件 |
| `src/app/api/examples/route.ts` | Added | 新增示例 API |
| `src/services/exampleService.ts` | Added | 新增示例服务 |
| `src/__tests__/ExampleCard.test.tsx` | Added | 新增组件测试 |
| `src/components/OrderCard.tsx` | Modified | 添加 highlighted 属性 |

## API Changes

### Added
- `GET /api/examples` - 获取用户示例列表
  - Auth: Required
  - Response: `{ ok: true, data: Example[] }`

## Database Changes

无

## Testing

- [x] 单元测试通过
- [x] 类型检查通过
- [x] Lint 检查通过
- [x] 构建成功

## Documentation Updated

- [x] `docs/core/api_spec.md` - 添加新 API 文档
- [x] `docs/core/components.md` - 添加新组件说明

## Notes

- 此功能为阶段一实现，后续将添加分页支持
- 考虑添加缓存优化查询性能
```

---

## 6. Prisma Schema 模板

```prisma
// 添加到 prisma/schema.prisma

model Example {
  id          String    @id @default(cuid())
  name        String
  description String?
  value       Float
  status      String    @default("active")
  userId      String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
  @@map("examples")
}
```

**添加模型后：**
1. 运行 `npm run db:push` 同步 schema
2. 运行 `npx prisma generate` 生成类型
3. 更新 `docs/core/erd.md` 添加模型说明

---

## 7. 错误码定义模板

添加到 `docs/ERROR_CODES.md`：

```markdown
## Example Errors (EXAMPLE_*)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `EXAMPLE_NOT_FOUND` | 404 | Example does not exist | Check example ID |
| `EXAMPLE_ALREADY_EXISTS` | 409 | Example with same name exists | Use different name |
| `EXAMPLE_INVALID_VALUE` | 400 | Value is invalid | Check value range |
```

---

**使用这些模板可以确保代码一致性和高质量。**
