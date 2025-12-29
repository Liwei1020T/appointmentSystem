/**
 * Admin User List Page
 * 
 * Features:
 * - User statistics cards
 * - Filter by role and status
 * - Search by name, email, phone
 * - User table with pagination
 * - Quick actions (view detail, block/unblock, change role)
 * 
 * Phase 3.6: Admin User Management
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getAllUsers,
  getUserStats,
  blockUser,
  updateUserRole,
  type User,
  type UserStats,
  type UserRole,
  type UserStatus,
} from '@/services/adminUserService';
import SectionLoading from '@/components/loading/SectionLoading';

export default function AdminUserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, searchTerm, currentPage]);

  async function loadStats() {
    const result = await getUserStats();
    if (result.data) {
      setStats(result.data);
    }
  }

  async function loadUsers() {
    setLoading(true);
    setError(null);

    const result = await getAllUsers({
      role: roleFilter,
      status: statusFilter,
      searchTerm,
      page: currentPage,
      pageSize,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const safeUsers = Array.isArray(result.users) ? result.users : [];
    setUsers(safeUsers);
    setTotalCount(result.totalCount || 0);
    setLoading(false);
  }

  async function handleBlockUser(userId: string, currentlyBlocked: boolean) {
    const action = currentlyBlocked ? '解除封禁' : '封禁';
    if (!confirm(`确定要${action}此用户吗？`)) {
      return;
    }

    setLoading(true);
    const { success, error } = await blockUser(userId, !currentlyBlocked);
    
    if (error) {
      alert(`操作失败: ${error}`);
    } else {
      await loadUsers();
      await loadStats();
    }
    
    setLoading(false);
  }

  async function handleChangeRole(userId: string, currentRole: UserRole) {
    const newRole = prompt(
      `当前角色: ${currentRole}\n请输入新角色 (user/admin/super_admin):`,
      currentRole
    );

    if (!newRole || newRole === currentRole) {
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
      await loadUsers();
    }
    
    setLoading(false);
  }

  function formatCurrency(amount: number): string {
    return `¥${amount.toFixed(2)}`;
  }

  function formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">用户管理</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-ink-surface p-6 rounded-lg shadow">
            <div className="text-sm text-text-tertiary mb-1">总用户数</div>
            <div className="text-2xl font-bold text-text-primary">{stats.total_users || stats.totalUsers || 0}</div>
            <div className="text-xs text-text-tertiary mt-1">
              活跃: {stats.active_users || stats.activeUsers || 0} | 封禁: {stats.blocked_users || stats.blockedUsers || 0}
            </div>
          </div>

          <div className="bg-ink-surface p-6 rounded-lg shadow">
            <div className="text-sm text-text-tertiary mb-1">本月新增</div>
            <div className="text-2xl font-bold text-info">{stats.new_users_this_month || stats.newUsersThisMonth || 0}</div>
            <div className="text-xs text-text-tertiary mt-1">
              较上月增长
            </div>
          </div>

          <div className="bg-ink-surface p-6 rounded-lg shadow">
            <div className="text-sm text-text-tertiary mb-1">总订单数</div>
            <div className="text-2xl font-bold text-success">{stats.total_orders || stats.totalOrders || 0}</div>
            <div className="text-xs text-text-tertiary mt-1">
              总营收: {formatCurrency(stats.total_revenue || stats.totalRevenue || 0)}
            </div>
          </div>

          <div className="bg-ink-surface p-6 rounded-lg shadow">
            <div className="text-sm text-text-tertiary mb-1">积分发放</div>
            <div className="text-2xl font-bold text-accent">{stats.total_points_distributed || stats.totalPointsDistributed || 0}</div>
            <div className="text-xs text-text-tertiary mt-1">
              总积分
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-ink-surface p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              搜索
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="姓名或手机"
              className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              角色
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | 'all');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent"
            >
              <option value="all">全部角色</option>
              <option value="user">用户</option>
              <option value="admin">管理员</option>
              <option value="super_admin">超级管理员</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              状态
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent"
            >
              <option value="all">全部状态</option>
              <option value="active">活跃</option>
              <option value="blocked">已封禁</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && users.length === 0 && (
        <SectionLoading label="加载用户..." minHeightClassName="min-h-[240px]" />
      )}

      {error && (
        <div className="bg-danger/15 border border-danger/40 text-danger px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <div className="bg-ink-surface rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-elevated">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    联系方式
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    积分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    邀请码
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-ink-surface divide-y divide-border-subtle">
                {!Array.isArray(users) || users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-text-tertiary">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-ink-elevated">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-text-primary">{user.full_name}</div>
                        <div className="text-sm text-text-tertiary">{user.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-tertiary">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-accent">{user.points}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-mono text-info">{user.referral_code || '-'}</div>
                        {user.referred_by && (
                          <div className="text-xs text-text-tertiary">推荐: {user.referred_by}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.is_blocked
                              ? 'bg-danger/15 text-danger'
                              : 'bg-success/15 text-success'
                          }`}
                        >
                          {user.is_blocked ? '已封禁' : '正常'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-tertiary">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <a
                            href={`/admin/users/${user.id}`}
                            className="text-info hover:text-info/80"
                          >
                            详情
                          </a>
                          <button
                            onClick={() => handleChangeRole(user.id, user.role)}
                            className="text-accent hover:text-accent/80"
                          >
                            角色
                          </button>
                          <button
                            onClick={() => handleBlockUser(user.id, user.is_blocked || false)}
                            className={user.is_blocked ? 'text-success hover:text-success/80' : 'text-danger hover:text-danger/80'}
                          >
                            {user.is_blocked ? '解封' : '封禁'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-ink-elevated px-6 py-4 flex items-center justify-between border-t border-border-subtle">
              <div className="text-sm text-text-secondary">
                显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} / 共 {totalCount} 条
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-border-subtle rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ink-surface"
                >
                  上一页
                </button>
                <div className="flex items-center px-3 py-1 text-sm">
                  第 {currentPage} / {totalPages} 页
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-border-subtle rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ink-surface"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
