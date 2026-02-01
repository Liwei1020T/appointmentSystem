/**
 * EventCard Component
 * 活动卡片（促销/公告通用）
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';

// 促销类型
export type PromotionType = 'FLASH_SALE' | 'POINTS_BOOST' | 'SPEND_SAVE';
export type DiscountType = 'FIXED' | 'PERCENTAGE';

export interface PromotionEvent {
  id: string;
  name: string;
  type: PromotionType;
  discountType: DiscountType;
  discountValue: string | number;
  minPurchase?: string | number | null;
  startAt: string;
  endAt: string;
}

export interface AnnouncementEvent {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  startAt: string;
  endAt: string;
}

interface EventCardProps {
  type: 'promotion' | 'announcement';
  promotion?: PromotionEvent;
  announcement?: AnnouncementEvent;
  variant?: 'compact' | 'full';
  className?: string;
}

// 促销类型配置
const PROMOTION_CONFIG: Record<PromotionType, { label: string; icon: string; color: string }> = {
  FLASH_SALE: { label: '限时特惠', icon: '🔥', color: 'error' },
  POINTS_BOOST: { label: '积分翻倍', icon: '✨', color: 'warning' },
  SPEND_SAVE: { label: '满减优惠', icon: '💰', color: 'success' },
};

// 计算剩余时间
function getTimeRemaining(endAt: string): string {
  const now = new Date();
  const end = new Date(endAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return '已结束';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `剩余 ${days} 天`;
  if (hours > 0) return `剩余 ${hours} 小时`;
  return '即将结束';
}

// 格式化折扣显示
function formatDiscount(discountType: DiscountType, discountValue: string | number): string {
  const value = typeof discountValue === 'string' ? parseFloat(discountValue) : discountValue;
  if (discountType === 'PERCENTAGE') {
    return `${value}% OFF`;
  }
  return `RM${value} OFF`;
}

export const EventCard: React.FC<EventCardProps> = ({
  type,
  promotion,
  announcement,
  variant = 'full',
  className = '',
}) => {
  // 促销卡片
  if (type === 'promotion' && promotion) {
    const config = PROMOTION_CONFIG[promotion.type];
    const timeRemaining = getTimeRemaining(promotion.endAt);
    const isEnded = timeRemaining === '已结束';

    if (variant === 'compact') {
      return (
        <div
          className={`
            flex-shrink-0 w-56 min-h-[140px] p-3 rounded-xl
            bg-white
            border border-border-subtle
            shadow-sm flex flex-col
            ${className}
          `}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">{config.icon}</span>
            <Badge variant={config.color as any} size="sm">
              {config.label}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-0.5 line-clamp-1">
            {promotion.name}
          </h3>
          <p className="text-base font-bold text-accent mb-1.5">
            {formatDiscount(promotion.discountType, promotion.discountValue)}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs text-text-tertiary">
              {isEnded ? '已结束' : timeRemaining}
            </span>
            {!isEnded && (
              <Link href="/booking">
                <Button size="sm" variant="primary" className="!h-7 !px-2 !text-xs">
                  立即预约
                </Button>
              </Link>
            )}
          </div>
        </div>
      );
    }

    // 完整卡片
    return (
      <Card className={`${className}`} padding="md">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <Badge variant={config.color as any}>{config.label}</Badge>
          </div>
          <Badge variant={isEnded ? 'neutral' : 'info'} size="sm">
            {timeRemaining}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {promotion.name}
        </h3>
        <p className="text-2xl font-bold text-accent mb-3">
          {formatDiscount(promotion.discountType, promotion.discountValue)}
        </p>
        {promotion.minPurchase && Number(promotion.minPurchase) > 0 && (
          <p className="text-sm text-text-secondary mb-3">
            消费满 RM{promotion.minPurchase} 可享
          </p>
        )}
        {!isEnded && (
          <Link href="/booking" className="block">
            <Button fullWidth variant="primary">
              立即预约
            </Button>
          </Link>
        )}
      </Card>
    );
  }

  // 公告卡片
  if (type === 'announcement' && announcement) {
    const timeRemaining = getTimeRemaining(announcement.endAt);
    const isEnded = timeRemaining === '已结束';

    if (variant === 'compact') {
      return (
        <div
          className={`
            flex-shrink-0 w-56 min-h-[140px] p-3 rounded-xl
            bg-white
            border border-border-subtle
            shadow-sm flex flex-col
            ${className}
          `}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">📢</span>
            <Badge variant="info" size="sm">
              公告
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-0.5 line-clamp-1">
            {announcement.title}
          </h3>
          <p className="text-xs text-text-secondary line-clamp-2 flex-1">
            {announcement.content}
          </p>
          <div className="flex items-center justify-between mt-auto pt-1.5">
            <span className="text-xs text-text-tertiary">
              {isEnded ? '已结束' : timeRemaining}
            </span>
            {announcement.linkUrl && announcement.linkText && !isEnded && (
              <Link href={announcement.linkUrl}>
                <Button size="sm" variant="secondary" className="!h-7 !px-2 !text-xs">
                  {announcement.linkText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      );
    }

    // 完整卡片
    return (
      <Card className={`${className}`} padding="md">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <Badge variant="info">公告</Badge>
          </div>
          <Badge variant={isEnded ? 'neutral' : 'info'} size="sm">
            {timeRemaining}
          </Badge>
        </div>
        {announcement.imageUrl && (
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="w-full h-40 object-cover rounded-xl mb-3"
          />
        )}
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {announcement.title}
        </h3>
        <p className="text-sm text-text-secondary whitespace-pre-wrap mb-3">
          {announcement.content}
        </p>
        {announcement.linkUrl && announcement.linkText && !isEnded && (
          <Link href={announcement.linkUrl} className="block">
            <Button fullWidth variant="secondary">
              {announcement.linkText}
            </Button>
          </Link>
        )}
      </Card>
    );
  }

  return null;
};

export default EventCard;
