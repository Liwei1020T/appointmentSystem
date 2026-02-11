import { describe, expect, it } from 'vitest';
import { sortPackagesByPriority, type UserPackageWithPackage } from '@/services/packageService';
import type { Package } from '.prisma/client';

const basePackage = {
  id: 'pkg-base',
  name: 'Base Package',
  description: null,
  times: 10,
  price: 100,
  originalPrice: 120,
  validityDays: 30,
  active: true,
  imageUrl: null,
  isFirstOrderOnly: false,
  isPopular: false,
  tag: null,
  renewalDiscount: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
} as unknown as Package;

function makeUserPackage(
  id: string,
  overrides: Partial<UserPackageWithPackage> = {}
): UserPackageWithPackage {
  return {
    id,
    status: 'active',
    remaining: 5,
    package: basePackage,
    userId: 'user-1',
    packageId: basePackage.id,
    originalTimes: 10,
    expiry: new Date('2026-12-31T00:00:00.000Z'),
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('sortPackagesByPriority', () => {
  it('sorts by remaining usage ascending', () => {
    const highRemaining = makeUserPackage('high', { remaining: 5 });
    const lowRemaining = makeUserPackage('low', { remaining: 2 });

    const sorted = sortPackagesByPriority([highRemaining, lowRemaining]);

    expect(sorted.map((pkg) => pkg.id)).toEqual(['low', 'high']);
  });

  it('prefers legacy remaining aliases when present', () => {
    const normal = makeUserPackage('normal', { remaining: 4 });
    const legacy = makeUserPackage('legacy', { remaining: 99, remaining_uses: 1 });

    const sorted = sortPackagesByPriority([normal, legacy]);

    expect(sorted[0].id).toBe('legacy');
  });

  it('breaks ties by earliest expiry date', () => {
    const later = makeUserPackage('later', {
      remaining: 3,
      expiresAt: '2026-06-10T00:00:00.000Z',
    });
    const earlier = makeUserPackage('earlier', {
      remaining: 3,
      expires_at: '2026-03-01T00:00:00.000Z',
    });

    const sorted = sortPackagesByPriority([later, earlier]);

    expect(sorted.map((pkg) => pkg.id)).toEqual(['earlier', 'later']);
  });
});
