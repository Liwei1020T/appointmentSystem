/**
 * 活动中心页面 (Events Center Page)
 *
 * 功能：
 * - 显示当前促销活动（FLASH_SALE、POINTS_BOOST、SPEND_SAVE）
 * - 显示公告通知
 * - 历史活动归档
 * - 优惠券兑换入口
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EventCard, PromotionEvent, AnnouncementEvent, PromotionType } from '@/components/EventCard';

interface EventsData {
  promotions: PromotionEvent[];
  announcements: AnnouncementEvent[];
}

interface HistoryData {
  promotions: PromotionEvent[];
  announcements: AnnouncementEvent[];
}

// 促销分类配置
const PROMOTION_SECTIONS: { type: PromotionType; title: string; icon: string }[] = [
  { type: 'FLASH_SALE', title: '限时优惠', icon: '🔥' },
  { type: 'POINTS_BOOST', title: '积分翻倍', icon: '✨' },
  { type: 'SPEND_SAVE', title: '满减活动', icon: '💰' },
];

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active');
  const [activeEvents, setActiveEvents] = useState<EventsData | null>(null);
  const [historyEvents, setHistoryEvents] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'ended' && !historyEvents) {
      fetchHistoryEvents();
    }
  }, [activeTab, historyEvents]);

  const fetchActiveEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events/active');
      const json = await res.json();

      if (json.ok) {
        setActiveEvents(json.data);
      } else {
        setError(json.error?.message || '加载失败');
      }
    } catch (_err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryEvents = async () => {
    try {
      const res = await fetch('/api/events/history');
      const json = await res.json();

      if (json.ok) {
        setHistoryEvents(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const renderActiveContent = () => {
    if (!activeEvents) return null;

    const hasPromotions = activeEvents.promotions.length > 0;
    const hasAnnouncements = activeEvents.announcements.length > 0;

    if (!hasPromotions && !hasAnnouncements) {
      return (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-text-secondary">
            暂无进行中的活动
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-8">
        {/* 按类型分组显示促销 */}
        {PROMOTION_SECTIONS.map((section) => {
          const promotions = activeEvents.promotions.filter(
            (p) => p.type === section.type
          );
          if (promotions.length === 0) return null;

          return (
            <div key={section.type}>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
                <span>{section.icon}</span>
                {section.title}
              </h2>
              <div className="space-y-4">
                {promotions.map((promotion) => (
                  <EventCard
                    key={promotion.id}
                    type="promotion"
                    promotion={promotion}
                    variant="full"
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* 公告通知 */}
        {hasAnnouncements && (
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
              <span>📢</span>
              公告通知
            </h2>
            <div className="space-y-4">
              {activeEvents.announcements.map((announcement) => (
                <EventCard
                  key={announcement.id}
                  type="announcement"
                  announcement={announcement}
                  variant="full"
                />
              ))}
            </div>
          </div>
        )}

        {/* 优惠券兑换入口 */}
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
            <span>🎟️</span>
            优惠券兑换
          </h2>
          <Card className="flex items-center justify-between" padding="md">
            <div>
              <p className="font-medium text-text-primary">
                用积分兑换优惠券
              </p>
              <p className="text-sm text-text-secondary">
                多种优惠券等你来换
              </p>
            </div>
            <Link href="/vouchers/exchange">
              <Button variant="secondary" size="sm">
                前往兑换
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  };

  const renderHistoryContent = () => {
    if (!historyEvents) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        </div>
      );
    }

    const hasPromotions = historyEvents.promotions.length > 0;
    const hasAnnouncements = historyEvents.announcements.length > 0;

    if (!hasPromotions && !hasAnnouncements) {
      return (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-text-secondary">
            暂无历史活动
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {historyEvents.promotions.map((promotion) => (
          <EventCard
            key={promotion.id}
            type="promotion"
            promotion={promotion}
            variant="full"
          />
        ))}
        {historyEvents.announcements.map((announcement) => (
          <EventCard
            key={announcement.id}
            type="announcement"
            announcement={announcement}
            variant="full"
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink pb-24">
        <PageHeader title="活动中心" />
        <div className="max-w-2xl mx-auto px-5 py-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-gray-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ink pb-24">
        <PageHeader title="活动中心" />
        <div className="max-w-2xl mx-auto px-5 py-6">
          <Card className="text-center py-12">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-text-secondary mb-4">
              {error}
            </p>
            <Button variant="secondary" onClick={fetchActiveEvents}>
              重试
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pb-24">
      <PageHeader title="活动中心" />

      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* Tab 切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                activeTab === 'active'
                  ? 'bg-accent text-white'
                  : 'bg-white text-text-secondary border border-border-subtle'
              }
            `}
          >
            进行中
          </button>
          <button
            onClick={() => setActiveTab('ended')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                activeTab === 'ended'
                  ? 'bg-accent text-white'
                  : 'bg-white text-text-secondary border border-border-subtle'
              }
            `}
          >
            已结束
          </button>
        </div>

        {/* 内容区 */}
        {activeTab === 'active' ? renderActiveContent() : renderHistoryContent()}
      </div>
    </div>
  );
}
