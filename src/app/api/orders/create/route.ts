/**
 * 创建订单 API
 * POST /api/orders/create
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const { stringId, tension, usePackage, packageId, voucherId, notes } = body;

    // 验证必填字段
    if (!stringId || !tension) {
      return errorResponse('缺少必填字段');
    }

    if (tension < 18 || tension > 30) {
      return errorResponse('张力必须在 18-30 磅之间');
    }

    // 验证库存
    const string = await prisma.stringInventory.findUnique({
      where: { id: stringId },
    });

    if (!string) {
      return errorResponse('球线不存在', 404);
    }

    if (string.stock < 11) {
      return errorResponse('库存不足');
    }

    // 处理套餐
    let packageUsed: any = null;
    let basePrice = 35.00;

    if (usePackage && packageId) {
      packageUsed = await prisma.userPackage.findFirst({
        where: {
          id: packageId,
          userId: user.id,
          remaining: { gt: 0 },
          status: 'active',
          expiry: { gte: new Date() },
        },
        include: { package: true },
      });

      if (!packageUsed) {
        return errorResponse('套餐不可用');
      }

      basePrice = 0; // 套餐包含费用
    }

    // 处理优惠券
    let discount = 0;
    let voucherUsed: any = null;

    if (voucherId) {
      voucherUsed = await prisma.userVoucher.findFirst({
        where: {
          id: voucherId,
          userId: user.id,
          status: 'active',
          expiry: { gte: new Date() },
        },
        include: { voucher: true },
      });

      if (!voucherUsed) {
        return errorResponse('优惠券不可用');
      }

      const voucher = voucherUsed.voucher;
      const now = new Date();
      
      if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
        return errorResponse('优惠券不在有效期内');
      }

      // 验证优惠券数值
      const voucherValue = Number(voucher.value);
      const minPurchase = Number(voucher.minPurchase);
      
      if (isNaN(voucherValue) || voucherValue <= 0) {
        return errorResponse('优惠券金额无效');
      }

      // 检查最低消费
      if (!isNaN(minPurchase) && basePrice < minPurchase) {
        return errorResponse(`最低消费 RM ${minPurchase.toFixed(2)}`);
      }

      // 计算折扣
      if (voucher.type === 'percentage') {
        discount = (basePrice * voucherValue) / 100;
      } else {
        discount = voucherValue;
      }
      
      // 确保折扣不超过原价
      discount = Math.min(discount, basePrice);
    }

    const finalPrice = Math.max(0, basePrice - discount);

    // 创建订单
    const order = await prisma.$transaction(async (tx) => {
      // 创建订单
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          stringId,
          tension,
          price: finalPrice,
          cost: string.costPrice,
          discount,
          discountAmount: discount,
          status: 'pending',
          usePackage: !!usePackage,
          packageUsedId: packageUsed?.id,
          voucherUsedId: voucherUsed?.id,
          notes,
        },
      });

      // 如果使用套餐，扣除次数
      if (packageUsed) {
        await tx.userPackage.update({
          where: { id: packageUsed.id },
          data: {
            remaining: { decrement: 1 },
            status: packageUsed.remaining - 1 === 0 ? 'depleted' : 'active',
          },
        });
      }

      // 如果使用优惠券，标记为已使用
      if (voucherUsed) {
        await tx.userVoucher.update({
          where: { id: voucherUsed.id },
          data: {
            status: 'used',
            usedAt: new Date(),
            orderId: newOrder.id,
          },
        });
      }

      // 如果需要支付，创建支付记录
      if (finalPrice > 0) {
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            userId: user.id,
            amount: finalPrice,
            provider: 'manual',
            status: 'pending',
          },
        });
      }

      return newOrder;
    });

    return successResponse({
      orderId: order.id,
      finalPrice,
      paymentRequired: finalPrice > 0,
    }, '订单创建成功');

  } catch (error: any) {
    console.error('Create order error:', error);
    return errorResponse(error.message || '创建订单失败', 500);
  }
}
