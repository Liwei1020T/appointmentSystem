/**
 * FirstOrderModal - 首单优惠弹窗
 *
 * 新用户首次访问时显示，介绍首单优惠活动
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Gift, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components';

interface FirstOrderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  discount?: string;
  originalPrice?: string;
  discountPrice?: string;
}

const STORAGE_KEY = 'first_order_modal_dismissed';

export default function FirstOrderModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  discount = '首单立减 RM10',
  originalPrice = 'RM 28',
  discountPrice = 'RM 18',
}: FirstOrderModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 检查是否应该显示弹窗
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
      if (controlledIsOpen) {
        setIsAnimating(true);
      }
      return;
    }

    // 检查 localStorage
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // 延迟显示，让页面先加载完成
      const timer = setTimeout(() => {
        setIsOpen(true);
        setIsAnimating(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [controlledIsOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
      localStorage.setItem(STORAGE_KEY, 'true');
      controlledOnClose?.();
    }, 300);
  };

  const handleAction = () => {
    handleClose();
    router.push('/booking');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* 弹窗内容 */}
      <div
        className={`relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-text-secondary hover:text-text-primary transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 顶部装饰背景 */}
        <div className="relative h-36 bg-gradient-to-br from-accent to-accent-alt overflow-hidden">
          {/* 装饰元素 */}
          <div className="absolute inset-0">
            <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-4 right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <Sparkles className="absolute top-6 right-16 w-6 h-6 text-white/40" />
            <Sparkles className="absolute bottom-8 left-12 w-4 h-4 text-white/30" />
          </div>

          {/* 礼物图标 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-bounce-slow">
              <Gift className="w-10 h-10 text-accent" />
            </div>
          </div>

          {/* 底部波浪 */}
          <svg
            className="absolute bottom-0 left-0 right-0 text-white"
            viewBox="0 0 400 30"
            preserveAspectRatio="none"
          >
            <path
              d="M0 30 Q100 0 200 15 T400 30 L400 30 L0 30 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* 内容区域 */}
        <div className="px-6 pb-6 pt-2 text-center">
          {/* 标题 */}
          <h2 className="text-xl font-bold text-text-primary mb-2">
            新用户专属优惠
          </h2>
          <p className="text-text-secondary text-sm mb-4">
            首次穿线体验价，感受专业服务
          </p>

          {/* 价格展示 */}
          <div className="bg-accent-soft rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-text-tertiary line-through text-lg">
                {originalPrice}
              </span>
              <span className="text-3xl font-bold text-accent">
                {discountPrice}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 bg-accent text-white text-sm font-medium px-3 py-1 rounded-full">
              <Sparkles className="w-4 h-4" />
              {discount}
            </div>
          </div>

          {/* 优惠说明 */}
          <ul className="text-left text-sm text-text-secondary space-y-2 mb-6">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center flex-shrink-0 mt-0.5">
                ✓
              </span>
              <span>仅限新用户首次使用</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center flex-shrink-0 mt-0.5">
                ✓
              </span>
              <span>注册后自动发放优惠券</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center flex-shrink-0 mt-0.5">
                ✓
              </span>
              <span>30 天内有效</span>
            </li>
          </ul>

          {/* 行动按钮 */}
          <Button
            variant="primary"
            size="lg"
            className="w-full group"
            onClick={handleAction}
          >
            <span>立即预约</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          {/* 稍后再说 */}
          <button
            onClick={handleClose}
            className="mt-3 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}
