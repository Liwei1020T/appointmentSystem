/**
 * Review API payload helpers
 * Converts Prisma Review/Order/User records into snake_case API shapes used by the UI.
 */

type DecimalLike = number | { toNumber(): number } | null | undefined;

export function toNumber(value: DecimalLike): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
  return Number(value);
}

export function computeFinalPrice(order: {
  price?: DecimalLike;
  discount?: DecimalLike;
  discountAmount?: DecimalLike;
} | null | undefined): number {
  if (!order) return 0;
  const price = toNumber(order.price);
  const discount = toNumber(order.discountAmount ?? order.discount ?? 0);
  return Math.max(price - discount, 0);
}

export function mapReviewToApiPayload(
  review: any,
  options?: { includeOrder?: boolean; includeUser?: boolean; maskAnonymousUser?: boolean }
) {
  const includeOrder = options?.includeOrder ?? false;
  const includeUser = options?.includeUser ?? false;
  const maskAnonymousUser = options?.maskAnonymousUser ?? false;

  const rating = Number(review?.rating ?? 0);

  const serviceRating = Number(review?.serviceRating ?? review?.service_rating ?? rating);
  const qualityRating = Number(review?.qualityRating ?? review?.quality_rating ?? rating);
  const speedRating = Number(review?.speedRating ?? review?.speed_rating ?? rating);

  const photos = Array.isArray(review?.photos) ? review.photos : Array.isArray(review?.images) ? review.images : [];
  const tags = Array.isArray(review?.tags) ? review.tags : [];

  const order = review?.order;
  const finalPrice = computeFinalPrice(order);
  const orderNumber = order?.id ? String(order.id).slice(0, 8).toUpperCase() : '';

  const isAnonymous = Boolean(review?.isAnonymous ?? review?.is_anonymous ?? false);

  const user = review?.user;
  const userPayload =
    includeUser && user
      ? {
          id: user.id,
          full_name: maskAnonymousUser && isAnonymous ? null : user.fullName ?? user.full_name ?? null,
          email: maskAnonymousUser && isAnonymous ? null : user.email ?? null,
        }
      : undefined;

  const orderPayload =
    includeOrder && order
      ? {
          id: order.id,
          order_number: orderNumber,
          final_price: finalPrice,
          string: order.string
            ? {
                brand: order.string.brand,
                model: order.string.model,
              }
            : undefined,
        }
      : undefined;

  return {
    id: review.id,
    order_id: review.orderId ?? review.order_id,
    user_id: review.userId ?? review.user_id,
    rating,
    service_rating: serviceRating,
    quality_rating: qualityRating,
    speed_rating: speedRating,
    comment: review.comment || '',
    tags,
    images: photos,
    is_anonymous: isAnonymous,
    helpful_count: Number(review?.helpfulCount ?? review?.helpful_count ?? 0),
    admin_reply: review?.adminReply ?? review?.admin_reply ?? null,
    admin_reply_at: review?.adminReplyAt
      ? new Date(review.adminReplyAt).toISOString()
      : review?.admin_reply_at
      ? new Date(review.admin_reply_at).toISOString()
      : null,
    admin_reply_by: review?.adminReplyBy ?? review?.admin_reply_by ?? null,
    created_at: review?.createdAt ? new Date(review.createdAt).toISOString() : review?.created_at ?? null,
    updated_at: review?.updatedAt ? new Date(review.updatedAt).toISOString() : review?.updated_at ?? null,
    ...(orderPayload ? { order: orderPayload } : {}),
    ...(userPayload ? { user: userPayload } : {}),
  };
}

