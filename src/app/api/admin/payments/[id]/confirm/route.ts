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

    const targetUserId = payment.order?.userId || payment.userId;
    await prisma.$transaction(async (tx) => {
      // 1. 更新支付状态
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'success',
          transactionId: transactionId || null,
          metadata: {
            ...(payment.metadata as any),
            verifiedAt: new Date().toISOString(),
            verifiedBy: admin.id,
            adminNotes: notes || null,
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
      // 说明：
      // - 以 payment.packageId 作为“套餐购买”的可信标记（历史数据可能缺失 metadata.type）
      // - 为避免误判订单支付：要求 orderId 为空，或明确标记为 package
      const paymentMeta = (payment.metadata as any) || {};
      const packageId = payment.packageId;
      const isPackagePurchase =
        !!packageId && (!payment.orderId || paymentMeta?.type === 'package');

      if (isPackagePurchase) {
        // 查找是否已有 UserPackage 记录（避免重复点击导致重复创建）
        const existingUserPackage = await tx.userPackage.findFirst({
          where: {
            userId: targetUserId,
            packageId,
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000), // 5分钟内
            },
          },
        });

        if (!existingUserPackage) {
          // 获取套餐信息并创建用户套餐记录
          const pkg = await tx.package.findUnique({
            where: { id: packageId },
          });

          if (pkg) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);

            await tx.userPackage.create({
              data: {
                userId: targetUserId,
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
      } else if (packageId) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            title: '支付已确认',
            message: '您的套餐支付已确认，可在“我的套餐”查看',
            type: 'payment',
            actionUrl: '/profile/packages',
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
