/**
 * 我的优惠券页面 (My Vouchers Page)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Ticket, Clock, CheckCircle2, XCircle, Percent, DollarSign } from 'lucide-react';

type VoucherStatus = 'all' | 'available' | 'used' | 'expired';

interface UserVoucher {
  id: string;
  status: string;
  used_at?: string;
  voucher: {
    code: string;
    name: string;
    discount_type: string;
    discount_value: number;
    min_purchase: number;
    description: string;
  };
  expiry?: string;
  expires_at?: string;
  used?: boolean;
}

export default function MyVouchersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<UserVoucher[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<VoucherStatus>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadVouchers();
  }, [isAuthenticated]);

  const loadVouchers = async () => {
    try {
      // Use the implemented Prisma API (legacy `/api/vouchers/my` is not provided)
      const response = await fetch('/api/user/vouchers');
      const raw = await response.json().catch(() => ({}));
      const data = raw?.data ?? raw;
      
      if (response.ok && Array.isArray(data?.vouchers)) {
        setVouchers(data.vouchers);
        setFilteredVouchers(data.vouchers);
      }
    } catch (error) {
      console.error('Failed to load vouchers:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let filtered = vouchers;
    if (selectedStatus !== 'all') {
      filtered = vouchers.filter((v) => {
        // Backend uses status: 'active' | 'used' | 'expired'
        if (selectedStatus === 'available') return v.status === 'active' || v.status === 'available';
        return v.status === selectedStatus;
      });
    }
    setFilteredVouchers(filtered);
  }, [selectedStatus, vouchers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'available':
        return { label: '可用', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'used':
        return { label: '已使用', color: 'bg-gray-100 text-gray-800', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'expired':
        return { label: '已过期', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: <Ticket className="w-4 h-4" /> };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">我的优惠券</h1>
          <p className="text-gray-600">管理您的优惠券</p>
        </div>

        {/* 筛选器 */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { value: 'all', label: '全部' },
            { value: 'available', label: '可用' },
            { value: 'used', label: '已使用' },
            { value: 'expired', label: '已过期' },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value as VoucherStatus)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedStatus === status.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* 优惠券列表 */}
        {filteredVouchers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无优惠券</h3>
            <p className="text-gray-600 mb-6">使用积分兑换优惠券</p>
            <button
              onClick={() => router.push('/profile/points')}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
              前往兑换
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredVouchers.map((item) => {
              const badge = getStatusBadge(item.status);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                    item.status === 'available'
                      ? 'border-purple-200'
                      : 'border-gray-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 mb-1">
                        {item.voucher.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{item.voucher.description}</p>
                    </div>
                    <Ticket className="w-8 h-8 text-purple-600" />
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {item.voucher.discount_type === 'percentage' ? (
                        <Percent className="w-5 h-5 text-purple-600" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      )}
                      <span className="text-2xl font-bold text-purple-600">
                        {item.voucher.discount_type === 'percentage'
                          ? `${item.voucher.discount_value}% OFF`
                          : `RM ${item.voucher.discount_value} OFF`}
                      </span>
                    </div>
                    {item.voucher.min_purchase > 0 && (
                      <p className="text-sm text-gray-600">
                        最低消费: RM {item.voucher.min_purchase}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        有效期至{' '}
                        {new Date(item.expires_at || item.expiry || Date.now()).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>

                  {(item.status === 'active' || item.status === 'available') && (
                    <button
                      onClick={() => router.push('/booking?voucher=' + item.voucher.code)}
                      className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                    >
                      立即使用
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
