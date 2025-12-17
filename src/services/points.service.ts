/**
 * Points Service
 * 积分系统服务
 */

export type PointsLogType = 'EARN' | 'REDEEM' | 'earn' | 'redeem' | 'spend' | 'expire' | 'order' | 'referral' | 'review' | 'registration' | 'admin_adjust' | string;

export interface PointsLog {
  id: string;
  userId: string;
  user_id?: string;
  points: number;
  amount?: number;
  type: PointsLogType;
  reason: string;
  description?: string;
  createdAt: Date;
  created_at?: string | Date;
  orderId?: string;
  order_id?: string;
  balance_after?: number;
  balanceAfter?: number;
}

export interface PointsHistory {
  id: string;
  userId: string;
  points: number;
  type: 'EARN' | 'REDEEM';
  reason: string;
  createdAt: Date;
}

export interface PointsStats {
  totalPoints: number;
  earnedThisMonth: number;
  redeemedThisMonth: number;
  // snake_case aliases for backward compatibility
  total_earned?: number;
  total_spent?: number;
}

export async function getPointsBalance(userId?: string): Promise<{ balance: number; error: string | null }> {
  try {
    const response = await fetch('/api/points');
    const data = await response.json();
    if (!response.ok) {
      return { balance: 0, error: data.error || '获取积分余额失败' };
    }
    const payload = data?.data || data;
    const rawBalance = payload?.balance ?? payload?.points ?? 0;
    const balance = Number.isFinite(Number(rawBalance)) ? Number(rawBalance) : 0;
    return { balance, error: null };
  } catch (error: any) {
    console.error('Failed to fetch points balance:', error);
    return { balance: 0, error: error.message || '获取积分余额失败' };
  }
}

export async function getPointsHistory(
  filterType?: PointsLogType | string,
  limit?: number
): Promise<{ logs: PointsLog[]; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filterType) params.append('type', filterType);
    if (limit) params.append('limit', limit.toString());
    
    const response = await fetch(`/api/points/history?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      return { logs: [], error: data.error || '获取积分记录失败' };
    }
    const payload = data?.data?.logs ?? data?.logs ?? data?.history ?? data?.data ?? [];
    return { logs: Array.isArray(payload) ? payload : [], error: null };
  } catch (error: any) {
    console.error('Failed to fetch points history:', error);
    return { logs: [], error: error.message || '获取积分记录失败' };
  }
}

export async function getPointsStats(userId: string): Promise<PointsStats> {
  try {
    const response = await fetch('/api/points/stats');
    const data = await response.json();
    const payload = data?.data ?? data;
    return {
      totalPoints: payload.totalPoints || 0,
      earnedThisMonth: payload.earnedThisMonth || 0,
      redeemedThisMonth: payload.redeemedThisMonth || 0,
      total_earned: payload.total_earned ?? 0,
      total_spent: payload.total_spent ?? 0,
    };
  } catch (error) {
    console.error('Failed to fetch points stats:', error);
    return { totalPoints: 0, earnedThisMonth: 0, redeemedThisMonth: 0 };
  }
}

export async function addPoints(userId: string, points: number, reason: string): Promise<boolean> {
  try {
    const response = await fetch('/api/points/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, reason }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to add points:', error);
    return false;
  }
}

export async function redeemPoints(userId: string, points: number): Promise<boolean> {
  try {
    const response = await fetch('/api/points/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to redeem points:', error);
    return false;
  }
}
