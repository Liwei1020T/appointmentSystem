/**
 * Admin Announcements API
 * GET  /api/admin/announcements - 获取公告列表
 * POST /api/admin/announcements - 创建公告
 */

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/api-response';
import { z } from 'zod';

const createAnnouncementSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题最多100字'),
  content: z.string().min(1, '内容不能为空').max(5000, '内容最多5000字'),
  imageUrl: z.string().url().nullable().optional(),
  linkUrl: z.string().url().nullable().optional(),
  linkText: z.string().max(50).nullable().optional(),
  priority: z.number().int().min(0).max(100).optional().default(0),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

function hasJsonResponse(error: unknown): error is { json: () => Response } {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const maybeJson = (error as { json?: unknown }).json;
  return typeof maybeJson === 'function';
}

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      orderBy: [{ isActive: 'desc' }, { startAt: 'desc' }],
    });

    // 统计
    const activeCount = announcements.filter(
      (a) => a.isActive && a.startAt <= now && a.endAt >= now
    ).length;
    const endedCount = announcements.filter(
      (a) => !a.isActive || a.endAt < now
    ).length;

    return okResponse({
      announcements,
      summary: {
        activeCount,
        endedCount,
        totalCount: announcements.length,
      },
    });
  } catch (error: unknown) {
    if (hasJsonResponse(error)) return error.json();
    console.error('[Admin Announcements] Error:', error);
    return serverErrorResponse('获取公告列表失败', error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validation = createAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        validation.error.errors[0].message,
        400,
        validation.error.errors
      );
    }

    const data = validation.data;

    // 验证时间逻辑
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);

    if (endAt <= startAt) {
      return errorResponse('结束时间必须晚于开始时间', 400);
    }

    // 如果有链接，必须有按钮文字
    if (data.linkUrl && !data.linkText) {
      return errorResponse('有跳转链接时必须填写按钮文字', 400);
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl || null,
        linkText: data.linkText || null,
        priority: data.priority || 0,
        startAt,
        endAt,
        isActive: true,
      },
    });

    return okResponse(announcement);
  } catch (error: unknown) {
    if (hasJsonResponse(error)) return error.json();
    console.error('[Admin Announcements] Create error:', error);
    return serverErrorResponse('创建公告失败', error);
  }
}
