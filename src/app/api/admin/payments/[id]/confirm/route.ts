/**
 * 管理员 - 确认支付 API
 * POST /api/admin/payments/[id]/confirm
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const paymentId = params.id;
    const body = await request.json();
    const { transactionId, notes } = body;

    // 查找支付记录
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return errorResponse('支付记录不存在', 404);
    }

    if (payment.status === 'success') {
      return errorResponse('该支付已确认，无需重复操作');
    }

    await prisma.$transaction(async (tx) => {
      // 1. 更新支付状态
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'success',
          transactionId: transactionId || null,
          metadata: {
            verifiedAt: new Date().toISOString(),
            verifiedBy: admin.id,
          },
        },
      });

      // 2. 更新订单状态
      if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'in_progress' },
        });
      }

      // 3. 如果是套餐购买，激活套餐
      const paymentMeta = payment.metadata as any;
      if (paymentMeta?.type === 'package' && payment.packageId) {
        // 查找是否已有 UserPackage 记录
        const existingUserPackage = payment.order ? await tx.userPackage.findFirst({
          where: {
            userId: payment.order.userId,
            packageId: payment.packageId,
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000), // 5分钟内
            },
          },
        }) : null;

        if (!existingUserPackage && payment.order) {
          // 获取套餐信息
          const pkg = await tx.package.findUnique({
            where: { id: payment.packageId },
          });

          if (pkg) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);

            await tx.userPackage.create({
              data: {
                userId: payment.order.userId,
                packageId: pkg.id,
                remaining: pkg.times,
                originalTimes: pkg.times,
                status: 'active',
                expiry: expiryDate,
              },
            });
          }
        }
      }

      // 4. 创建通知给用户
      if (payment.order) {
        await tx.notification.create({
          data: {
            userId: payment.order.userId,
            title: '支付已确认',
            message: `您的支付已确认，订单 #${payment.orderId?.slice(0, 8)} 已生效`,
            type: 'payment',
            actionUrl: `/orders/${payment.orderId}`,
            read: false,
          },
        });
      }
    });

    return successResponse({}, '支付已确认');
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    return errorResponse(error.message || '确认支付失败', 500);
  }
}
