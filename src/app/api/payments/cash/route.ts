/**
 * 现金支付API
 * POST /api/payments/cash
 * 
 * 处理现金支付，直接标记为已支付并完成订单
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证订单存在且属于当前用户
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: '无权操作此订单' },
        { status: 403 }
      );
    }

    // 创建现金支付记录，等待管理员确认
    const payment = await prisma.payment.create({
      data: {
        orderId,
        userId: session.user.id,
        amount: Number(amount),
        status: 'pending',
        provider: 'cash',
        metadata: {
          payment_type: 'cash',
          payment_method: 'cash',
          created_at: new Date().toISOString(),
          note: '客户选择现金支付，等待管理员确认收款',
        },
      },
    });

    // 只更新订单的支付状态，不改变订单状态（订单仍需管理员处理）
    // 订单保持 pending 状态，等待管理员开始穿线
    
    return NextResponse.json({
      success: true,
      payment,
      message: '现金支付已确认，订单等待处理',
    });
  } catch (error: any) {
    console.error('Cash payment error:', error);
    return NextResponse.json(
      { error: error.message || '现金支付处理失败' },
      { status: 500 }
    );
  }
}
