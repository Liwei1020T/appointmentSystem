/**
 * Public inventory API
 * GET /api/inventory
 *
 * NOTE: 此端点为公开访问（预约流程需要），但过滤掉成本价、库存数量等敏感字段
 */

import { z } from 'zod';
import { failResponse, okResponse } from '@/lib/api-response';
import { listInventory } from '@/server/services/inventory.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  active: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      active: url.searchParams.get('active') || undefined,
    });

    if (!parsedQuery.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query params', 422, parsedQuery.error.flatten());
    }

    const activeOnly = parsedQuery.data.active !== 'false';
    const inventory = await listInventory(activeOnly);

    // 过滤掉敏感字段（成本价、精确库存数量、最低库存、版本号）
    const publicInventory = inventory.map((item) => ({
      id: item.id,
      model: item.model,
      brand: item.brand,
      description: item.description,
      sellingPrice: item.sellingPrice,
      color: item.color,
      gauge: item.gauge,
      imageUrl: item.imageUrl,
      isRecommended: item.isRecommended,
      elasticity: item.elasticity,
      durability: item.durability,
      control: item.control,
      active: item.active,
      inStock: item.stock > 0,
    }));

    return okResponse(publicInventory);
  } catch (error) {
    return handleApiError(error);
  }
}
