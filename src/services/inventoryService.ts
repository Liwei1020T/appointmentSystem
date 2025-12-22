/**
 * Inventory Service - Prisma migrated version
 */

import { StringInventory, StockLog } from '.prisma/client';
import {
  adjustInventoryStockAction,
  deleteInventoryItemAction,
  getInventoryAction,
  getInventoryItemAction,
  getInventoryLogsAction,
  updateInventoryItemAction,
} from '@/actions/inventory.actions';

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

export async function getInventory(activeOnly = false): Promise<StringInventory[]> {
  const data = await getInventoryAction(activeOnly);
  return data || [];
}

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

export async function getInventoryByBrand(brand: string): Promise<{ strings?: StringInventory[]; error?: string }> {
  try {
    const inventory = await getInventory(true);
    return { strings: inventory.filter((item) => item.brand === brand) };
  } catch (error) {
    console.error('Error getting inventory by brand:', error);
    return { error: 'Failed to get inventory' };
  }
}

export async function getStringById(stringId: string): Promise<StringInventory | null> {
  try {
    return await getInventoryItemAction(stringId);
  } catch {
    return null;
  }
}

export async function checkStock(stringId: string, quantity: number): Promise<boolean> {
  const string = await getStringById(stringId);
  if (!string) return false;
  return string.stock >= quantity;
}

export async function getBrands(): Promise<{ brands?: string[]; error?: string }> {
  try {
    const inventory = await getInventory(true);
    const brands = new Set(inventory.map((item) => item.brand));
    return { brands: Array.from(brands).sort() };
  } catch (error) {
    console.error('Error getting brands:', error);
    return { error: 'Failed to get brands' };
  }
}

// Stubs for missing functions
export async function updateString(id: string, data: Partial<StringInventory>): Promise<StringInventory> {
  return updateInventoryItemAction(id, data);
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

export async function adjustStock(params: AdjustStockParams): Promise<AdjustStockResult> {
  try {
    // Determine if this is adding or removing stock
    const isDeduction = params.type === 'purchase' || params.type === 'adjustment';
    const change = isDeduction ? -Math.abs(params.changeAmount) : Math.abs(params.changeAmount);

    const result = await adjustInventoryStockAction(params.stringId, {
      change,
      type: params.type,
      reason: params.reason || '',
    });
    return { string: result, error: null };
  } catch (err: any) {
    return { string: null, error: err.message || 'Failed to adjust stock' };
  }
}

export async function getStockLogs(stringId: string): Promise<any[]> {
  try {
    return await getInventoryLogsAction(stringId);
  } catch {
    return [];
  }
}

export async function deleteString(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await deleteInventoryItemAction(id);
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

export async function getAllStrings(params?: GetAllStringsParams): Promise<GetAllStringsResult> {
  try {
    let strings = await getInventory(false);
    
    // Filter by stock status
    if (params?.stockStatus && params.stockStatus !== 'all') {
      if (params.stockStatus === 'out_of_stock') {
        strings = strings.filter(s => s.stock === 0);
      } else if (params.stockStatus === 'low_stock') {
        strings = strings.filter(s => s.stock > 0 && s.stock <= s.minimumStock);
      } else if (params.stockStatus === 'in_stock') {
        strings = strings.filter(s => s.stock > s.minimumStock);
      }
    }
    
    // Filter by brand
    if (params?.brand) {
      strings = strings.filter(s => s.brand === params.brand);
    }
    
    // Filter by search term
    if (params?.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      strings = strings.filter(s => 
        s.model.toLowerCase().includes(term) || 
        s.brand.toLowerCase().includes(term)
      );
    }
    
    const total = strings.length;
    
    // Pagination
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

export async function getLowStockAlerts(threshold = 5): Promise<LowStockAlertsResult> {
  try {
    const inventory = await getInventory(true);
    const lowStockItems = inventory.filter((item) => item.stock <= threshold);
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

export async function checkLowStock(threshold = 5): Promise<LowStockResult> {
  try {
    const inventory = await getInventory(true);
    const lowStockItems = inventory.filter((item) => item.stock <= threshold);
    return { 
      items: lowStockItems, 
      lowStockStrings: lowStockItems, 
      data: lowStockItems, 
      count: lowStockItems.length,
      error: null
    };
  } catch (error) {
    console.error('Failed to check low stock:', error);
    return { 
      items: [], 
      lowStockStrings: [],
      data: [],
      count: 0,
      error: error as Error
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

export async function addStock(
  stringIdOrParams: string | AddStockParams,
  quantity?: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let stringId: string;
    let stockQuantity: number;
    let reason: string;
    let costPerUnit: number | undefined;
    
    if (typeof stringIdOrParams === 'object') {
      // Object parameter format
      stringId = stringIdOrParams.stringId;
      stockQuantity = stringIdOrParams.quantity;
      reason = stringIdOrParams.reason || 'Stock added';
      costPerUnit = stringIdOrParams.costPerUnit || stringIdOrParams.cost_per_unit;
    } else {
      // Legacy format
      stringId = stringIdOrParams;
      stockQuantity = quantity || 0;
      reason = notes || 'Stock added';
    }
    
    await adjustInventoryStockAction(stringId, {
      change: stockQuantity,
      reason,
      type: 'restock',
      costPerUnit,
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

export async function getStockHistory(
  stringId?: string,
  limitOrOptions?: number | { limit?: number; offset?: number }
): Promise<{ history: StockHistoryEntry[]; logs: StockHistoryEntry[]; data?: StockHistoryEntry[]; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (stringId) params.append('stringId', stringId);
    
    let limit: number | undefined;
    let offset: number | undefined;
    
    if (typeof limitOrOptions === 'number') {
      limit = limitOrOptions;
    } else if (limitOrOptions) {
      limit = limitOrOptions.limit;
      offset = limitOrOptions.offset;
    }
    
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/api/admin/inventory/history?${queryString}` : '/api/admin/inventory/history';
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      return { history: [], logs: [], data: [], error: data.error || 'Failed to fetch stock history' };
    }
    
    const logs = data.logs || data.history || [];
    return { history: logs, logs, data: logs, error: null };
  } catch (error) {
    console.error('Failed to fetch stock history:', error);
    return { history: [], logs: [], data: [], error: 'Failed to fetch stock history' };
  }
}
