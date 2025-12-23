/**
 * 用户优惠券 API 路由
 * GET /api/user/vouchers - 获取当前用户的优惠券列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }

        const userId = session.user.id;

        // 获取用户优惠券及关联的优惠券信息
        const userVouchers = await prisma.userVoucher.findMany({
            where: { userId },
            include: {
                voucher: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // 转换为前端期望的格式
        const vouchers = userVouchers.map((uv) => {
            const v = uv.voucher;
            const now = new Date();
            const expiryDate = uv.expiry || v.validUntil;
            const isExpired = expiryDate ? new Date(expiryDate) < now : false;
            const isUsed = !!uv.usedAt;

            return {
                id: uv.id,
                voucherId: v.id,
                code: v.code,
                name: v.name,
                description: v.description,
                discountType: v.discountType,
                discountValue: Number(v.discountValue),
                minPurchase: v.minPurchase ? Number(v.minPurchase) : 0,
                maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : null,
                expiry: expiryDate,
                used: isUsed,
                usedAt: uv.usedAt,
                expired: isExpired,
                status: isUsed ? 'used' : isExpired ? 'expired' : 'active',
                createdAt: uv.createdAt,
            };
        });

        return NextResponse.json({ vouchers });
    } catch (error: any) {
        console.error('[API] Error fetching user vouchers:', error);
        return NextResponse.json(
            { error: error.message || '获取优惠券失败' },
            { status: 500 }
        );
    }
}
