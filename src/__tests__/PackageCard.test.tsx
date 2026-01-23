import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PackageCard from '@/components/PackageCard';

describe('PackageCard', () => {
  it('shows first-order badge when package is first-order-only', () => {
    render(
      <PackageCard
        package={{
          id: 'pkg-1',
          name: '体验套餐',
          price: 18,
          times: 1,
          validityDays: 30,
          active: true,
          isFirstOrderOnly: true,
        } as any}
        onPurchase={vi.fn()}
      />
    );

    expect(screen.getByText('首单特价')).toBeInTheDocument();
  });
});
