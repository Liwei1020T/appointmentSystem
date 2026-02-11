/**
 * Admin Announcement Detail API
 * PATCH  /api/admin/announcements/[id] - 更新公告
 * DELETE /api/admin/announcements/[id] - 删除公告
 */

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { okResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';
import { z } from 'zod';

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(5000).optional(),
  imageUrl: z.string().url().nullable().optional(),
  linkUrl: z.string().url().nullable().optional(),
  linkText: z.string().max(50).nullable().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

function hasJsonResponse(error: unknown): error is { json: () => Response } {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const maybeJson = (error as { json?: unknown }).json;
  return typeof maybeJson === 'function';
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('公告不存在');
    }

    const body = await request.json();
    const validation = updateAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        validation.error.errors[0].message,
        400,
        validation.error.errors
      );
    }

    const data = validation.data;

    // 验证时间逻辑
    const startAt = data.startAt ? new Date(data.startAt) : existing.startAt;
    const endAt = data.endAt ? new Date(data.endAt) : existing.endAt;

    if (endAt <= startAt) {
      return errorResponse('结束时间必须晚于开始时间', 400);
    }

    // 如果有链接，必须有按钮文字
    const linkUrl = data.linkUrl !== undefined ? data.linkUrl : existing.linkUrl;
    const linkText = data.linkText !== undefined ? data.linkText : existing.linkText;

    if (linkUrl && !linkText) {
      return errorResponse('有跳转链接时必须填写按钮文字', 400);
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
        ...(data.linkText !== undefined && { linkText: data.linkText }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.startAt !== undefined && { startAt: new Date(data.startAt) }),
        ...(data.endAt !== undefined && { endAt: new Date(data.endAt) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return okResponse(announcement);
  } catch (error: unknown) {
    if (hasJsonResponse(error)) return error.json();
    console.error('[Admin Announcements] Update error:', error);
    return serverErrorResponse('更新公告失败', error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('公告不存在');
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return okResponse({ success: true });
  } catch (error: unknown) {
    if (hasJsonResponse(error)) return error.json();
    console.error('[Admin Announcements] Delete error:', error);
    return serverErrorResponse('删除公告失败', error);
  }
}
