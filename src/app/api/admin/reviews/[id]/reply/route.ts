import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const reply = String(body.reply || '').trim();

    if (!reply || reply.length < 5) {
      return errorResponse('回复内容至少需要 5 个字');
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: {
        adminReply: reply,
        adminReplyAt: new Date(),
        adminReplyBy: admin.id,
      },
    });

    return successResponse({
      id: updated.id,
      admin_reply: updated.adminReply,
      admin_reply_at: updated.adminReplyAt?.toISOString() || null,
      admin_reply_by: updated.adminReplyBy || null,
    });
  } catch (error: any) {
    console.error('Reply review error:', error);
    return errorResponse(error.message || '回复失败', 500);
  }
}
