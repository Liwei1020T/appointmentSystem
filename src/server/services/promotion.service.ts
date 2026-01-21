/**
 * 营销活动服务
 * 处理促销活动、折扣计算和使用记录
 */

import { prisma } from '@/lib/prisma';
import { Promotion, PromotionType, DiscountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface OrderItemForDiscount {
  price: number;
  quantity: number;
}

/**
 * 获取当前有效的促销活动
 */
export async function getActivePromotions(): Promise<Promotion[]> {
  const now = new Date();

  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      startAt: { lte: now },
      endAt: { gte: now },
    },
  });

  // 过滤掉已达到使用限制的活动
  return promotions.filter((promo) => {
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return false;
    }
    return true;
  });
}

/**
 * 计算订单最优折扣
 * @param orderTotal 订单总金额
 * @param promotions 有效促销活动列表
 */
export function calculateBestDiscount(
  orderTotal: number,
  promotions: Promotion[]
): {
  discountAmount: number;
  promotionId: string | null;
  promotionName: string | null;
} {
  let bestDiscount = 0;
  let bestPromo: Promotion | null = null;

  for (const promo of promotions) {
    // 检查最低消费门槛
    if (promo.minPurchase && orderTotal < Number(promo.minPurchase)) {
      continue;
    }

    let currentDiscount = 0;

    // 根据不同类型计算折扣
    switch (promo.type) {
      case 'FLASH_SALE':
      case 'SPEND_SAVE':
        if (promo.discountType === 'FIXED') {
          currentDiscount = Number(promo.discountValue);
        } else if (promo.discountType === 'PERCENTAGE') {
          currentDiscount = (orderTotal * Number(promo.discountValue)) / 100;
        }
        break;

      // POINTS_BOOST 不直接减少订单金额，而是在积分计算时处理
      // 这里可以扩展返回 pointsMultiplier
      case 'POINTS_BOOST':
        continue;
    }

    // 确保折扣不超过订单总额
    currentDiscount = Math.min(currentDiscount, orderTotal);

    if (currentDiscount > bestDiscount) {
      bestDiscount = currentDiscount;
      bestPromo = promo;
    }
  }

  return {
    discountAmount: bestDiscount,
    promotionId: bestPromo?.id || null,
    promotionName: bestPromo?.name || null,
  };
}

/**
 * 记录促销活动使用情况
 */
export async function recordPromotionUsage(
  promotionId: string,
  userId: string,
  orderId: string,
  savedAmount: number
) {
  return prisma.$transaction(async (tx) => {
    // 创建使用记录
    await tx.promotionUsage.create({
      data: {
        promotionId,
        userId,
        orderId,
        savedAmount: new Decimal(savedAmount),
      },
    });

    // 增加活动使用计数
    await tx.promotion.update({
      where: { id: promotionId },
      data: {
        usageCount: { increment: 1 },
      },
    });
  });
}

/**
 * 获取特定类型的活动（如积分翻倍）
 */
export async function getActivePromotionByType(type: PromotionType): Promise<Promotion | null> {
  const now = new Date();

  const promo = await prisma.promotion.findFirst({
    where: {
      type,
      isActive: true,
      startAt: { lte: now },
      endAt: { gte: now },
      OR: [
        { usageLimit: null },
        { usageLimit: { gt: prisma.promotion.fields.usageCount } }
      ]
    },
    orderBy: {
      discountValue: 'desc', // 优先取优惠力度最大的
    },
  });

  return promo;
}
