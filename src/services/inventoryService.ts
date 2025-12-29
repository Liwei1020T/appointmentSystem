/**
 * Inventory Service - API client
 * Wraps inventory-related API routes for client usage.
 */

import type { StringInventory, StockLog } from '.prisma/client';
import { apiRequest } from '@/services/apiClient';
import { cachedRequest, invalidateRequestCacheByPrefix } from '@/services/requestCache';

export type { StringInventory, StockLog };
export type StockChangeType = 'purchase' | 'restock' | 'adjustment' | 'return' | 'addition' | 'deduction';
export type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export interface LowStockAlert {
  id: string;
  brand: string;
  model: string;
  stock: number;
  minimumStock: number;
}

/**
 * Fetch inventory list from public endpoint.
 */
export async function getInventory(activeOnly = false): Promise<StringInventory[]> {
  const query = activeOnly ? '?active=true' : '?active=false';
  return apiRequest<StringInventory[]>(`/api/inventory${query}`);
}

/**
 * Fetch inventory list from admin endpoint.
 */
export async function getAdminInventory(): Promise<StringInventory[]> {
  const cacheKey = 'admin:inventory:list';
  return cachedRequest(cacheKey, async () => apiRequest<StringInventory[]>('/api/admin/inventory'), {
    ttlMs: 15000,
  });
}

/**
 * Fetch available strings for booking flows.
 */
export async function getAvailableStrings(brand?: string): Promise<{ strings?: StringInventory[]; error?: string }> {
  try {
    const inventory = await getInventory(true);
    let strings = inventory.filter((item) => item.stock > 0);
    if (brand) {
      strings = strings.filter((item) => item.brand === brand);
    }
    return { strings };
  } catch (error) {
    console.error('Error getting available strings:', error);
    return { error: 'Failed to get available strings' };
  }
}

/**
 * Fetch inventory by brand.
 */
export async function getInventoryByBrand(brand: string): Promise<{ strings?: StringInventory[]; error?: string }> {
  try {
    const inventory = await getInventory(true);
    return { strings: inventory.filter((item) => item.brand === brand) };
  } catch (error) {
    console.error('Error getting inventory by brand:', error);
    return { error: 'Failed to get inventory' };
  }
}

/**
 * Fetch a single string by id.
 */
export async function getStringById(stringId: string): Promise<StringInventory | null> {
  try {
    return await apiRequest<StringInventory>(`/api/inventory/${stringId}`);
  } catch {
    return null;
  }
}

/**
 * Check stock availability for a given quantity.
 */
export async function checkStock(stringId: string, quantity: number): Promise<boolean> {
  const string = await getStringById(stringId);
  if (!string) return false;
  return string.stock >= quantity;
}

/**
 * Fetch all available brands.
 */
export async function getBrands(): Promise<{ brands?: string[]; error?: string }> {
  const cacheKey = 'admin:inventory:brands';

  return cachedRequest(cacheKey, async () => {
    try {
      const inventory = await getInventory(true);
      const brands = new Set(inventory.map((item) => item.brand));
      return { brands: Array.from(brands).sort() };
    } catch (error) {
      console.error('Error getting brands:', error);
      return { error: 'Failed to get brands' };
    }
  }, { ttlMs: 60000 });
}

/**
 * Update a string inventory record (admin).
 */
export async function updateString(id: string, data: Partial<StringInventory>): Promise<StringInventory> {
  const result = await apiRequest<StringInventory>(`/api/admin/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  invalidateRequestCacheByPrefix('admin:inventory');
  invalidateRequestCacheByPrefix('admin:dashboard');
  return result;
}

/**
 * Create a new inventory item (admin).
 */
export async function createInventoryItem(data: Record<string, unknown>): Promise<StringInventory> {
  const result = await apiRequest<StringInventory>('/api/admin/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  invalidateRequestCacheByPrefix('admin:inventory');
  invalidateRequestCacheByPrefix('admin:dashboard');
  return result;
}

export interface AdjustStockParams {
  stringId: string;
  changeAmount: number;
  type: StockChangeType;
  reason?: string;
}

export interface AdjustStockResult {
  string: StringInventory | null;
  error: string | null;
}

/**
 * Adjust inventory stock via admin API.
 */
export async function adjustStock(params: AdjustStockParams): Promise<AdjustStockResult> {
  try {
    const isDeduction = params.type === 'purchase' || params.type === 'adjustment' || params.type === 'deduction';
    const change = isDeduction ? -Math.abs(params.changeAmount) : Math.abs(params.changeAmount);

    const result = await apiRequest<StringInventory>(`/api/admin/inventory/${params.stringId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        change,
        type: params.type,
        reason: params.reason || '',
      }),
    });
    invalidateRequestCacheByPrefix('admin:inventory');
    invalidateRequestCacheByPrefix('admin:dashboard');
    return { string: result, error: null };
  } catch (err: any) {
    return { string: null, error: err.message || 'Failed to adjust stock' };
  }
}

/**
 * Fetch stock logs for a specific string.
 */
export async function getStockLogs(stringId: string): Promise<any[]> {
  try {
    return await apiRequest<any[]>(`/api/admin/inventory/${stringId}/logs`);
  } catch {
    return [];
  }
}

/**
 * Delete a string inventory record (admin).
 */
export async function deleteString(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiRequest(`/api/admin/inventory/${id}`, { method: 'DELETE' });
    invalidateRequestCacheByPrefix('admin:inventory');
    invalidateRequestCacheByPrefix('admin:dashboard');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete string' };
  }
}

export interface GetAllStringsParams {
  stockStatus?: StockStatus;
  searchTerm?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}

export interface GetAllStringsResult {
  strings: StringInventory[];
  total: number;
  error: string | null;
}

/**
 * Fetch admin inventory with filtering/pagination on client side.
 */
export async function getAllStrings(params?: GetAllStringsParams): Promise<GetAllStringsResult> {
  try {
    let strings = await getAdminInventory();

    if (params?.stockStatus && params.stockStatus !== 'all') {
      if (params.stockStatus === 'out_of_stock') {
        strings = strings.filter((s) => s.stock === 0);
      } else if (params.stockStatus === 'low_stock') {
        strings = strings.filter((s) => s.stock > 0 && s.stock <= s.minimumStock);
      } else if (params.stockStatus === 'in_stock') {
        strings = strings.filter((s) => s.stock > s.minimumStock);
      }
    }

    if (params?.brand) {
      strings = strings.filter((s) => s.brand === params.brand);
    }

    if (params?.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      strings = strings.filter((s) => s.model.toLowerCase().includes(term) || s.brand.toLowerCase().includes(term));
    }

    const total = strings.length;

    if (params?.offset !== undefined && params?.limit !== undefined) {
      strings = strings.slice(params.offset, params.offset + params.limit);
    }

    return { strings, total, error: null };
  } catch (err: any) {
    return { strings: [], total: 0, error: err.message || 'Failed to fetch strings' };
  }
}

export interface LowStockAlertsResult {
  alerts: LowStockAlert[];
  error: string | null;
}

/**
 * Fetch low stock alerts for admin.
 */
export async function getLowStockAlerts(threshold = 5): Promise<LowStockAlertsResult> {
  try {
    const inventory = await getAdminInventory();
    const lowStockItems = inventory.filter((item) => {
      if (item.active === false) return false;
      const minimumStock = Number.isFinite(item.minimumStock) ? item.minimumStock : threshold;
      const effectiveThreshold = Math.max(threshold, minimumStock);
      return item.stock <= effectiveThreshold;
    });
    const alerts: LowStockAlert[] = lowStockItems.map((item) => ({
      id: item.id,
      brand: item.brand,
      model: item.model,
      stock: item.stock,
      minimumStock: item.minimumStock,
    }));
    return { alerts, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch low stock alerts';
    return { alerts: [], error: errorMessage };
  }
}

export interface GetAllBrandsResult {
  brands: string[];
  error: string | null;
}

/**
 * Fetch all active brands for filters.
 */
export async function getAllBrands(): Promise<GetAllBrandsResult> {
  try {
    const result = await getBrands();
    if (result.error) {
      return { brands: [], error: result.error };
    }
    return { brands: result.brands || [], error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch brands';
    return { brands: [], error: errorMessage };
  }
}

export interface LowStockResult {
  items: StringInventory[];
  lowStockStrings?: StringInventory[];
  data?: StringInventory[];
  count: number;
  error?: Error | null;
}

/**
 * Check low stock items with a threshold.
 */
export async function checkLowStock(threshold = 5): Promise<LowStockResult> {
  try {
    const inventory = await getAdminInventory();
    const lowStockItems = inventory.filter((item) => {
      if (item.active === false) return false;
      const minimumStock = Number.isFinite(item.minimumStock) ? item.minimumStock : threshold;
      const effectiveThreshold = Math.max(threshold, minimumStock);
      return item.stock <= effectiveThreshold;
    });
    return {
      items: lowStockItems,
      lowStockStrings: lowStockItems,
      data: lowStockItems,
      count: lowStockItems.length,
      error: null,
    };
  } catch (error) {
    console.error('Failed to check low stock:', error);
    return {
      items: [],
      lowStockStrings: [],
      data: [],
      count: 0,
      error: error as Error,
    };
  }
}

export interface AddStockParams {
  stringId: string;
  quantity: number;
  costPerUnit?: number;
  cost_per_unit?: number;
  reason?: string;
  adminId?: string;
  admin_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Add stock via adjustment endpoint.
 */
export async function addStock(
  stringIdOrParams: string | AddStockParams,
  quantity?: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let stringId: string;
    let stockQuantity: number;
    let reason: string;

    if (typeof stringIdOrParams === 'object') {
      stringId = stringIdOrParams.stringId;
      stockQuantity = stringIdOrParams.quantity;
      reason = stringIdOrParams.reason || 'Stock added';
    } else {
      stringId = stringIdOrParams;
      stockQuantity = quantity || 0;
      reason = notes || 'Stock added';
    }

    await apiRequest(`/api/admin/inventory/${stringId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        change: stockQuantity,
        type: 'restock',
        reason,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to add stock:', error);
    return { success: false, error: 'Failed to add stock' };
  }
}

export interface StockHistoryEntry {
  id: string;
  stringId?: string;
  string_id?: string;
  change?: number;
  quantity_change?: number;
  quantityChange?: number;
  quantity_before?: number;
  quantityBefore?: number;
  quantity_after?: number;
  quantityAfter?: number;
  type: string;
  reason?: string;
  notes?: string;
  reference_id?: string;
  referenceId?: string;
  createdAt?: Date | string;
  created_at?: Date | string;
  created_by?: string;
  createdBy?: string;
  adminId?: string;
  admin_id?: string;
  string?: {
    id: string;
    name?: string;
    brand: string;
    model: string;
  };
  creator?: {
    id: string;
    full_name?: string;
    fullName?: string;
  };
}

/**
 * Fetch stock history (all or per string).
 */
export async function getStockHistory(
  stringId?: string,
  limitOrOptions?: number | { limit?: number; offset?: number }
): Promise<{ history: StockHistoryEntry[]; logs: StockHistoryEntry[]; data?: StockHistoryEntry[]; error: string | null }> {
  try {
    let limit: number | undefined;
    let offset: number | undefined;

    if (typeof limitOrOptions === 'number') {
      limit = limitOrOptions;
    } else if (limitOrOptions) {
      limit = limitOrOptions.limit;
      offset = limitOrOptions.offset;
    }

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (stringId) params.append('stringId', stringId);

    const query = params.toString();
    const url = stringId
      ? `/api/admin/inventory/${stringId}/logs${query ? `?${query}` : ''}`
      : `/api/admin/inventory/logs${query ? `?${query}` : ''}`;

    const logs = await apiRequest<StockHistoryEntry[]>(url);
    return { history: logs, logs, data: logs, error: null };
  } catch (error: any) {
    console.error('Failed to fetch stock history:', error);
    return { history: [], logs: [], data: [], error: error.message || 'Failed to fetch stock history' };
  }
}
