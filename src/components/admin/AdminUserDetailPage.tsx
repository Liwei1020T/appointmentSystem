/**
 * Admin User Detail Page
 * 
 * Features:
 * - User information display
 * - Orders history
 * - Packages owned
 * - Vouchers owned
 * - Points log
 * - Manual points adjustment
 * - Role management
 * - Block/unblock user
 * 
 * Phase 3.6: Admin User Management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUserById,
  getUserOrders,
  getUserPackages,
  getUserVouchers,
  getUserPointsLog,
  updateUserPoints,
  updateUserRole,
  blockUser,
  type User,
  type UserOrder,
  type UserPackage,
  type UserVoucher,
  type PointsLog,
  type UserRole,
} from '@/services/adminUserService';
import PageLoading from '@/components/loading/PageLoading';
import { CheckCircle } from 'lucide-react';

interface AdminUserDetailPageProps {
  userId: string;
}

export default function AdminUserDetailPage({ userId }: AdminUserDetailPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [pointsLog, setPointsLog] = useState<PointsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsReason, setPointsReason] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);
    setError(null);

    const { user: userData, error: userError } = await getUserById(userId);

    if (userError) {
      setError(userError);
      setLoading(false);
      return;
    }

    setUser(userData);

    // Load related data
    const [
      ordersResult,
      packagesResult,
      vouchersResult,
      pointsLogResult,
    ] = await Promise.all([
      getUserOrders(userId),
      getUserPackages(userId),
      getUserVouchers(userId),
      getUserPointsLog(userId),
    ]);

    setOrders(ordersResult?.data || []);
    setPackages(packagesResult?.data || []);
    setVouchers(vouchersResult?.data || []);
    setPointsLog(pointsLogResult?.data || []);

    setLoading(false);
  }

  async function handleAdjustPoints() {
    if (!user || pointsAmount === 0 || !pointsReason) {
      alert('请填写调整金额和原因');
      return;
    }

    setLoading(true);
    const { success, newBalance, error } = await updateUserPoints(userId, pointsAmount, pointsReason, pointsAmount > 0 ? 'add' : 'subtract');

    if (error) {
      alert(`调整失败: ${error}`);
    } else {
      setShowPointsModal(false);
      setPointsAmount(0);
      setPointsReason('');
      await loadData();
    }

    setLoading(false);
  }

  async function handleChangeRole() {
    if (!user) return;

    const newRole = prompt(
      `当前角色: ${user.role}\n请输入新角色 (user/admin/super_admin):`,
      user.role
    );

    if (!newRole || newRole === user.role) {
      return;
    }

    if (!['user', 'admin', 'super_admin'].includes(newRole)) {
      alert('无效的角色');
      return;
    }

    setLoading(true);
    const { success, error } = await updateUserRole(userId, newRole as UserRole);

    if (error) {
      alert(`更新角色失败: ${error}`);
    } else {
      await loadData();
    }

    setLoading(false);
  }

  async function handleBlockUser() {
    if (!user) return;

    const action = user.is_blocked ? '解除封禁' : '封禁';
    if (!confirm(`确定要${action}此用户吗？`)) {
      return;
    }

    setLoading(true);
    const { success, error } = await blockUser(userId, !user.is_blocked);

    if (error) {
      alert(`操作失败: ${error}`);
    } else {
      await loadData();
    }

    setLoading(false);
  }

  function formatCurrency(amount: number): string {
    return `¥${amount.toFixed(2)}`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN');
  }

  function getStatusBadge(status: string) {
    const badges = {
      pending: 'bg-warning/15 text-warning',
      in_progress: 'bg-info-soft text-info',
      completed: 'bg-success/15 text-success',
      cancelled: 'bg-danger/15 text-danger',
    };

    const labels = {
      pending: '待处理',
      in_progress: '处理中',
      completed: '已完成',
      cancelled: '已取消',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges] || 'bg-ink-elevated text-text-secondary'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  }

  function getOrderStringSummary(order: UserOrder) {
    if (order.items && order.items.length > 0) {
      return {
        title: '多球拍订单',
        subtitle: `${order.items.length} 支球拍`,
      };
    }

    return {
      title: order.string?.name || '-',
      subtitle: order.string?.brand || '-',
    };
  }

  function getOrderTensionLabel(order: UserOrder) {
    if (order.tension) {
      return `${order.tension} lbs`;
    }

    if (!order.items || order.items.length === 0) {
      return '-';
    }

    const normalized = order.items.map((item) => ({
      vertical: item.tensionVertical ?? null,
      horizontal: item.tensionHorizontal ?? null,
    }));
    const first = normalized[0];
    const allSame = normalized.every(
      (value) => value.vertical === first.vertical && value.horizontal === first.horizontal
    );

    if (allSame && first.vertical) {
      if (first.horizontal && first.horizontal !== first.vertical) {
        return `${first.vertical}/${first.horizontal} lbs`;
      }
      return `${first.vertical} lbs`;
    }

    return '多拉力';
  }

  function getVoucherStatusBadge(status: string) {
    const badges = {
      available: 'bg-success/15 text-success',
      used: 'bg-ink-elevated text-text-secondary',
      expired: 'bg-danger/15 text-danger',
    };

    const labels = {
      available: '可用',
      used: '已使用',
      expired: '已过期',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  }

  function getRoleBadge(role: string) {
    const badges = {
      user: 'bg-info-soft text-info',
      admin: 'bg-accent/15 text-accent',
      super_admin: 'bg-danger/15 text-danger',
    };

    const labels = {
      user: '用户',
      admin: '管理员',
      super_admin: '超级管理员',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[role as keyof typeof badges]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  }

  if (loading && !user) {
    return <PageLoading surface="dark" />;
  }

  if (error || !user) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-danger/10 border border-danger/40 text-danger px-4 py-3 rounded-lg">
          {error || '用户不存在'}
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalSpent = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.price || o.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const activePackages = packages.filter(p => (p.remaining || p.remainingSessions || 0) > 0 && new Date(p.expiry || p.expiryDate || new Date()) > new Date());
  const availableVouchers = vouchers.filter(v => (v.status || (v.isUsed ? 'used' : 'available')) === 'available');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="text-text-secondary hover:text-text-primary"
          >
            ← 返回列表
          </button>
          <h1 className="text-3xl font-bold text-text-primary">{user.full_name}</h1>
          {getRoleBadge(user.role)}
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${user.is_blocked
                ? 'bg-danger/15 text-danger'
                : 'bg-success/15 text-success'
              }`}
          >
            {user.is_blocked ? '已封禁' : '正常'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPointsModal(true)}
            className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
          >
            调整积分
          </button>
          <button
            onClick={handleChangeRole}
            className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
          >
            更改角色
          </button>
          <button
            onClick={handleBlockUser}
            className={`px-4 py-2 rounded-lg ${user.is_blocked
                ? 'bg-success text-text-primary hover:bg-success/90'
                : 'bg-danger text-text-primary hover:bg-danger/90'
              }`}
          >
            {user.is_blocked ? '解除封禁' : '封禁用户'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Info */}
          <div className="bg-ink-surface rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">用户信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">联系方式</span>
                <span className="font-medium">{user.phone || user.email || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">手机</span>
                <span className="font-medium">{user.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">当前积分</span>
                <span className="font-bold text-accent">{user.points}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">邀请码</span>
                <span className="font-mono text-accent">{user.referral_code || '-'}</span>
              </div>
              {user.referred_by && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-text-secondary">推荐人</span>
                  <span className="font-mono text-text-secondary">{user.referred_by}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">注册时间</span>
                <span className="text-sm">{formatDateTime(user.created_at || user.createdAt as any)}</span>
              </div>
              {(user.updated_at || user.updatedAt) && (
                <div className="flex justify-between py-2">
                  <span className="text-text-secondary">更新时间</span>
                  <span className="text-sm">{formatDateTime((user.updated_at || user.updatedAt) as any)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Orders History */}
          <div className="bg-ink-surface rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">订单历史</h2>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">暂无订单</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="bg-ink-elevated text-[11px] uppercase tracking-wider text-text-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">球线</th>
                      <th className="px-4 py-3 text-left font-semibold">拉力</th>
                      <th className="px-4 py-3 text-right font-semibold">价格</th>
                      <th className="px-4 py-3 text-left font-semibold">状态</th>
                      <th className="px-4 py-3 text-center font-semibold">使用套餐</th>
                      <th className="px-4 py-3 text-right font-semibold">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {orders.map((order) => {
                      const orderString = getOrderStringSummary(order);
                      const tensionLabel = getOrderTensionLabel(order);
                      const isMultiRacket = order.items && order.items.length > 0;
                      const orderCode = order.orderNumber || order.order_number || order.id.slice(0, 8).toUpperCase();
                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-ink/80 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-text-primary">{orderString.title}</span>
                              {isMultiRacket && (
                                <span className="rounded-full bg-accent/15 text-accent px-2 py-0.5 text-[10px] font-semibold">
                                  多球拍
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-tertiary">{orderString.subtitle}</div>
                            <div className="text-[11px] text-text-tertiary font-mono">#{orderCode}</div>
                          </td>
                          <td className={`px-4 py-3 font-mono text-sm ${tensionLabel === '多拉力' ? 'text-text-tertiary' : 'text-text-primary'}`}>
                            {tensionLabel}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">
                            {formatCurrency(order.price || order.totalAmount || 0)}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                          <td className="px-4 py-3 text-center">
                            {order.use_package ? (
                              <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                                <CheckCircle className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="text-text-tertiary text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-text-secondary">
                            {formatDate((order.created_at || order.createdAt) as any)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Points Log */}
          <div className="bg-ink-surface rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">积分记录</h2>
            {pointsLog.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">暂无积分记录</div>
            ) : (
              <div className="space-y-2">
                {pointsLog.map((log) => (
                  <div key={log.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-medium">{log.source || log.reason || '-'}</div>
                      <div className="text-sm text-text-tertiary">{formatDateTime((log.created_at || log.createdAt) as any)}</div>
                    </div>
                    <div className={`font-bold ${(log.amount || log.points || 0) > 0 ? 'text-success' : 'text-danger'}`}>
                      {(log.amount || log.points || 0) > 0 ? '+' : ''}{log.amount || log.points || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-ink-surface rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">统计数据</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">总订单</span>
                <span className="font-bold">{totalOrders}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">已完成</span>
                <span className="font-bold text-success">{completedOrders}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">总消费</span>
                <span className="font-bold text-accent">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">活跃套餐</span>
                <span className="font-bold">{activePackages.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-secondary">可用优惠券</span>
                <span className="font-bold">{availableVouchers.length}</span>
              </div>
            </div>
          </div>

          {/* Packages */}
          <div className="bg-ink-surface rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">拥有套餐</h3>
            {packages.length === 0 ? (
              <div className="text-center py-4 text-text-tertiary text-sm">暂无套餐</div>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="border rounded-lg p-3">
                    <div className="font-medium">{pkg.package?.name || pkg.packageName || '-'}</div>
                    <div className="text-sm text-text-secondary mt-1">
                      剩余: {pkg.remaining || pkg.remainingSessions || 0} / {pkg.package?.times || pkg.totalSessions || 0}
                    </div>
                    <div className="text-xs text-text-tertiary mt-1">
                      到期: {formatDate((pkg.expiry || pkg.expiryDate) as any)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vouchers */}
          <div className="bg-ink-surface rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">拥有优惠券</h3>
            {vouchers.length === 0 ? (
              <div className="text-center py-4 text-text-tertiary text-sm">暂无优惠券</div>
            ) : (
              <div className="space-y-3">
                {vouchers.map((voucher) => (
                  <div key={voucher.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-accent">{voucher.voucher?.code || voucher.code || '-'}</div>
                      {getVoucherStatusBadge(voucher.status || (voucher.isUsed ? 'used' : 'available'))}
                    </div>
                    <div className="text-sm text-text-secondary mt-1">
                      {voucher.voucher?.type === 'fixed_amount'
                        ? formatCurrency(voucher.voucher?.value || voucher.discountValue || 0)
                        : `${voucher.voucher?.value || voucher.discountValue || 0}%`}
                    </div>
                    {(voucher.used_at || voucher.usedAt) && (
                      <div className="text-xs text-text-tertiary mt-1">
                        使用: {formatDate((voucher.used_at || voucher.usedAt) as any)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Points Adjustment Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-ink-surface rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">调整积分</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  当前积分
                </label>
                <div className="text-2xl font-bold text-accent">{user.points}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  调整金额
                </label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                  placeholder="正数增加，负数减少"
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                />
                <div className="text-sm text-text-tertiary mt-1">
                  调整后: {user.points + pointsAmount}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  调整原因
                </label>
                <textarea
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  rows={3}
                  placeholder="请输入调整原因"
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPointsModal(false);
                  setPointsAmount(0);
                  setPointsReason('');
                }}
                className="px-4 py-2 border border-border-subtle rounded-lg text-text-secondary hover:bg-ink"
              >
                取消
              </button>
              <button
                onClick={handleAdjustPoints}
                disabled={loading || pointsAmount === 0 || !pointsReason}
                className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow disabled:bg-ink-elevated"
              >
                {loading ? '处理中...' : '确认调整'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
