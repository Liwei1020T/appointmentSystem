import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PackageCard from '@/components/PackageCard';
import type { Package } from '@/services/packageService';

describe('PackageCard', () => {
  it('shows first-order badge when package is first-order-only', () => {
    const pkg: Package = {
      id: 'pkg-1',
      name: '体验套餐',
      description: null,
      times: 1,
      price: 18 as unknown as Package['price'],
      originalPrice: null,
      validityDays: 30,
      active: true,
      imageUrl: null,
      tag: null,
      isPopular: false,
      isFirstOrderOnly: true,
      renewalDiscount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<PackageCard package={pkg} onPurchase={vi.fn()} />);

    expect(screen.getByText('首单特价')).toBeInTheDocument();
  });
});
