import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { isAdminRole } from '@/lib/roles';
import { isValidUUID } from '@/lib/utils';

export interface OrderPhoto {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'detail' | 'other';
  caption: string | null;
  display_order: number;
  created_at: string;
}

type UserSnapshot = {
  id: string;
  role?: string | null;
};

function parseOrderPhotos(notes: string | null): OrderPhoto[] {
  if (!notes || !notes.trim().startsWith('[')) {
    return [];
  }

  try {
    const parsed = JSON.parse(notes);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureAdmin(user: UserSnapshot) {
  if (!isAdminRole(user.role)) {
    throw new ApiError('FORBIDDEN', 403, 'Admin access required');
  }
}

/**
 * List order photos for a user (owner or admin).
 */
export async function listOrderPhotos(user: UserSnapshot, orderId: string): Promise<OrderPhoto[]> {
  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, notes: true },
  });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  if (!isAdminRole(user.role) && order.userId !== user.id) {
    throw new ApiError('FORBIDDEN', 403, 'Access denied');
  }

  return parseOrderPhotos(order.notes);
}

/**
 * Add an order photo (admin only).
 */
export async function addOrderPhoto(
  admin: UserSnapshot,
  params: {
    orderId: string;
    photoUrl: string;
    photoType: 'before' | 'after' | 'detail' | 'other';
    caption?: string;
    displayOrder?: number;
  }
): Promise<OrderPhoto> {
  ensureAdmin(admin);

  const { orderId, photoUrl, photoType, caption, displayOrder } = params;
  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, notes: true },
  });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  const existingPhotos = parseOrderPhotos(order.notes);
  const newPhoto: OrderPhoto = {
    id: crypto.randomUUID(),
    photo_url: photoUrl,
    photo_type: photoType,
    caption: caption || null,
    display_order: displayOrder ?? existingPhotos.length,
    created_at: new Date().toISOString(),
  };

  await prisma.order.update({
    where: { id: orderId },
    data: { notes: JSON.stringify([...existingPhotos, newPhoto]) },
  });

  return newPhoto;
}

/**
 * Delete an order photo (admin only).
 */
export async function deleteOrderPhoto(
  admin: UserSnapshot,
  orderId: string,
  photoId: string
): Promise<void> {
  ensureAdmin(admin);

  if (!isValidUUID(orderId) || !isValidUUID(photoId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order photo id');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, notes: true },
  });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  const existingPhotos = parseOrderPhotos(order.notes);
  const updatedPhotos = existingPhotos.filter((photo) => photo.id !== photoId);

  if (updatedPhotos.length === existingPhotos.length) {
    throw new ApiError('NOT_FOUND', 404, 'Photo not found');
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { notes: JSON.stringify(updatedPhotos) },
  });
}

/**
 * Reorder order photos (admin only).
 */
export async function reorderOrderPhotos(
  admin: UserSnapshot,
  orderId: string,
  photoOrders: { id: string; displayOrder: number }[]
): Promise<void> {
  ensureAdmin(admin);

  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, notes: true },
  });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  const existingPhotos = parseOrderPhotos(order.notes);
  const orderMap = new Map(photoOrders.map((photo) => [photo.id, photo.displayOrder]));
  const sortedPhotos = existingPhotos
    .map((photo) => ({
      ...photo,
      display_order: orderMap.get(photo.id) ?? photo.display_order,
    }))
    .sort((a, b) => a.display_order - b.display_order);

  await prisma.order.update({
    where: { id: orderId },
    data: { notes: JSON.stringify(sortedPhotos) },
  });
}
