'use client';

/**
 * 全局错误边界 (Global Error Boundary)
 *
 * 捕获所有未处理的客户端错误，防止应用白屏
 * Next.js 14 App Router 自动将此组件用作错误边界
 */

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 在生产环境，这里应该发送到错误监控服务 (如 Sentry)
    console.error('Uncaught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-border-subtle shadow-lg p-8 text-center">
          {/* 错误图标 */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-danger/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-danger" />
          </div>

          {/* 错误标题 */}
          <h1 className="text-xl font-bold text-text-primary mb-2">
            页面出现错误
          </h1>

          {/* 错误描述 */}
          <p className="text-text-secondary mb-6">
            抱歉，页面加载时发生了错误。请尝试刷新页面或返回首页。
          </p>

          {/* 错误详情 (仅开发环境显示) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-ink rounded-xl text-left">
              <p className="text-xs font-mono text-danger break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-text-tertiary mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-ink hover:bg-ink-elevated text-text-secondary rounded-xl font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              首页
            </Link>
          </div>
        </div>

        {/* 帮助提示 */}
        <p className="text-center text-xs text-text-tertiary mt-4">
          如果问题持续，请联系客服
        </p>
      </div>
    </div>
  );
}
