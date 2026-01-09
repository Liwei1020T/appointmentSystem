/**
 * 评价表单组件 (Review Form Component)
 * 
 * 现代化设计，紧凑布局
 * - 动态星级评分与表情反馈
 * - 分组标签选择
 * - 优化的图片上传
 */

'use client';

import React, { useState, useEffect } from 'react';
import { submitReview, SubmitReviewParams, OrderReview } from '@/services/reviewService';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';
import { UploadResult } from '@/services/imageUploadService';
import { useSession } from 'next-auth/react';
import { Star, Check, PartyPopper, Sparkles, PenLine, Camera } from 'lucide-react';

interface ReviewFormProps {
  orderId: string;
  onSuccess?: (review?: OrderReview) => void;
  onCancel?: () => void;
}

// 标签分组
const TAG_GROUPS = {
  '服务': ['专业', '耐心', '友好', '细心'],
  '技术': ['技术好', '快速', '质量高'],
  '环境': ['环境整洁', '价格合理', '推荐'],
};

// 评分表情映射
const RATING_LABELS: Record<number, { label: string; tone: string; dot: string }> = {
  1: { label: '很差', tone: 'text-danger', dot: 'bg-danger' },
  2: { label: '较差', tone: 'text-warning', dot: 'bg-warning' },
  3: { label: '一般', tone: 'text-text-secondary', dot: 'bg-border-subtle' },
  4: { label: '满意', tone: 'text-success', dot: 'bg-success' },
  5: { label: '非常满意', tone: 'text-accent', dot: 'bg-accent' },
};

// 动态星级组件
function AnimatedStarRating({
  value,
  onChange,
  size = 'lg',
  showEmoji = false,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;
  const ratingInfo = RATING_LABELS[displayValue] || RATING_LABELS[5];

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className={`${sizeClasses[size]} transition-all duration-200 hover:scale-125 active:scale-95`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={star <= displayValue ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              className={`w-full h-full transition-all duration-200 ${star <= displayValue ? 'text-warning drop-shadow-[0_2px_4px_rgba(245,158,11,0.4)]' : 'text-border-subtle'
                }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        ))}
      </div>
      {showEmoji && (
        <div className={`flex items-center gap-2 transition-all duration-300 ${ratingInfo.tone}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${ratingInfo.dot}`} />
          <span className="text-sm font-medium">{ratingInfo.label}</span>
        </div>
      )}
    </div>
  );
}

// 紧凑详细评分行
function CompactRatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <AnimatedStarRating value={value} onChange={onChange} size="sm" />
    </div>
  );
}

export default function ReviewForm({ orderId, onSuccess, onCancel }: ReviewFormProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [rating, setRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [speedRating, setSpeedRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });
  const isCommentValid = comment.trim().length >= 10;

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10) {
      setToast({
        show: true,
        message: '评价内容至少需要 10 个字',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);

    const params: SubmitReviewParams = {
      order_id: orderId,
      rating,
      comment: trimmedComment,
      service_rating: serviceRating,
      quality_rating: qualityRating,
      speed_rating: speedRating,
      tags: selectedTags,
      images: imageUrls,
      is_anonymous: isAnonymous,
    };

    const { review, error } = await submitReview(params);

    if (error) {
      setToast({
        show: true,
        message: typeof error === 'string' ? error : (error as any)?.message || '提交评价失败',
        type: 'error',
      });
      setSubmitting(false);
    } else {
      setShowSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(
            review || {
              id: crypto.randomUUID(),
              orderId,
              userId: '',
              rating,
              serviceRating,
              qualityRating,
              speedRating,
              comment: comment.trim(),
              tags: selectedTags,
              imageUrls,
              isAnonymous,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          );
        }
      }, 1500);
    }
  };

  // 成功动画
  if (showSuccess) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-accent/10 to-emerald-50 border-2 border-accent-border">
        <div className="flex justify-center mb-4">
          <PartyPopper className="w-16 h-16 text-success animate-bounce" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">评价成功！</h3>
        <p className="text-text-secondary">感谢您的评价，已获得 10 积分奖励</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white to-accent/10">
      {/* 顶部装饰条 */}
      <div className="h-1.5 bg-gradient-to-r from-gradient-start via-accent to-gradient-end" />

      <div className="p-5">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary font-display">分享您的体验</h2>
            <p className="text-xs text-text-secondary">评价后可获得 10 积分奖励</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 总体评分 - 突出显示 */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-border-subtle">
            <label className="block text-sm font-semibold text-text-secondary mb-3">
              总体评分 <span className="text-accent">*</span>
            </label>
            <AnimatedStarRating
              value={rating}
              onChange={setRating}
              size="lg"
              showEmoji
            />
          </div>

          {/* 详细评分 - 紧凑卡片 */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-border-subtle">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">详细评分</h3>
            <CompactRatingRow label="服务态度" value={serviceRating} onChange={setServiceRating} />
            <CompactRatingRow label="穿线质量" value={qualityRating} onChange={setQualityRating} />
            <CompactRatingRow label="服务速度" value={speedRating} onChange={setSpeedRating} />
          </div>

          {/* 标签选择 - 分组显示 */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-border-subtle">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">选择标签</h3>
            <div className="space-y-3">
              {Object.entries(TAG_GROUPS).map(([group, tags]) => (
                <div key={group}>
                  <p className="text-xs text-text-tertiary mb-1.5">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${selectedTags.includes(tag)
                          ? 'bg-accent text-text-onAccent shadow-sm'
                          : 'bg-ink text-text-secondary hover:bg-accent-soft hover:text-accent'
                          }`}
                      >
                        {selectedTags.includes(tag) && <Check className="w-3 h-3 inline-block mr-1" />}
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 评价内容 - 可折叠 */}
          <details className="bg-white rounded-xl shadow-sm border border-border-subtle group">
            <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-ink/70 transition-colors rounded-xl">
              <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <PenLine className="w-4 h-4" /> 评价内容 <span className="text-text-tertiary font-normal">(至少10字)</span>
                {comment.length > 0 && (
                  <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full">已填写</span>
                )}
              </span>
              <svg className="w-5 h-5 text-text-tertiary transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4">
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="分享您的使用体验，帮助其他用户做出选择..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl focus:ring-2 focus:ring-accent-border focus:border-accent resize-none transition-all duration-200 text-sm"
                />
                <div className="absolute bottom-3 right-3 text-xs text-text-tertiary">
                  {comment.length}/500
                </div>
              </div>
              {comment.length > 0 && comment.length < 10 && (
                <p className="mt-1 text-xs text-text-tertiary">评价内容需要至少 10 个字</p>
              )}
            </div>
          </details>

          {/* 图片上传 - 可折叠 */}
          <details className="bg-white rounded-xl shadow-sm border border-border-subtle group">
            <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-ink/70 transition-colors rounded-xl">
              <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Camera className="w-4 h-4" /> 上传照片 <span className="text-text-tertiary font-normal">(可选)</span>
                {imageUrls.length > 0 && (
                  <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full">{imageUrls.length}张</span>
                )}
              </span>
              <svg className="w-5 h-5 text-text-tertiary transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4">
              <ImageUploader
                uploadOptions={{
                  bucket: 'reviews',
                  folder: user?.id,
                  compress: true,
                  maxWidth: 1920,
                  maxHeight: 1920,
                }}
                maxFiles={5}
                label=""
                hint="点击或拖拽上传 (最多5张)"
                onUploadSuccess={(results: UploadResult[]) => {
                  const urls = results
                    .filter((r) => r.success && r.url)
                    .map((r) => r.url!);
                  setImageUrls((prev) => [...prev, ...urls]);
                }}
                onUploadError={(error: string) => {
                  setToast({
                    show: true,
                    message: error,
                    type: 'error',
                  });
                }}
                onDelete={(index: number) => {
                  setImageUrls((prev) => prev.filter((_, i) => i !== index));
                }}
                existingImages={imageUrls}
              />
            </div>
          </details>


          {/* 匿名选项 */}
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-ink rounded-xl hover:bg-ink/80 transition-colors w-fit">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-accent border-border-subtle rounded focus:ring-accent-border"
            />
            <span className="text-sm text-text-secondary">匿名评价</span>
          </label>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                fullWidth
                disabled={submitting}
                className="rounded-xl"
              >
                取消
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={submitting}
              disabled={submitting || !isCommentValid}
              glow
              className="rounded-xl flex items-center justify-center gap-1.5"
            >
              {submitting ? '提交中...' : <><Sparkles className="w-4 h-4" /> 提交评价</>}
            </Button>
          </div>
        </form>
      </div>

      {/* Toast 通知 */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </Card>
  );
}
