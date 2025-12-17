/**
 * 订单 API
 * GET /api/orders - 获取用户订单列表
 * POST /api/orders - 创建新订单
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
        ...(status && { status }),
      },
      include: {
        string: {
          select: {
            id: true,
            brand: true,
            model: true,
            sellingPrice: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            provider: true,
            transactionId: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit && { take: parseInt(limit) }),
    });

    return successResponse(orders);
  } catch (error: any) {
    console.error('Get orders error:', error);
    return errorResponse(error.message || '获取订单失败', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      string_id,
      tension,
      price,
      cost_price,
      discount_amount = 0,
      final_price,
      use_package = false,
      voucher_id = null,
      notes = '',
    } = body;

    // 验证必填字段
    if (!string_id || !tension || final_price === undefined) {
      return errorResponse('缺少必填字段', 400);
    }

    // 验证球线是否存在且库存充足
    const string = await prisma.stringInventory.findUnique({
      where: { id: string_id },
    });

    if (!string) {
      return errorResponse('球线不存在', 404);
    }

    if (string.stock <= 0) {
      return errorResponse('球线库存不足', 400);
    }

    // 如果使用套餐，验证套餐是否可用
    let packageUsed = null;
    if (use_package) {
      const availablePackage = await prisma.userPackage.findFirst({
        where: {
          userId: user.id,
          remaining: { gt: 0 },
          expiry: { gt: new Date() },
          status: 'active',
        },
        orderBy: {
          expiry: 'asc', // 优先使用即将过期的套餐
        },
      });

      if (!availablePackage) {
        return errorResponse('没有可用的套餐', 400);
      }

      packageUsed = availablePackage;
    }

    // 如果使用优惠券，验证优惠券是否可用
    if (voucher_id && !use_package) {
      const userVoucher = await prisma.userVoucher.findFirst({
        where: {
          userId: user.id,
          voucherId: voucher_id,
          status: 'active',
          expiry: { gt: new Date() },
        },
      });

      if (!userVoucher) {
        return errorResponse('优惠券不可用', 400);
      }
    }

    // 创建订单（使用事务）
    const order = await prisma.$transaction(async (tx) => {
      // 1. 创建订单
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          stringId: string_id,
          tension,
          price: final_price,
          cost: cost_price || string.costPrice,
          profit: final_price - (cost_price || string.costPrice),
          discount: discount_amount,
          discountAmount: discount_amount,
          usePackage: use_package,
          packageUsedId: packageUsed?.id || null,
          voucherUsedId: voucher_id || null,
          status: use_package ? 'in_progress' : 'pending',
          notes,
        },
      });

      // 2. 如果使用套餐，更新套餐使用次数
      if (use_package && packageUsed) {
        const updatedPackage = await tx.userPackage.update({
          where: { id: packageUsed.id },
          data: {
            remaining: { decrement: 1 },
          },
        });

        // 如果剩余次数为 0，更新状态
        if (updatedPackage.remaining === 0) {
          await tx.userPackage.update({
            where: { id: packageUsed.id },
            data: { status: 'depleted' },
          });
        }
      }

      // 3. 如果使用优惠券，标记为已使用
      if (voucher_id && !use_package) {
        await tx.userVoucher.updateMany({
          where: {
            userId: user.id,
            voucherId: voucher_id,
            status: 'active',
          },
          data: {
            status: 'used',
            usedAt: new Date(),
            orderId: newOrder.id,
          },
        });
      }

      // 4. 减少库存
      await tx.stringInventory.update({
        where: { id: string_id },
        data: {
          stock: { decrement: 1 },
        },
      });

      // 5. 记录库存变更
      await tx.stockLog.create({
        data: {
          stringId: string_id,
          change: -1,
          type: 'sale',
          costPrice: cost_price || string.costPrice,
          referenceId: newOrder.id,
          notes: `订单 ${newOrder.id} 使用`,
          createdBy: user.id,
        },
      });

      // 6. 如果不使用套餐，创建待支付记录
      if (!use_package && final_price > 0) {
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            userId: user.id,
            amount: final_price,
            status: 'pending',
            provider: 'pending',
          },
        });
      }

      return newOrder;
    });

    // 返回完整订单信息
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        string: {
          select: {
            id: true,
            brand: true,
            model: true,
            sellingPrice: true,
          },
        },
        payments: true,
      },
    });

    return successResponse(fullOrder, '订单创建成功');
  } catch (error: any) {
    console.error('Create order error:', error);
    return errorResponse(error.message || '创建订单失败', 500);
  }
}
