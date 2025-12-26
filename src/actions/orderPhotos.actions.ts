'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/server-auth';

/**
 * Order Photos Server Actions
 * 订单照片管理 - 存储在订单元数据中
 * 
 * 由于没有独立的 OrderPhoto 表，照片信息存储在订单的 metadata 或作为 JSON 字段
 */

export interface OrderPhoto {
    id: string;
    photo_url: string;
    photo_type: 'before' | 'after' | 'detail' | 'other';
    caption: string | null;
    display_order: number;
    created_at: string;
}

/**
 * 获取订单照片列表
 * 从订单的 notes 字段（作为 JSON）中提取照片信息
 */
export async function getOrderPhotosAction(orderId: string): Promise<OrderPhoto[]> {
    await requireAuth();

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, notes: true },
    });

    if (!order) {
        return [];
    }

    // 尝试从 notes 字段解析照片数据
    try {
        if (order.notes && order.notes.startsWith('[')) {
            const photos = JSON.parse(order.notes);
            if (Array.isArray(photos)) {
                return photos;
            }
        }
    } catch {
        // notes 不是 JSON 格式，返回空数组
    }

    return [];
}

/**
 * 添加订单照片
 */
export async function addOrderPhotoAction(params: {
    orderId: string;
    photoUrl: string;
    photoType: 'before' | 'after' | 'detail' | 'other';
    caption?: string;
    displayOrder?: number;
}): Promise<OrderPhoto> {
    await requireAdmin();

    const { orderId, photoUrl, photoType, caption, displayOrder } = params;

    // 验证订单存在
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, notes: true },
    });

    if (!order) {
        throw new Error('订单不存在');
    }

    // 解析现有照片
    let existingPhotos: OrderPhoto[] = [];
    try {
        if (order.notes && order.notes.startsWith('[')) {
            existingPhotos = JSON.parse(order.notes);
        }
    } catch {
        // 如果 notes 不是 JSON 格式，将其保存为照片的 caption
    }

    // 创建新照片记录
    const newPhoto: OrderPhoto = {
        id: crypto.randomUUID(),
        photo_url: photoUrl,
        photo_type: photoType,
        caption: caption || null,
        display_order: displayOrder ?? existingPhotos.length,
        created_at: new Date().toISOString(),
    };

    // 更新订单 notes
    const updatedPhotos = [...existingPhotos, newPhoto];
    await prisma.order.update({
        where: { id: orderId },
        data: { notes: JSON.stringify(updatedPhotos) },
    });

    return newPhoto;
}

/**
 * 删除订单照片
 */
export async function deleteOrderPhotoAction(
    orderId: string,
    photoId: string
): Promise<{ success: boolean }> {
    await requireAdmin();

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, notes: true },
    });

    if (!order) {
        throw new Error('订单不存在');
    }

    // 解析现有照片
    let existingPhotos: OrderPhoto[] = [];
    try {
        if (order.notes && order.notes.startsWith('[')) {
            existingPhotos = JSON.parse(order.notes);
        }
    } catch {
        throw new Error('照片数据格式错误');
    }

    // 移除指定照片
    const updatedPhotos = existingPhotos.filter(p => p.id !== photoId);

    if (updatedPhotos.length === existingPhotos.length) {
        throw new Error('照片不存在');
    }

    // 更新订单 notes
    await prisma.order.update({
        where: { id: orderId },
        data: { notes: JSON.stringify(updatedPhotos) },
    });

    return { success: true };
}

/**
 * 重新排序订单照片
 */
export async function reorderOrderPhotosAction(
    orderId: string,
    photoOrders: { id: string; displayOrder: number }[]
): Promise<{ success: boolean }> {
    await requireAdmin();

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, notes: true },
    });

    if (!order) {
        throw new Error('订单不存在');
    }

    // 解析现有照片
    let existingPhotos: OrderPhoto[] = [];
    try {
        if (order.notes && order.notes.startsWith('[')) {
            existingPhotos = JSON.parse(order.notes);
        }
    } catch {
        throw new Error('照片数据格式错误');
    }

    // 更新排序
    const orderMap = new Map(photoOrders.map(p => [p.id, p.displayOrder]));
    const sortedPhotos = existingPhotos
        .map(p => ({
            ...p,
            display_order: orderMap.get(p.id) ?? p.display_order,
        }))
        .sort((a, b) => a.display_order - b.display_order);

    // 更新订单 notes
    await prisma.order.update({
        where: { id: orderId },
        data: { notes: JSON.stringify(sortedPhotos) },
    });

    return { success: true };
}
