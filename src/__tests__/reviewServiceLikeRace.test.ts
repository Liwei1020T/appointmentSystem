import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { toggleReviewLike } from '@/server/services/review.service';

type MockFn = ReturnType<typeof vi.fn>;

function setupTransactionMock(tx: {
  review: {
    findUnique: MockFn;
    update: MockFn;
    updateMany: MockFn;
  };
  reviewLike: {
    deleteMany: MockFn;
    create: MockFn;
  };
}) {
  (prisma.$transaction as MockFn).mockImplementation(async (callback: (ctx: typeof tx) => Promise<unknown>) =>
    callback(tx)
  );
}

describe('toggleReviewLike race handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes existing like and decrements safely', async () => {
    const tx = {
      review: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: 'review-1', likesCount: 2 })
          .mockResolvedValueOnce({ id: 'review-1', likesCount: 1 }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      reviewLike: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn(),
      },
    };
    setupTransactionMock(tx);

    const result = await toggleReviewLike('user-1', '11111111-1111-4111-8111-111111111111');

    expect(result).toEqual({ liked: false, likesCount: 1 });
    expect(tx.reviewLike.create).not.toHaveBeenCalled();
  });

  it('creates like and increments count when not yet liked', async () => {
    const tx = {
      review: {
        findUnique: vi.fn().mockResolvedValueOnce({ id: 'review-1', likesCount: 2 }),
        update: vi.fn().mockResolvedValue({ likesCount: 3 }),
        updateMany: vi.fn(),
      },
      reviewLike: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 'like-1' }),
      },
    };
    setupTransactionMock(tx);

    const result = await toggleReviewLike('user-1', '11111111-1111-4111-8111-111111111111');

    expect(result).toEqual({ liked: true, likesCount: 3 });
  });

  it('handles unique constraint race gracefully', async () => {
    const tx = {
      review: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: 'review-1', likesCount: 2 })
          .mockResolvedValueOnce({ id: 'review-1', likesCount: 3 }),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      reviewLike: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockRejectedValue({ code: 'P2002' }),
      },
    };
    setupTransactionMock(tx);

    const result = await toggleReviewLike('user-1', '11111111-1111-4111-8111-111111111111');

    expect(result).toEqual({ liked: true, likesCount: 3 });
  });
});
