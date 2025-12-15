/**
 * 评价表单组件 (Review Form Component)
 * 
 * 用于提交订单评价
 */

'use client';

import React, { useState } from 'react';
import { submitReview, SubmitReviewParams } from '@/services/review.service';
import StarRating from '@/components/StarRating';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';
import { UploadResult } from '@/services/imageUploadService';
import { useSession } from 'next-auth/react';

interface ReviewFormProps {
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const REVIEW_TAGS = [
  '专业', '快速', '细心', '耐心', '友好',
  '技术好', '价格合理', '环境整洁', '推荐',
];

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
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (comment.trim().length < 10) {
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
      comment: comment.trim(),
      service_rating: serviceRating,
      quality_rating: qualityRating,
      speed_rating: speedRating,
      tags: selectedTags,
      images: imageUrls,
      is_anonymous: isAnonymous,
    };

    const { reviewId, error } = await submitReview(params);

    if (error) {
      setToast({
        show: true,
        message: typeof error === 'string' ? error : (error as any)?.message || '提交评价失败',
        type: 'error',
      });
      setSubmitting(false);
    } else {
      setToast({
        show: true,
        message: '评价成功！已获得 10 积分奖励',
        type: 'success',
      });

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">订单评价</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 总体评分 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            总体评分 <span className="text-red-500">*</span>
          </label>
          <StarRating
            value={rating}
            onChange={setRating}
            size="lg"
            showValue
          />
        </div>

        {/* 详细评分 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700">详细评分</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">服务态度</span>
              <StarRating
                value={serviceRating}
                onChange={setServiceRating}
                size="md"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">穿线质量</span>
              <StarRating
                value={qualityRating}
                onChange={setQualityRating}
                size="md"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">服务速度</span>
              <StarRating
                value={speedRating}
                onChange={setSpeedRating}
                size="md"
              />
            </div>
          </div>
        </div>

        {/* 评价标签 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            选择标签（可选）
          </label>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 评价内容 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            评价内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="分享您的使用体验，帮助其他用户做出选择（至少 10 个字）"
            rows={5}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            {comment.length} / 500 字
          </p>
        </div>

        {/* 图片上传 */}
        <div>
          <ImageUploader
            uploadOptions={{
              bucket: 'reviews',
              folder: user?.id,
              compress: true,
              maxWidth: 1920,
              maxHeight: 1920,
            }}
            maxFiles={5}
            label="上传图片（可选）"
            hint="点击或拖拽上传图片（最多 {max} 张）"
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

        {/* 匿名选项 */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="anonymous" className="text-sm text-slate-700">
            匿名评价
          </label>
        </div>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">温馨提示</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                <li>提交评价后将获得 10 积分奖励</li>
                <li>评价一经提交无法删除，请谨慎填写</li>
                <li>请文明评价，尊重他人</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              fullWidth
              disabled={submitting}
            >
              取消
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={submitting || comment.trim().length < 10}
          >
            {submitting ? '提交中...' : '提交评价'}
          </Button>
        </div>
      </form>

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
