/**
 * EventCarousel Component
 * 首页活动轮播组件
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { EventCard, PromotionEvent, AnnouncementEvent } from '@/components/EventCard';

interface EventCarouselProps {
  className?: string;
}

interface EventsData {
  promotions: PromotionEvent[];
  announcements: AnnouncementEvent[];
}

export const EventCarousel: React.FC<EventCarouselProps> = ({ className = '' }) => {
  const [events, setEvents] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events/active');
        const json = await res.json();

        if (json.ok) {
          setEvents(json.data);
        } else {
          setError(json.error?.message || '加载失败');
        }
      } catch (err) {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // 无活动时不显示
  const hasEvents = events && (events.promotions.length > 0 || events.announcements.length > 0);

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="h-5 w-24 skeleton-pulse rounded" />
          <div className="h-4 w-16 skeleton-pulse rounded" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-56 h-[140px] bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !hasEvents) {
    return null;
  }

  const allEvents = [
    ...events.promotions.map((p) => ({ type: 'promotion' as const, data: p })),
    ...events.announcements.map((a) => ({ type: 'announcement' as const, data: a })),
  ];

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-semibold text-text-primary">
          活动优惠
        </h2>
        <Link
          href="/events"
          className="text-sm text-accent hover:text-accent/80 transition-colors"
        >
          查看全部
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {allEvents.map((event) => (
          <div key={event.data.id} style={{ scrollSnapAlign: 'start' }}>
            {event.type === 'promotion' ? (
              <EventCard
                type="promotion"
                promotion={event.data as PromotionEvent}
                variant="compact"
              />
            ) : (
              <EventCard
                type="announcement"
                announcement={event.data as AnnouncementEvent}
                variant="compact"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCarousel;
