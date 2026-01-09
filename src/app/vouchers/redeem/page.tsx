/**
 * 优惠券兑换页面路由 (Voucher Redemption Page Route)
 * 路径: /vouchers/redeem
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components';

export default function VoucherRedeem() {
  const router = useRouter();
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className={`
        max-w-md w-full transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">功能维护中</h1>
          <p className="text-text-secondary">
            优惠券兑换功能正在升级维护。
            <br />
            请前往个人中心查看您的优惠券。
          </p>
          <div className="pt-4">
            <Button 
              variant="primary" 
              fullWidth 
              onClick={() => router.push('/profile')}
            >
              返回个人中心
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
