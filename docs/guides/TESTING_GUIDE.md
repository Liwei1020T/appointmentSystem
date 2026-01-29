# Testing Guide

**String Service Platform — Testing Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

This project uses **Vitest** for testing, with **React Testing Library** for component tests.

## Quick Start

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/orderService.test.ts
```

---

## Test Structure

```
src/
├── __tests__/                    # Test files
│   ├── *.test.ts                 # Unit tests
│   ├── *.test.tsx                # Component tests
│   └── integration/              # Integration tests (future)
├── components/                   # Components to test
├── services/                     # Services to test
└── lib/                          # Utilities to test
```

---

## Writing Tests

### Unit Tests

```typescript
// src/__tests__/voucherService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { calculateDiscount } from '@/services/voucherService';

describe('voucherService', () => {
  describe('calculateDiscount', () => {
    it('should apply percentage discount correctly', () => {
      const result = calculateDiscount(100, { type: 'percentage', value: 10 });
      expect(result).toBe(10);
    });

    it('should apply fixed discount correctly', () => {
      const result = calculateDiscount(100, { type: 'fixed', value: 15 });
      expect(result).toBe(15);
    });

    it('should not exceed order total', () => {
      const result = calculateDiscount(10, { type: 'fixed', value: 15 });
      expect(result).toBe(10);
    });
  });
});
```

### Component Tests

```typescript
// src/__tests__/OrderCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderCard from '@/components/OrderCard';

describe('OrderCard', () => {
  const mockOrder = {
    id: '123',
    status: 'pending',
    totalAmount: 50,
    createdAt: new Date().toISOString(),
  };

  it('should render order ID', () => {
    render(<OrderCard order={mockOrder} />);
    expect(screen.getByText(/123/)).toBeInTheDocument();
  });

  it('should display correct status badge', () => {
    render(<OrderCard order={mockOrder} />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });
});
```

### API Route Tests

```typescript
// src/__tests__/api/orders.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/orders/route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('GET /api/orders', () => {
  it('should return orders for authenticated user', async () => {
    const request = new Request('http://localhost/api/orders');
    const response = await GET(request);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

---

## Mocking

### Mocking Prisma

```typescript
import { vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// In test
import { prisma } from '@/lib/prisma';

it('should find user by ID', async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: '123',
    email: 'test@example.com',
  });

  const user = await getUser('123');
  expect(user.email).toBe('test@example.com');
});
```

### Mocking NextAuth

```typescript
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'user-123', role: 'admin' },
  }),
}));
```

### Mocking External Services

```typescript
// Mock SMS service
vi.mock('@/lib/sms', () => ({
  sendSms: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock file upload
vi.mock('@/lib/upload', () => ({
  uploadFile: vi.fn().mockResolvedValue('/uploads/test.jpg'),
}));
```

---

## Test Categories

### 1. Business Logic Tests

Test core business rules:

```typescript
// src/__tests__/membershipTiers.test.ts
describe('Membership Tiers', () => {
  it('should upgrade to Bronze at RM500 spent', () => {
    expect(calculateTier(500)).toBe('bronze');
  });

  it('should upgrade to Silver at RM1500 spent', () => {
    expect(calculateTier(1500)).toBe('silver');
  });
});
```

### 2. Order Flow Tests

```typescript
// src/__tests__/orderAutomation.test.ts
describe('Order Automation', () => {
  it('should auto-cancel orders after timeout', async () => {
    // Test order cancellation logic
  });

  it('should restore vouchers on cancellation', async () => {
    // Test voucher restoration
  });
});
```

### 3. Points System Tests

```typescript
// src/__tests__/pointsCalculation.test.ts
describe('Points Calculation', () => {
  it('should award 1 point per RM spent', () => {
    expect(calculatePoints(100)).toBe(100);
  });

  it('should apply tier bonus multiplier', () => {
    expect(calculatePoints(100, 'gold')).toBe(150); // 1.5x
  });
});
```

---

## Running Specific Tests

```bash
# Run single file
npm test -- src/__tests__/orderService.test.ts

# Run tests matching pattern
npm test -- --grep "voucher"

# Run tests in specific directory
npm test -- src/__tests__/

# Run with verbose output
npm test -- --reporter=verbose
```

---

## Coverage Requirements

**Target Coverage:** 80%

| Category | Current | Target |
|----------|---------|--------|
| Statements | TBD | 80% |
| Branches | TBD | 75% |
| Functions | TBD | 80% |
| Lines | TBD | 80% |

### Generating Coverage Report

```bash
npm run test:coverage
```

Coverage report is generated in `coverage/` directory.

---

## Best Practices

### 1. Test Naming

```typescript
// Good: Descriptive and specific
it('should return 401 when user is not authenticated')
it('should apply 10% discount for voucher type percentage')

// Bad: Vague
it('works correctly')
it('test discount')
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should calculate order total correctly', () => {
  // Arrange
  const items = [
    { price: 30, quantity: 2 },
    { price: 20, quantity: 1 },
  ];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(80);
});
```

### 3. Test Isolation

Each test should be independent. Use `beforeEach` to reset state:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 4. Avoid Testing Implementation Details

```typescript
// Bad: Testing internal state
expect(component.state.isLoading).toBe(false);

// Good: Testing behavior
expect(screen.getByText('Submit')).not.toBeDisabled();
```

---

## Existing Test Files

| File | Description |
|------|-------------|
| `OrderTimeline.test.tsx` | Order timeline component |
| `PackageCard.test.tsx` | Package card display |
| `firstOrderVoucherOrderGuard.test.ts` | Voucher validation |
| `orderAutomation.test.ts` | Order auto-cancellation |
| `orderEta.test.ts` | ETA calculation |
| `promotionStats.test.ts` | Promotion analytics |
| `reviewShare.test.ts` | Review sharing |
| `membershipTiers.test.ts` | Tier calculations |
| `voucherValidityDaysParsing.test.ts` | Voucher parsing |

---

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm run test:run

- name: Check Coverage
  run: npm run test:coverage
```

---

## Troubleshooting

### Tests Timing Out

```typescript
// Increase timeout for slow tests
it('should complete long operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Mock Not Working

```typescript
// Ensure mock is defined before import
vi.mock('@/lib/prisma');

// Then import
import { prisma } from '@/lib/prisma';
```

### React Testing Library Issues

```typescript
// Wait for async updates
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

---

**End of Testing Guide**
