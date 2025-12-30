/**
 * 邀请卡片组件 (Invite Card Component)
 * 
 * 显示用户的专属邀请码和分享按钮
 */

'use client';

import { useState, useEffect } from 'react';
import { Copy, Share2, Check } from 'lucide-react';
import { getMyReferralCode, generateShareLink, generateShareMessage } from '@/services/referralService';
import toast from 'react-hot-toast';

export default function InviteCard() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralInfo();
  }, []);

  const loadReferralInfo = async () => {
    setLoading(true);

    const { code, error: codeError } = await getMyReferralCode();
    if (codeError) {
      toast.error('获取邀请码失败');
      setLoading(false);
      return;
    }

    const { link, error: linkError } = await generateShareLink();
    if (linkError) {
      toast.error('生成分享链接失败');
      setLoading(false);
      return;
    }

    setReferralCode(code || '');
    setShareLink(link || '');
    setLoading(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('邀请码已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('邀请链接已复制');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleShare = async () => {
    const { message, error } = await generateShareMessage();

    if (error || !message) {
      toast.error('生成分享内容失败');
      return;
    }

    // 检查是否支持 Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: '邀请你体验 LW String Studio',
          text: message,
        });
        toast.success('分享成功');
      } catch (error: any) {
        // 用户取消分享不显示错误
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // 不支持 Web Share API，复制到剪贴板
      try {
        await navigator.clipboard.writeText(message);
        toast.success('分享内容已复制到剪贴板');
      } catch (error) {
        toast.error('复制失败');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-accent/25 via-ink-surface to-ink-elevated rounded-lg p-6 text-text-primary border border-border-subtle">
        <div className="animate-pulse">
          <div className="h-6 bg-ink-elevated rounded w-1/2 mb-4"></div>
          <div className="h-12 bg-ink-elevated rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-accent/25 via-ink-surface to-ink-elevated rounded-lg p-6 text-text-primary border border-border-subtle">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-bold">邀请好友</h2>
      </div>

      {/* 邀请码 */}
      <div className="mb-4">
        <p className="text-sm text-text-tertiary mb-2">你的专属邀请码</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-ink-elevated rounded-lg px-4 py-3 border border-border-subtle">
            <p className="text-2xl font-mono font-bold tracking-wider text-center">
              {referralCode}
            </p>
          </div>
          <button
            onClick={handleCopyCode}
            className="bg-accent text-text-onAccent rounded-lg p-3 transition-colors hover:shadow-glow"
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 奖励说明 */}
      <div className="bg-ink-elevated rounded-lg p-4 mb-4 border border-border-subtle">
        <p className="text-sm font-medium mb-2">🎁 邀请奖励</p>
        <div className="space-y-1 text-sm text-text-secondary">
          <p>• 好友注册：你获得 <span className="font-bold">50 积分</span></p>
          <p>• 好友奖励：获得 <span className="font-bold">20 积分</span></p>
        </div>
      </div>

      {/* 分享按钮 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCopyLink}
          className="bg-ink-elevated hover:bg-ink-surface rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-border-subtle"
        >
          <Copy className="w-4 h-4" />
          复制链接
        </button>
        <button
          onClick={handleShare}
          className="bg-accent text-text-onAccent rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 hover:shadow-glow"
        >
          <Share2 className="w-4 h-4" />
          立即分享
        </button>
      </div>
    </div>
  );
}
