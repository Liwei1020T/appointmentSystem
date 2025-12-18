/**
 * 管理员确认现金支付 API
 * POST /api/admin/payments/[id]/confirm-cash
 */

import { NextRequest, NextResponse } from 'next/server';
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

    // 查找支付记录
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true, package: true },
    });

    if (!payment) {
      return errorResponse('支付记录不存在', 404);
    }

    if (payment.provider !== 'cash') {
      return errorResponse('只能确认现金支付', 400);
    }

    if (payment.status === 'success' || payment.status === 'completed') {
      return errorResponse('该支付已确认', 400);
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      // 1) 标记支付成功
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'success',
          metadata: {
            ...(payment.metadata as any),
            confirmed_by: admin.id,
            confirmed_at: new Date().toISOString(),
            confirmed_by_name: admin.fullName,
          },
        },
      });

      // 2) 订单现金支付：推进订单进入处理中
      if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'in_progress' },
        });
      }

      // 3) 套餐现金支付：激活套餐并写入 user_packages
      if (payment.packageId) {
        const existingUserPackage = await tx.userPackage.findFirst({
          where: {
            userId: payment.userId,
            packageId: payment.packageId,
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000),
            },
          },
        });

        if (!existingUserPackage) {
          const pkg = await tx.package.findUnique({
            where: { id: payment.packageId },
          });

          if (pkg) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);

            await tx.userPackage.create({
              data: {
                userId: payment.userId,
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

      // 4) 通知用户
      await tx.notification.create({
        data: {
          userId: payment.userId,
          title: '支付已确认',
          message: payment.packageId
            ? '您的套餐现金支付已确认，可在“我的套餐”查看'
            : `您的现金支付已确认，订单 #${payment.orderId?.slice(0, 8)} 已生效`,
          type: 'payment',
          actionUrl: payment.packageId ? '/profile/packages' : `/orders/${payment.orderId}`,
          read: false,
        },
      });

      return updated;
    });

    return successResponse({
      payment: updatedPayment,
      message: '现金收款已确认',
    });
  } catch (error: any) {
    if (error?.json) return error.json();
    console.error('Confirm cash payment error:', error);
    return errorResponse(error.message || '确认现金支付失败', 500);
  }
}
