/**
 * 上传支付凭证 API
 * POST /api/payments/[id]/proof
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { saveFile } from '@/lib/upload';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const paymentId = params.id;

    // 验证支付记录存在且属于当前用户
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId },
      include: {
        user: { select: { id: true } },
        order: {
          select: {
            userId: true,
            id: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!payment) {
      return errorResponse('支付记录不存在', 404);
    }

    // 订单支付：校验订单归属；套餐支付：校验 payment.userId
    if (payment.order && payment.order.userId !== user.id) {
      return errorResponse('无权操作此支付记录', 403);
    }
    if (!payment.order && payment.userId !== user.id) {
      return errorResponse('无权操作此支付记录', 403);
    }

    // 允许用户在被拒绝后重新上传
    if (!['pending', 'pending_verification', 'rejected', 'failed'].includes(payment.status)) {
      return errorResponse('该支付已处理，无需重复上传');
    }

    // 获取上传的文件
    const formData = await request.formData();
    const file = formData.get('proof') as File;

    if (!file) {
      return errorResponse('请上传支付凭证');
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return errorResponse('仅支持 JPG 和 PNG 格式');
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('文件大小不能超过 5MB');
    }

    // 保存文件
    const filePath = await saveFile(file, 'payment-proofs', {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85,
    });

    // 更新支付记录
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: {
          ...(payment.metadata as any),
          proofUrl: filePath,
          receiptUrl: (payment.metadata as any)?.receiptUrl || filePath,
          uploadedAt: new Date().toISOString(),
        },
        // 进入待审核状态，管理员端可在列表看到
        status: 'pending_verification',
      },
    });

    // 注意：此接口只处理“支付凭证上传”，不强制修改订单业务状态，避免覆盖管理员操作

    // 创建通知给管理员
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            title: '新的支付凭证待审核',
            message: payment.order
              ? `订单 #${payment.order.id.slice(0, 8)} 已上传支付凭证`
              : `套餐 ${payment.package?.name || payment.packageId || ''} 已上传支付凭证`,
            type: 'payment',
            // 当前管理端审核入口为列表页（避免不存在的详情路由）
            actionUrl: '/admin/payments',
            read: false,
          },
        })
      )
    );

    // 通知用户
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: '支付凭证已上传',
        message: '您的支付凭证已提交，我们会尽快审核',
        type: 'payment',
        actionUrl: payment.orderId ? `/orders/${payment.orderId}` : '/profile/packages',
        read: false,
      },
    });

    return successResponse(
      { proofUrl: filePath },
      '支付凭证上传成功，等待审核'
    );
  } catch (error: any) {
    console.error('Upload proof error:', error);
    return errorResponse(error.message || '上传失付', 500);
  }
}
