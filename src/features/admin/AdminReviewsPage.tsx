/**
 * 管理员评价管理页面 (Admin Reviews Management Page)
 * 
 * 功能：
 * - 查看所有订单评价
 * - 筛选和搜索评价
 * - 回复客户评价
 * - 查看评价统计数据
 * - 导出评价报表
 */

'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Spinner from '@/components/Spinner';
import Button from '@/components/Button';
import StarRating from '@/components/StarRating';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import { getAdminReviewStats, getAdminReviews, replyReview } from '@/services/reviewService';
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Award,
  Search,
  Filter,
  Download,
  Reply
} from 'lucide-react';

interface Review {
  id: string;
  order_id: string;
  user_id: string;
  rating: number;
  service_rating: number;
  quality_rating: number;
  speed_rating: number;
  comment: string;
  tags: string[];
  images: string[];
  is_anonymous: boolean;
  helpful_count: number;
  admin_reply: string | null;
  admin_reply_at: string | null;
  admin_reply_by: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    order_number: string;
    final_price: number;
    string?: {
      brand: string;
      model: string;
    };
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_5: number;
  rating_4: number;
  rating_3: number;
  rating_2: number;
  rating_1: number;
  avg_service: number;
  avg_quality: number;
  avg_speed: number;
}

type FilterRating = 'all' | '5' | '4' | '3' | '2' | '1';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [showReplyModal, setShowReplyModal] = useState<boolean>(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // 加载评价列表
  const loadReviews = async () => {
    setLoading(true);

    try {
      const list = await getAdminReviews();
      setReviews(list);
      setFilteredReviews(list);
    } catch (error) {
      setToast({
        show: true,
        message: '加载评价列表失败',
        type: 'error',
      });
    }

    setLoading(false);
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const payload = await getAdminReviewStats();
      setStats(payload || null);
    } catch (error) {
      console.error('Failed to load review stats:', error);
    }
  };

  useEffect(() => {
    loadReviews();
    loadStats();
  }, []);

  // 筛选评价
  useEffect(() => {
    let filtered = reviews;

    // 按评分筛选
    if (filterRating !== 'all') {
      const rating = parseInt(filterRating);
      filtered = filtered.filter((r) => r.rating === rating);
    }

    // 按关键词搜索
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.comment.toLowerCase().includes(query) ||
          r.user?.full_name?.toLowerCase().includes(query) ||
          r.order?.order_number?.toLowerCase().includes(query) ||
          r.order?.string?.brand?.toLowerCase().includes(query) ||
          r.order?.string?.model?.toLowerCase().includes(query)
      );
    }

    setFilteredReviews(filtered);
  }, [searchQuery, filterRating, reviews]);

  // 打开回复弹窗
  const handleOpenReply = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.admin_reply || '');
    setShowReplyModal(true);
  };

  // 提交回复
  const handleSubmitReply = async () => {
    if (!selectedReview || replyText.trim().length < 5) {
      setToast({
        show: true,
        message: '回复内容至少需要 5 个字',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);

    try {
      await replyReview(selectedReview.id, replyText.trim());

      setToast({
        show: true,
        message: '回复成功',
        type: 'success',
      });

      setShowReplyModal(false);
      loadReviews();
    } catch (error) {
      setToast({
        show: true,
        message: '回复失败',
        type: 'error',
      });
    }

    setSubmitting(false);
  };

  // 导出评价数据
  const handleExport = () => {
    const csv = [
      ['订单号', '用户', '评分', '服务', '质量', '速度', '评价内容', '标签', '时间', '管理员回复'].join(','),
      ...filteredReviews.map((r) =>
        [
          r.order?.order_number || '',
          r.is_anonymous ? '匿名用户' : r.user?.full_name || '',
          r.rating,
          r.service_rating,
          r.quality_rating,
          r.speed_rating,
          `"${r.comment.replace(/"/g, '""')}"`,
          `"${r.tags.join(', ')}"`,
          formatDate(r.created_at),
          r.admin_reply ? `"${r.admin_reply.replace(/"/g, '""')}"` : '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reviews_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">评价管理</h1>
          <p className="mt-1 text-sm text-text-secondary">
            管理客户评价并及时回复
          </p>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-info-soft rounded-lg">
                  <MessageSquare className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">总评价数</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats.total_reviews}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning/15 rounded-lg">
                  <Star className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">平均评分</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats.average_rating.toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success/15 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">好评率</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats.total_reviews > 0
                      ? (((stats.rating_5 + stats.rating_4) / stats.total_reviews) * 100).toFixed(0)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/15 rounded-lg">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">5星评价</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats.rating_5}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 评分分布 */}
        {stats && stats.total_reviews > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              评分分布
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = (stats as any)[`rating_${rating}`];
                const percentage =
                  stats.total_reviews > 0
                    ? (count / stats.total_reviews) * 100
                    : 0;

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="w-12 text-sm text-text-secondary flex items-center gap-1">
                      {rating} <Star className="w-3 h-3 fill-warning text-warning" />
                    </div>
                    <div className="flex-1 bg-ink-elevated rounded-full h-2">
                      <div
                        className="bg-warning h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-sm text-text-secondary text-right">
                      {count} ({percentage.toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 搜索和筛选 */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索评价、用户、订单号..."
                className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border focus:border-transparent"
              />
            </div>

            {/* 评分筛选 */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-text-tertiary" />
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value as FilterRating)}
                className="px-4 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border focus:border-transparent"
              >
                <option value="all">所有评分</option>
                <option value="5">5星</option>
                <option value="4">4星</option>
                <option value="3">3星</option>
                <option value="2">2星</option>
                <option value="1">1星</option>
              </select>
            </div>

            {/* 导出按钮 */}
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={filteredReviews.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              导出 CSV
            </Button>
          </div>
        </Card>

        {/* 评价列表 */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">
                {searchQuery || filterRating !== 'all'
                  ? '没有找到匹配的评价'
                  : '暂无评价'}
              </p>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-accent/15 rounded-full flex items-center justify-center">
                        <span className="text-accent font-semibold">
                          {review.is_anonymous
                            ? '?'
                            : (review.user?.full_name?.[0] || 'U')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {review.is_anonymous ? '匿名用户' : review.user?.full_name}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <StarRating value={review.rating} readonly size="sm" />
                      <span className="text-sm text-text-secondary">
                        订单 #{review.order?.order_number}
                      </span>
                    </div>

                    {review.order?.string && (
                      <p className="text-sm text-text-secondary mb-3">
                        {review.order.string.brand} {review.order.string.model}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenReply(review)}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    {review.admin_reply ? '编辑回复' : '回复'}
                  </Button>
                </div>

                {/* 详细评分 */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-ink-elevated rounded-lg border border-border-subtle">
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">服务态度</p>
                    <StarRating value={review.service_rating} readonly size="xs" />
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">穿线质量</p>
                    <StarRating value={review.quality_rating} readonly size="xs" />
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">服务速度</p>
                    <StarRating value={review.speed_rating} readonly size="xs" />
                  </div>
                </div>

                {/* 评价内容 */}
                <p className="text-text-secondary mb-3">{review.comment}</p>

                {/* 标签 */}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {review.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-info-soft text-info text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 管理员回复 */}
                {review.admin_reply && (
                  <div className="mt-4 p-4 bg-warning/15 border-l-4 border-warning rounded">
                    <p className="text-xs text-warning font-medium mb-1">
                      管理员回复
                    </p>
                    <p className="text-sm text-text-secondary">{review.admin_reply}</p>
                    <p className="text-xs text-text-tertiary mt-2">
                      {formatDate(review.admin_reply_at!)}
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 回复弹窗 */}
      <Modal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        title={selectedReview?.admin_reply ? '编辑回复' : '回复评价'}
      >
        <div className="space-y-4">
          {selectedReview && (
            <>
              <div className="p-4 bg-ink-elevated rounded-lg border border-border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating value={selectedReview.rating} readonly size="sm" />
                  <span className="text-sm text-text-secondary">
                    {selectedReview.is_anonymous
                      ? '匿名用户'
                      : selectedReview.user?.full_name}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{selectedReview.comment}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  回复内容
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="输入您的回复..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowReplyModal(false)}
                  fullWidth
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmitReply}
                  fullWidth
                  disabled={submitting || replyText.trim().length < 5}
                >
                  {submitting ? '提交中...' : '提交回复'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Toast 通知 */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
