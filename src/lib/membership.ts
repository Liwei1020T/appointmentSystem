export type MembershipTierId = 'standard' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface MembershipTierDefinition {
  id: MembershipTierId;
  label: string;
  description: string;
  minSpend: number; // RM threshold
  discountRate: number; // percentage (e.g., 5 means 5%)
}

/**
 * Membership tiers sorted by ascending spend requirement.
 */
export const membershipTiers: MembershipTierDefinition[] = [
  {
    id: 'standard',
    label: '普通会员',
    description: '尚未达到会员门槛，继续消费即可升级',
    minSpend: 0,
    discountRate: 0,
  },
  {
    id: 'bronze',
    label: '青铜会员',
    description: '消费满 RM 300，解锁 5% 折扣',
    minSpend: 300,
    discountRate: 5,
  },
  {
    id: 'silver',
    label: '白银会员',
    description: '消费满 RM 500，解锁 8% 折扣',
    minSpend: 500,
    discountRate: 8,
  },
  {
    id: 'gold',
    label: '黄金会员',
    description: '消费满 RM 700，解锁 10% 折扣',
    minSpend: 700,
    discountRate: 10,
  },
  {
    id: 'platinum',
    label: '白金会员',
    description: '消费满 RM 1000，解锁 12% 折扣',
    minSpend: 1000,
    discountRate: 12,
  },
];

export const membershipTierIds: MembershipTierId[] = membershipTiers.map((tier) => tier.id);

/**
 * Returns the tier definition that matches the given threshold.
 */
export function getTierDefinitionById(id: string | null | undefined): MembershipTierDefinition | undefined {
  return membershipTiers.find((tier) => tier.id === id);
}

/**
 * Find the membership tier that matches a user's total spend.
 */
export function getTierForSpend(totalSpent: number): MembershipTierDefinition {
  const safeSpend = Math.max(0, totalSpent);
  let matched = membershipTiers[0];
  for (const tier of membershipTiers) {
    if (safeSpend >= tier.minSpend) {
      matched = tier;
    } else {
      break;
    }
  }
  return matched;
}

/**
 * Returns the next tier definition above the current spend (if any).
 */
export function getNextTierAfterSpend(totalSpent: number): MembershipTierDefinition | null {
  const safeSpend = Math.max(0, totalSpent);
  for (const tier of membershipTiers) {
    if (tier.minSpend > safeSpend) {
      return tier;
    }
  }
  return null;
}

/**
 * Returns progress (0-1) toward the next tier.
 */
export function getTierProgress(totalSpent: number): number {
  const safeSpend = Math.max(0, totalSpent);
  const current = getTierForSpend(safeSpend);
  const next = getNextTierAfterSpend(safeSpend);

  if (!next) {
    return 1;
  }

  const range = next.minSpend - current.minSpend;
  if (range === 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, (safeSpend - current.minSpend) / range));
}
