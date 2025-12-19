/**
 * Distribute Voucher Modal
 * 
 * Features:
 * - Select distribution target: all users, specific users, or by tier
 * - Specific user selection with search
 * - Tier-based distribution
 * - Preview before distribution
 * - Success/error feedback
 * 
 * Phase 3.5: Admin Voucher Management
 */

'use client';

import { useState, useEffect } from 'react';
import {
  distributeVoucher,
  type DistributionTarget,
} from '@/services/adminVoucherService';

interface DistributeVoucherModalProps {
  voucherId: string;
  voucherCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

export default function DistributeVoucherModal({
  voucherId,
  voucherCode,
  onClose,
  onSuccess,
}: DistributeVoucherModalProps) {
  const [loading, setLoading] = useState(false);
  const [distributionType, setDistributionType] = useState<'all' | 'specific' | 'tier'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState<'bronze' | 'silver' | 'gold' | 'platinum'>('bronze');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    if (distributionType === 'specific') {
      loadUsers();
    }
  }, [distributionType]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          String(user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(user.phone || '').includes(searchTerm)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to load users');
      const payload = await response.json();
      if (!payload.success) {
        throw new Error('Failed to load users');
      }
      const userList: User[] = Array.isArray(payload.data?.users)
        ? payload.data.users
        : [];
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  }

  async function handleDistribute() {
    setLoading(true);

    let target: DistributionTarget;

    if (distributionType === 'all') {
      target = { type: 'all' };
    } else if (distributionType === 'specific') {
      if (selectedUserIds.length === 0) {
        alert('请选择至少一个用户');
        setLoading(false);
        return;
      }
      target = { type: 'specific', userIds: selectedUserIds };
    } else {
      target = { type: 'tier', tier: selectedTier };
    }

    const { success, count, error } = await distributeVoucher(voucherId, target);

    if (error) {
      alert(`分发失败: ${error}`);
    } else {
      alert(`成功分发给 ${count} 个用户！`);
      onSuccess();
      onClose();
    }

    setLoading(false);
  }

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  function selectAllFiltered() {
    setSelectedUserIds(filteredUsers.map((u) => u.id));
  }

  function deselectAll() {
    setSelectedUserIds([]);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">分发优惠券</h2>
          <p className="text-gray-600 mt-1">优惠券代码: {voucherCode}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Distribution Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              分发对象
            </label>
            <div className="space-y-2">
              {/* All Users */}
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="distributionType"
                  value="all"
                  checked={distributionType === 'all'}
                  onChange={() => setDistributionType('all')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <div className="font-medium">所有用户</div>
                  <div className="text-sm text-gray-500">
                    将优惠券分发给系统中所有用户
                  </div>
                </div>
              </label>

              {/* Specific Users */}
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="distributionType"
                  value="specific"
                  checked={distributionType === 'specific'}
                  onChange={() => setDistributionType('specific')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <div className="font-medium">指定用户</div>
                  <div className="text-sm text-gray-500">
                    选择特定用户接收优惠券
                  </div>
                </div>
              </label>

              {/* By Tier */}
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="distributionType"
                  value="tier"
                  checked={distributionType === 'tier'}
                  onChange={() => setDistributionType('tier')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <div className="font-medium">按等级分发</div>
                  <div className="text-sm text-gray-500">
                    根据用户等级分发（需要系统支持用户等级）
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Specific Users Selection */}
          {distributionType === 'specific' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索用户姓名、邮箱或手机"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={selectAllFiltered}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  全选
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  取消全选
                </button>
              </div>

              <div className="text-sm text-gray-600">
                已选择 {selectedUserIds.length} 个用户
              </div>

              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">加载中...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? '未找到匹配的用户' : '暂无用户'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div className="ml-3">
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {user.phone || user.email || '-'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tier Selection */}
          {distributionType === 'tier' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择用户等级
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="bronze">青铜会员</option>
                <option value="silver">白银会员</option>
                <option value="gold">黄金会员</option>
                <option value="platinum">白金会员</option>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                注意：此功能需要用户表中有 tier 字段
              </p>
            </div>
          )}

          {/* Distribution Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="font-medium text-blue-900 mb-2">分发预览</div>
            <div className="text-sm text-blue-700">
              {distributionType === 'all' && '将分发给所有用户（避免重复）'}
              {distributionType === 'specific' &&
                `将分发给 ${selectedUserIds.length} 个选定用户`}
              {distributionType === 'tier' &&
                `将分发给所有 ${
                  { bronze: '青铜', silver: '白银', gold: '黄金', platinum: '白金' }[
                    selectedTier
                  ]
                } 会员`}
            </div>
            <div className="text-xs text-blue-600 mt-2">
              系统将自动跳过已拥有此优惠券的用户
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleDistribute}
            disabled={loading || (distributionType === 'specific' && selectedUserIds.length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? '分发中...' : '确认分发'}
          </button>
        </div>
      </div>
    </div>
  );
}
