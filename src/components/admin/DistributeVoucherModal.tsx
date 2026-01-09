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
import { getAllUsers } from '@/services/adminUserService';
import { Button, Input } from '@/components';
import SectionLoading from '@/components/loading/SectionLoading';
import { Search } from 'lucide-react';

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
      const result = await getAllUsers();
      if (result.error) {
        throw new Error(result.error);
      }
      const userList: User[] = (result.users || []).map((user) => ({
        id: user.id,
        full_name: user.full_name || user.fullName || '',
        email: user.email,
        phone: user.phone,
      }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-ink-surface border border-border-subtle">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-2xl font-bold text-text-primary">分发优惠券</h2>
          <p className="text-text-secondary mt-1">优惠券代码: {voucherCode}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Distribution Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              分发对象
            </label>
            <div className="space-y-2">
              {/* All Users */}
              <label className="flex items-center p-3 border border-border-subtle rounded-lg cursor-pointer hover:bg-ink/70 transition-colors">
                <input
                  type="radio"
                  name="distributionType"
                  value="all"
                  checked={distributionType === 'all'}
                  onChange={() => setDistributionType('all')}
                  className="w-4 h-4 text-accent focus:ring-2 focus:ring-accent-border"
                />
                <div className="ml-3">
                  <div className="font-medium text-text-primary">所有用户</div>
                  <div className="text-sm text-text-tertiary">
                    将优惠券分发给系统中所有用户
                  </div>
                </div>
              </label>

              {/* Specific Users */}
              <label className="flex items-center p-3 border border-border-subtle rounded-lg cursor-pointer hover:bg-ink/70 transition-colors">
                <input
                  type="radio"
                  name="distributionType"
                  value="specific"
                  checked={distributionType === 'specific'}
                  onChange={() => setDistributionType('specific')}
                  className="w-4 h-4 text-accent focus:ring-2 focus:ring-accent-border"
                />
                <div className="ml-3">
                  <div className="font-medium text-text-primary">指定用户</div>
                  <div className="text-sm text-text-tertiary">
                    选择特定用户接收优惠券
                  </div>
                </div>
              </label>

              {/* By Tier */}
              <label className="flex items-center p-3 border border-border-subtle rounded-lg cursor-pointer hover:bg-ink/70 transition-colors">
                <input
                  type="radio"
                  name="distributionType"
                  value="tier"
                  checked={distributionType === 'tier'}
                  onChange={() => setDistributionType('tier')}
                  className="w-4 h-4 text-accent focus:ring-2 focus:ring-accent-border"
                />
                <div className="ml-3">
                  <div className="font-medium text-text-primary">按等级分发</div>
                  <div className="text-sm text-text-tertiary">
                    根据用户等级分发（需要系统支持用户等级）
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Specific Users Selection */}
          {distributionType === 'specific' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索用户姓名、邮箱或手机"
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={selectAllFiltered}>
                    全选
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    清除
                  </Button>
                </div>
              </div>

              <div className="text-sm text-text-secondary">
                已选择 {selectedUserIds.length} 个用户
              </div>

              <div className="border border-border-subtle rounded-lg max-h-64 overflow-y-auto">
                {loading ? (
                  <SectionLoading label="加载用户..." minHeightClassName="min-h-[200px]" />
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-text-tertiary">
                    {searchTerm ? '未找到匹配的用户' : '暂无用户'}
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-ink/70 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 text-accent rounded focus:ring-2 focus:ring-accent-border"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-text-primary">{user.full_name}</div>
                          <div className="text-sm text-text-tertiary">
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
              <label className="block text-sm font-medium text-text-secondary mb-2">
                选择用户等级
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as any)}
                className="w-full h-11 px-3 rounded-lg border bg-ink-surface text-text-primary border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2 focus:ring-offset-ink"
              >
                <option value="bronze">青铜会员</option>
                <option value="silver">白银会员</option>
                <option value="gold">黄金会员</option>
                <option value="platinum">白金会员</option>
              </select>
              <p className="text-sm text-text-tertiary mt-2">
                注意：此功能需要用户表中有 tier 字段
              </p>
            </div>
          )}

          {/* Distribution Summary */}
          <div className="bg-info-soft border border-border-subtle rounded-lg p-4">
            <div className="font-medium text-text-primary mb-2">分发预览</div>
            <div className="text-sm text-text-secondary">
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
            <div className="text-xs text-text-tertiary mt-2">
              系统将自动跳过已拥有此优惠券的用户
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-ink-elevated border-t border-border-subtle flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            onClick={handleDistribute}
            loading={loading}
            disabled={loading || (distributionType === 'specific' && selectedUserIds.length === 0)}
          >
            确认分发
          </Button>
        </div>
      </div>
    </div>
  );
}
