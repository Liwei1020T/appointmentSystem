export type MembershipTierId = 'SILVER' | 'GOLD' | 'VIP';

export interface MembershipTierDefinition {
  id: MembershipTierId;
  label: string;
  description: string;
  minSpend: number; // RM threshold
  discountRate: number; // percentage (e.g., 5 means 5%)
}

export function getTierLabel(tier: string) {
  const labels: Record<string, string> = {
    SILVER: 'Silver',
    GOLD: 'Gold',
    VIP: 'VIP',
  };
  return labels[tier] || labels.SILVER;
}

/**
 * Membership tiers sorted by ascending spend requirement.
 */
export const membershipTiers: MembershipTierDefinition[] = [
  {
    id: 'SILVER',
    label: getTierLabel('SILVER'),
    description: '基础会员',
    minSpend: 0,
    discountRate: 0,
  },
  {
    id: 'GOLD',
    label: getTierLabel('GOLD'),
    description: '累计消费 RM 200 或 5 单升级',
    minSpend: 200,
    discountRate: 0,
  },
  {
    id: 'VIP',
    label: getTierLabel('VIP'),
    description: '累计消费 RM 500 或 12 单升级',
    minSpend: 500,
    discountRate: 5,
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

export function getNextTierAfterCurrent(currentTierId: MembershipTierId): MembershipTierDefinition | null {
  const currentIndex = membershipTiers.findIndex((tier) => tier.id === currentTierId);
  if (currentIndex < 0 || currentIndex >= membershipTiers.length - 1) {
    return null;
  }
  return membershipTiers[currentIndex + 1];
}

/**
 * Returns progress (0-1) toward the next tier.
 */
export function getTierProgress(totalSpent: number, currentTierId?: MembershipTierId): number {
  const safeSpend = Math.max(0, totalSpent);
  const current = currentTierId
    ? getTierDefinitionById(currentTierId) || membershipTiers[0]
    : getTierForSpend(safeSpend);
  const next = currentTierId
    ? getNextTierAfterCurrent(current.id)
    : getNextTierAfterSpend(safeSpend);

  if (!next) {
    return 1;
  }

  const range = next.minSpend - current.minSpend;
  if (range === 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, (safeSpend - current.minSpend) / range));
}
