'use client';

/**
 * 全局错误边界 (Root Layout Error Boundary)
 *
 * 捕获 Root Layout 中的错误
 * 这是 Next.js App Router 的根级错误边界
 */

import { AlertCircle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* 错误图标 */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>

            {/* 错误标题 */}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              系统出现错误
            </h1>

            {/* 错误描述 */}
            <p className="text-gray-600 mb-6">
              抱歉，系统发生了严重错误。请刷新页面重试。
            </p>

            {/* 重试按钮 */}
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新页面
            </button>

            {/* 错误 ID */}
            {error.digest && (
              <p className="text-xs text-gray-400 mt-4">
                错误 ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
