/**
 * Package renewal reminder cron
 * POST /api/admin/cron/package-renewal
 *
 * Sends reminders for packages expiring within 7 days.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

const CRON_SECRET = process.env.CRON_SECRET;
const RENEWAL_WINDOW_DAYS = 7;

async function verifyCronOrAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    return true;
  }

  const session = await auth();
  if (session?.user?.role === 'admin') {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await verifyCronOrAdmin(request);
    if (!authorized) {
      return errorResponse('Unauthorized', 401);
    }

    const now = new Date();
    const expiryCutoff = new Date(now.getTime() + RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const expiringPackages = await prisma.userPackage.findMany({
      where: {
        status: 'active',
        remaining: { gt: 0 },
        expiry: {
          gte: now,
          lte: expiryCutoff,
        },
      },
      include: {
        package: {
          select: { name: true },
        },
      },
    });

    if (expiringPackages.length === 0) {
      return successResponse({
        message: 'No expiring packages',
        sent: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const notifications = expiringPackages.map((pkg) => {
      const daysLeft = Math.ceil((pkg.expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return {
        userId: pkg.userId,
        title: '套餐即将到期',
        message: `您的套餐「${pkg.package?.name || '套餐'}」将在 ${daysLeft} 天后到期，提前续购可享优惠。`,
        type: 'package',
        actionUrl: '/profile/packages',
        read: false,
      };
    });

    await prisma.notification.createMany({ data: notifications });

    return successResponse({
      message: 'Package renewal reminders sent',
      sent: notifications.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
