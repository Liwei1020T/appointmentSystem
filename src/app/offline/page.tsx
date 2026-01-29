/**
 * 离线页面 (Offline Page)
 *
 * 当用户处于离线状态且请求的页面未缓存时显示
 */

'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-ink dark:bg-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 图标 */}
        <div className="w-24 h-24 mx-auto bg-accent-soft dark:bg-gray-800 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-accent" />
        </div>

        {/* 标题 */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary dark:text-gray-100">
            您当前处于离线状态
          </h1>
          <p className="text-text-secondary dark:text-gray-400">
            请检查您的网络连接后重试
          </p>
        </div>

        {/* 提示 */}
        <div className="bg-white dark:bg-dark-elevated rounded-xl border border-border-subtle dark:border-gray-700 p-4 text-left space-y-3">
          <p className="text-sm text-text-secondary dark:text-gray-400">
            您可以尝试：
          </p>
          <ul className="text-sm text-text-secondary dark:text-gray-400 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              检查 WiFi 或移动数据连接
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              关闭飞行模式
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              重启路由器或切换网络
            </li>
          </ul>
        </div>

        {/* 重试按钮 */}
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          重试
        </button>

        {/* 品牌信息 */}
        <p className="text-xs text-text-tertiary dark:text-gray-500">
          LW String Studio
        </p>
      </div>
    </div>
  );
}
