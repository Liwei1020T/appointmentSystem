/**
 * 我的优惠券页面组件 (My Vouchers Page Component)
 * 
 * 功能：
 * - 可用/已用优惠券标签切换
 * - 显示优惠券卡片（折扣信息、过期时间、使用条件）
 * - 复制优惠券代码功能
 * - 过期警告（7天内）
 * - 使用说明
 * - 空状态引导
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserVouchers, type UserVoucherWithVoucher } from '@/services/voucherService';
import type { UserVoucher } from '@/types';

type TabType = 'available' | 'used';

type UserVoucherWithDetails = UserVoucher & {
  voucher?: {
    id: string;
    code: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    name?: string | null;
    min_purchase?: number | null;
    max_discount?: number | null;
    description?: string | null;
  };
  used?: boolean;
  expires_at?: string | null;
};

export default function MyVouchersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('available');
  const [vouchers, setVouchers] = useState<UserVoucherWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    setError(null);

    try {
      const status = tab === 'available' ? 'active' : 'used';
      const { vouchers: userVouchers, error: voucherError } = await getUserVouchers(status);
      
      if (voucherError || !userVouchers) {
        setError(voucherError || '加载优惠券失败');
        setLoading(false);
        return;
      }
      
      // Transform UserVoucherWithVoucher to UserVoucherWithDetails
      const transformed: UserVoucherWithDetails[] = userVouchers.map((uv) => {
        const voucherStatus = (uv.status === 'active' || uv.status === 'used' || uv.status === 'expired') 
          ? uv.status 
          : 'active' as const;
        const expiryStr = uv.expiry instanceof Date ? uv.expiry.toISOString() : String(uv.expiry);
        const createdStr = uv.createdAt instanceof Date ? uv.createdAt.toISOString() : String(uv.createdAt || new Date());
        return {
          id: uv.id,
          user_id: uv.userId,
          voucher_id: uv.voucherId,
          status: voucherStatus,
          used_at: uv.usedAt instanceof Date ? uv.usedAt.toISOString() : uv.usedAt ? String(uv.usedAt) : undefined,
          order_id: uv.orderId || undefined,
          expiry: expiryStr,
          created_at: createdStr,
          expires_at: expiryStr,
          used: uv.usedAt != null,
          voucher: uv.voucher ? {
            id: uv.voucher.id,
            code: uv.voucher.code,
            discount_type: (uv.voucher.type === 'percentage' || uv.voucher.type === 'PERCENTAGE' || uv.voucher.type === 'percentage_off') ? 'percentage' as const : 'fixed' as const,
            discount_value: Number(uv.voucher.value || 0),
            name: uv.voucher.name,
            min_purchase: Number(uv.voucher.minPurchase || 0),
            max_discount: null,
            description: null,
          } : undefined,
        };
      });
      setVouchers(transformed);
    } catch (err: any) {
      setError(err.message || '加载失败');
    }

    setLoading(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountDisplay = (voucher: UserVoucherWithDetails) => {
    if (!voucher.voucher) return '';
    
    if (voucher.voucher.discount_type === 'fixed') {
      return `RM ${voucher.voucher.discount_value.toFixed(2)}`;
    } else {
      return `${voucher.voucher.discount_value}%`;
    }
  };

  const isExpiringSoon = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffInDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7 && diffInDays > 0;
  };

  const formatExpiryDate = (expiresAt?: string | null) => {
    if (!expiresAt) return '无期限';
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffInDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      return '已过期';
    } else if (diffInDays === 0) {
      return '今天到期';
    } else if (diffInDays === 1) {
      return '明天到期';
    } else if (diffInDays <= 7) {
      return `${diffInDays} 天后到期`;
    } else {
      return expiryDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  const availableVouchers = vouchers.filter((v) => {
    if (v.used) return false;
    if (!v.expires_at) return true;
    return new Date(v.expires_at) > new Date();
  });

  const usedVouchers = vouchers.filter((v) => v.used);

  const displayVouchers = tab === 'available' ? availableVouchers : usedVouchers;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">我的优惠券</h1>
        </div>

        {/* 标签切换 */}
        <div className="flex border-t">
          <button
            onClick={() => setTab('available')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              tab === 'available'
                ? 'text-purple-600'
                : 'text-gray-600'
            }`}
          >
            可用 ({availableVouchers.length})
            {tab === 'available' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
            )}
          </button>
          <button
            onClick={() => setTab('used')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              tab === 'used'
                ? 'text-purple-600'
                : 'text-gray-600'
            }`}
          >
            已用 ({usedVouchers.length})
            {tab === 'used' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* 优惠券列表 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : displayVouchers.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">
              {tab === 'available' ? '🎁' : '📋'}
            </div>
            <p className="text-gray-600 mb-2">
              {tab === 'available' ? '暂无可用优惠券' : '暂无使用记录'}
            </p>
            {tab === 'available' && (
              <button
                onClick={() => router.push('/vouchers/redeem')}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                去兑换
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayVouchers.map((userVoucher) => {
              const voucher = userVoucher.voucher;
              if (!voucher) return null;

              const expiringSoon = isExpiringSoon(userVoucher.expires_at);

              return (
                <div
                  key={userVoucher.id}
                  className={`bg-white rounded-xl overflow-hidden shadow-sm border-2 ${
                    tab === 'used'
                      ? 'border-gray-200 opacity-60'
                      : expiringSoon
                      ? 'border-orange-200'
                      : 'border-purple-200'
                  }`}
                >
                  {/* 过期警告横幅 */}
                  {expiringSoon && (
                    <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2">
                      <span className="text-orange-600 text-sm">⚠️</span>
                      <span className="text-xs text-orange-700 font-medium">
                        即将过期，请尽快使用
                      </span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* 折扣标签 */}
                      <div
                        className={`rounded-xl p-4 text-white min-w-[80px] text-center ${
                          tab === 'used'
                            ? 'bg-gray-400'
                            : 'bg-gradient-to-br from-purple-500 to-purple-700'
                        }`}
                      >
                        <div className="text-xs opacity-90 mb-1">立减</div>
                        <div className="text-xl font-bold">
                          {getDiscountDisplay(userVoucher)}
                        </div>
                      </div>

                      {/* 优惠券详情 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {voucher.name}
                        </h3>
                        {voucher.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {voucher.description}
                          </p>
                        )}

                        {/* 使用条件 */}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                          {voucher.min_purchase && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              满 RM {voucher.min_purchase}
                            </span>
                          )}
                          {voucher.max_discount && voucher.discount_type === 'percentage' && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              最高减 RM {voucher.max_discount}
                            </span>
                          )}
                        </div>

                        {/* 优惠券代码 + 过期时间 */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-600">优惠码</div>
                            <button
                              onClick={() => handleCopyCode(voucher.code)}
                              disabled={tab === 'used'}
                              className={`text-xs font-medium transition-colors ${
                                tab === 'used'
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : copiedCode === voucher.code
                                  ? 'text-green-600'
                                  : 'text-purple-600 hover:text-purple-700'
                              }`}
                            >
                              {copiedCode === voucher.code ? '已复制 ✓' : '复制'}
                            </button>
                          </div>
                          <div className="font-mono font-bold text-lg text-gray-900 tracking-wider">
                            {voucher.code}
                          </div>
                        </div>

                        {/* 过期时间 */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">有效期至:</span>
                          <span
                            className={`font-medium ${
                              expiringSoon ? 'text-orange-600' : 'text-gray-700'
                            }`}
                          >
                            {formatExpiryDate(userVoucher.expires_at)}
                          </span>
                        </div>

                        {/* 已使用标记 */}
                        {userVoucher.used && userVoucher.used_at && (
                          <div className="mt-2 text-xs text-gray-500">
                            已于 {new Date(userVoucher.used_at).toLocaleDateString('zh-CN')} 使用
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 使用说明 */}
      {!loading && !error && displayVouchers.length > 0 && tab === 'available' && (
        <div className="px-4 mt-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-xl">💡</div>
              <div className="flex-1 text-sm">
                <p className="text-blue-900 font-medium mb-1">使用说明</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• 在预订页面选择优惠券即可使用</li>
                  <li>• 部分优惠券有最低消费要求</li>
                  <li>• 优惠券过期后将自动失效</li>
                  <li>• 每个订单只能使用一张优惠券</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
