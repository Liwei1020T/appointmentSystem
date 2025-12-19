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
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      pending: '待处理',
      in_progress: '处理中',
      completed: '已完成',
      cancelled: '已取消',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  }

  function getVoucherStatusBadge(status: string) {
    const badges = {
      available: 'bg-green-100 text-green-800',
      used: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
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
      user: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800',
      super_admin: 'bg-red-100 text-red-800',
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
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12 text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
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
            className="text-gray-600 hover:text-gray-900"
          >
            ← 返回列表
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{user.full_name}</h1>
          {getRoleBadge(user.role)}
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              user.is_blocked
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {user.is_blocked ? '已封禁' : '正常'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPointsModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            调整积分
          </button>
          <button
            onClick={handleChangeRole}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            更改角色
          </button>
          <button
            onClick={handleBlockUser}
            className={`px-4 py-2 rounded-lg ${
              user.is_blocked
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">用户信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">联系方式</span>
                <span className="font-medium">{user.phone || user.email || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">手机</span>
                <span className="font-medium">{user.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">当前积分</span>
                <span className="font-bold text-purple-600">{user.points}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">邀请码</span>
                <span className="font-mono text-blue-600">{user.referral_code || '-'}</span>
              </div>
              {user.referred_by && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">推荐人</span>
                  <span className="font-mono text-gray-600">{user.referred_by}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">注册时间</span>
                <span className="text-sm">{formatDateTime(user.created_at || user.createdAt as any)}</span>
              </div>
              {(user.updated_at || user.updatedAt) && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">更新时间</span>
                  <span className="text-sm">{formatDateTime((user.updated_at || user.updatedAt) as any)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Orders History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">订单历史</h2>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无订单</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">球线</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">拉力</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用套餐</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{order.string?.name || '-'}</div>
                          <div className="text-sm text-gray-500">{order.string?.brand || '-'}</div>
                        </td>
                        <td className="px-4 py-3">{order.tension || '-'} lbs</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(order.price || order.totalAmount || 0)}</td>
                        <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                        <td className="px-4 py-3">
                          {order.use_package ? (
                            <span className="text-green-600 text-xs">✓</span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDate((order.created_at || order.createdAt) as any)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Points Log */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">积分记录</h2>
            {pointsLog.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无积分记录</div>
            ) : (
              <div className="space-y-2">
                {pointsLog.map((log) => (
                  <div key={log.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-medium">{log.source || log.reason || '-'}</div>
                      <div className="text-sm text-gray-500">{formatDateTime((log.created_at || log.createdAt) as any)}</div>
                    </div>
                    <div className={`font-bold ${(log.amount || log.points || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">统计数据</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">总订单</span>
                <span className="font-bold">{totalOrders}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">已完成</span>
                <span className="font-bold text-green-600">{completedOrders}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">总消费</span>
                <span className="font-bold text-blue-600">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">活跃套餐</span>
                <span className="font-bold">{activePackages.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">可用优惠券</span>
                <span className="font-bold">{availableVouchers.length}</span>
              </div>
            </div>
          </div>

          {/* Packages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">拥有套餐</h3>
            {packages.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">暂无套餐</div>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="border rounded-lg p-3">
                    <div className="font-medium">{pkg.package?.name || pkg.packageName || '-'}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      剩余: {pkg.remaining || pkg.remainingSessions || 0} / {pkg.package?.times || pkg.totalSessions || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      到期: {formatDate((pkg.expiry || pkg.expiryDate) as any)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vouchers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">拥有优惠券</h3>
            {vouchers.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">暂无优惠券</div>
            ) : (
              <div className="space-y-3">
                {vouchers.map((voucher) => (
                  <div key={voucher.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-blue-600">{voucher.voucher?.code || voucher.code || '-'}</div>
                      {getVoucherStatusBadge(voucher.status || (voucher.isUsed ? 'used' : 'available'))}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {voucher.voucher?.type === 'fixed_amount'
                        ? formatCurrency(voucher.voucher?.value || voucher.discountValue || 0)
                        : `${voucher.voucher?.value || voucher.discountValue || 0}%`}
                    </div>
                    {(voucher.used_at || voucher.usedAt) && (
                      <div className="text-xs text-gray-500 mt-1">
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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">调整积分</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  当前积分
                </label>
                <div className="text-2xl font-bold text-purple-600">{user.points}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  调整金额
                </label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                  placeholder="正数增加，负数减少"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-sm text-gray-500 mt-1">
                  调整后: {user.points + pointsAmount}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  调整原因
                </label>
                <textarea
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  rows={3}
                  placeholder="请输入调整原因"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleAdjustPoints}
                disabled={loading || pointsAmount === 0 || !pointsReason}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
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
