/**
 * EmptyState 组件 - 可爱风格空状态插画
 *
 * 用于各种空数据场景，提供友好的视觉反馈和行动引导
 */

'use client';

import React from 'react';
import { Button } from '@/components';

// 空状态类型
export type EmptyStateType =
  | 'no-orders'
  | 'no-reviews'
  | 'no-vouchers'
  | 'no-packages'
  | 'no-notifications'
  | 'no-points'
  | 'no-referrals'
  | 'no-inventory'
  | 'no-users'
  | 'no-payments'
  | 'no-data'
  | 'search-empty'
  | 'error';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// 默认配置
const defaultConfig: Record<EmptyStateType, { title: string; description: string }> = {
  'no-orders': {
    title: '还没有订单',
    description: '预约你的第一次穿线服务吧',
  },
  'no-reviews': {
    title: '暂无评价',
    description: '完成订单后可以分享你的体验',
  },
  'no-vouchers': {
    title: '暂无优惠券',
    description: '使用积分兑换优惠券，下单更划算',
  },
  'no-packages': {
    title: '暂无套餐',
    description: '购买套餐享受更多优惠',
  },
  'no-notifications': {
    title: '暂无通知',
    description: '有新消息时会第一时间通知你',
  },
  'no-points': {
    title: '暂无积分记录',
    description: '消费即可累积积分',
  },
  'no-referrals': {
    title: '暂无推荐记录',
    description: '邀请好友一起享受优质服务',
  },
  'no-inventory': {
    title: '暂无库存数据',
    description: '添加球线开始管理库存',
  },
  'no-users': {
    title: '暂无用户',
    description: '等待第一位用户注册',
  },
  'no-payments': {
    title: '暂无待审核支付',
    description: '所有支付都已处理完毕',
  },
  'no-data': {
    title: '暂无数据',
    description: '数据正在路上',
  },
  'search-empty': {
    title: '未找到结果',
    description: '试试其他搜索词',
  },
  'error': {
    title: '出错了',
    description: '请稍后重试',
  },
};

// 可爱风格 SVG 插画
const illustrations: Record<EmptyStateType, React.FC<{ size: number }>> = {
  'no-orders': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 羽毛球拍 */}
      <ellipse cx="60" cy="65" rx="35" ry="40" fill="#E8F5E9" />
      <ellipse cx="60" cy="65" rx="28" ry="33" fill="#C8E6C9" />
      {/* 拍面网格 */}
      <path d="M35 50 L85 50 M35 60 L85 60 M35 70 L85 70 M35 80 L85 80" stroke="#81C784" strokeWidth="1.5" />
      <path d="M45 35 L45 95 M55 30 L55 100 M65 30 L65 100 M75 35 L75 95" stroke="#81C784" strokeWidth="1.5" />
      {/* 拍柄 */}
      <rect x="54" y="100" width="12" height="15" rx="2" fill="#8D6E63" />
      <rect x="52" y="112" width="16" height="5" rx="2" fill="#6D4C41" />
      {/* 可爱表情 */}
      <circle cx="50" cy="60" r="3" fill="#4CAF50" />
      <circle cx="70" cy="60" r="3" fill="#4CAF50" />
      <path d="M50 72 Q60 80 70 72" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* 问号 */}
      <text x="90" y="35" fontSize="20" fill="#9E9E9E">?</text>
    </svg>
  ),

  'no-reviews': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 对话气泡 */}
      <path d="M20 30 L100 30 Q105 30 105 35 L105 75 Q105 80 100 80 L65 80 L55 95 L55 80 L25 80 Q20 80 20 75 L20 35 Q20 30 25 30 Z" fill="#E8F5E9" stroke="#81C784" strokeWidth="2" />
      {/* 星星们 */}
      <path d="M40 50 L42 55 L47 55 L43 58 L45 63 L40 60 L35 63 L37 58 L33 55 L38 55 Z" fill="#FFD54F" />
      <path d="M60 50 L62 55 L67 55 L63 58 L65 63 L60 60 L55 63 L57 58 L53 55 L58 55 Z" fill="#FFD54F" />
      <path d="M80 50 L82 55 L87 55 L83 58 L85 63 L80 60 L75 63 L77 58 L73 55 L78 55 Z" fill="#E0E0E0" />
      {/* 可爱小脸 */}
      <circle cx="60" cy="105" r="10" fill="#FFCC80" />
      <circle cx="56" cy="103" r="1.5" fill="#5D4037" />
      <circle cx="64" cy="103" r="1.5" fill="#5D4037" />
      <path d="M57 108 Q60 110 63 108" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),

  'no-vouchers': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 优惠券主体 */}
      <rect x="15" y="35" width="90" height="50" rx="8" fill="#E8F5E9" />
      {/* 锯齿边 */}
      <circle cx="15" cy="50" r="5" fill="white" />
      <circle cx="15" cy="70" r="5" fill="white" />
      <circle cx="105" cy="50" r="5" fill="white" />
      <circle cx="105" cy="70" r="5" fill="white" />
      {/* 虚线分割 */}
      <path d="M75 40 L75 80" stroke="#81C784" strokeWidth="2" strokeDasharray="4 4" />
      {/* 百分比符号 */}
      <text x="35" y="68" fontSize="24" fontWeight="bold" fill="#4CAF50">%</text>
      {/* 可爱表情 */}
      <circle cx="88" cy="55" r="2" fill="#4CAF50" />
      <circle cx="96" cy="55" r="2" fill="#4CAF50" />
      <path d="M86 62 Q92 67 98 62" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 飘落的小星星 */}
      <path d="M25 20 L26 23 L29 23 L27 25 L28 28 L25 26 L22 28 L23 25 L21 23 L24 23 Z" fill="#FFD54F" opacity="0.7" />
      <path d="M95 25 L96 27 L98 27 L97 29 L98 31 L95 30 L92 31 L93 29 L92 27 L94 27 Z" fill="#FFD54F" opacity="0.5" />
    </svg>
  ),

  'no-packages': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 礼盒主体 */}
      <rect x="25" y="50" width="70" height="50" rx="5" fill="#E8F5E9" />
      {/* 礼盒盖子 */}
      <rect x="20" y="40" width="80" height="15" rx="3" fill="#C8E6C9" />
      {/* 蝴蝶结 */}
      <ellipse cx="60" cy="40" rx="15" ry="8" fill="#81C784" />
      <ellipse cx="45" cy="35" rx="8" ry="5" fill="#66BB6A" />
      <ellipse cx="75" cy="35" rx="8" ry="5" fill="#66BB6A" />
      <circle cx="60" cy="40" r="5" fill="#4CAF50" />
      {/* 飘带 */}
      <path d="M55 45 Q50 55 45 50" stroke="#81C784" strokeWidth="3" fill="none" />
      <path d="M65 45 Q70 55 75 50" stroke="#81C784" strokeWidth="3" fill="none" />
      {/* 可爱表情 */}
      <circle cx="50" cy="75" r="3" fill="#4CAF50" />
      <circle cx="70" cy="75" r="3" fill="#4CAF50" />
      <path d="M50 85 Q60 92 70 85" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),

  'no-notifications': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 铃铛主体 */}
      <path d="M60 25 C40 25 30 45 30 65 L30 75 L90 75 L90 65 C90 45 80 25 60 25 Z" fill="#E8F5E9" stroke="#81C784" strokeWidth="2" />
      {/* 铃铛顶部 */}
      <circle cx="60" cy="25" r="5" fill="#81C784" />
      {/* 铃铛底部 */}
      <rect x="25" y="75" width="70" height="8" rx="4" fill="#C8E6C9" />
      {/* 铃锤 */}
      <circle cx="60" cy="90" r="8" fill="#A5D6A7" />
      {/* Zzz 睡觉 */}
      <text x="75" y="40" fontSize="12" fill="#9E9E9E" fontWeight="bold">Z</text>
      <text x="82" y="32" fontSize="10" fill="#BDBDBD" fontWeight="bold">z</text>
      <text x="88" y="26" fontSize="8" fill="#E0E0E0" fontWeight="bold">z</text>
      {/* 可爱闭眼表情 */}
      <path d="M48 55 Q52 52 56 55" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M64 55 Q68 52 72 55" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M55 65 Q60 68 65 65" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),

  'no-points': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 金币堆 */}
      <ellipse cx="60" cy="85" rx="35" ry="10" fill="#FFE082" />
      <ellipse cx="60" cy="80" rx="30" ry="8" fill="#FFD54F" />
      <ellipse cx="60" cy="75" rx="25" ry="6" fill="#FFCA28" />
      {/* 主金币 */}
      <circle cx="60" cy="50" r="25" fill="#FFD54F" stroke="#FFC107" strokeWidth="3" />
      <circle cx="60" cy="50" r="18" fill="#FFCA28" />
      {/* 积分符号 */}
      <text x="52" y="57" fontSize="20" fontWeight="bold" fill="#FF8F00">P</text>
      {/* 可爱表情 */}
      <circle cx="50" cy="45" r="2" fill="#FF8F00" />
      <circle cx="70" cy="45" r="2" fill="#FF8F00" />
      {/* 闪光 */}
      <path d="M85 30 L88 35 L93 35 L89 38 L91 43 L85 40 L79 43 L81 38 L77 35 L82 35 Z" fill="#FFF59D" />
      <path d="M30 40 L32 43 L35 43 L33 45 L34 48 L30 46 L26 48 L27 45 L25 43 L28 43 Z" fill="#FFF59D" opacity="0.7" />
    </svg>
  ),

  'no-referrals': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 人物1 */}
      <circle cx="40" cy="45" r="15" fill="#FFCC80" />
      <circle cx="35" cy="42" r="2" fill="#5D4037" />
      <circle cx="45" cy="42" r="2" fill="#5D4037" />
      <path d="M36 50 Q40 54 44 50" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M40 60 L40 85 M30 70 L40 75 L50 70 M35 85 L40 100 M45 85 L40 100" stroke="#81C784" strokeWidth="3" strokeLinecap="round" />
      {/* 人物2 (虚线表示等待) */}
      <circle cx="80" cy="45" r="15" fill="#E0E0E0" strokeDasharray="4 4" stroke="#BDBDBD" strokeWidth="2" />
      <circle cx="75" cy="42" r="2" fill="#BDBDBD" />
      <circle cx="85" cy="42" r="2" fill="#BDBDBD" />
      <path d="M76 50 Q80 54 84 50" stroke="#BDBDBD" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 连接箭头 */}
      <path d="M55 50 L65 50" stroke="#4CAF50" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M62 47 L65 50 L62 53" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* 问号 */}
      <text x="75" y="80" fontSize="20" fill="#BDBDBD">?</text>
    </svg>
  ),

  'no-inventory': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 箱子 */}
      <rect x="25" y="45" width="70" height="50" rx="5" fill="#E8F5E9" stroke="#81C784" strokeWidth="2" />
      {/* 箱子开口 */}
      <path d="M25 45 L60 30 L95 45" stroke="#81C784" strokeWidth="2" fill="#C8E6C9" />
      <path d="M60 30 L60 55" stroke="#81C784" strokeWidth="2" />
      {/* 空箱子内部阴影 */}
      <ellipse cx="60" cy="75" rx="20" ry="8" fill="#C8E6C9" />
      {/* 球线卷 (浅色表示空) */}
      <ellipse cx="60" cy="70" rx="12" ry="5" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeDasharray="4 4" />
      {/* 可爱表情 */}
      <circle cx="45" cy="60" r="2" fill="#4CAF50" />
      <circle cx="55" cy="60" r="2" fill="#4CAF50" />
      <path d="M44 67 Q50 64 56 67" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),

  'no-users': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 用户轮廓 */}
      <circle cx="60" cy="40" r="20" fill="#E0E0E0" stroke="#BDBDBD" strokeWidth="2" strokeDasharray="5 5" />
      <path d="M30 95 Q30 70 60 70 Q90 70 90 95" fill="#E0E0E0" stroke="#BDBDBD" strokeWidth="2" strokeDasharray="5 5" />
      {/* 加号 */}
      <circle cx="85" cy="75" r="15" fill="#E8F5E9" stroke="#81C784" strokeWidth="2" />
      <path d="M85 68 L85 82 M78 75 L92 75" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
      {/* 等待的眼睛 */}
      <circle cx="52" cy="38" r="2" fill="#9E9E9E" />
      <circle cx="68" cy="38" r="2" fill="#9E9E9E" />
      <path d="M55 48 L65 48" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  'no-payments': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 文件/单据 */}
      <rect x="30" y="25" width="60" height="75" rx="5" fill="#E8F5E9" stroke="#81C784" strokeWidth="2" />
      {/* 折角 */}
      <path d="M75 25 L90 40 L75 40 Z" fill="#C8E6C9" stroke="#81C784" strokeWidth="1" />
      {/* 内容线条 */}
      <rect x="40" y="50" width="40" height="4" rx="2" fill="#C8E6C9" />
      <rect x="40" y="60" width="30" height="4" rx="2" fill="#C8E6C9" />
      <rect x="40" y="70" width="35" height="4" rx="2" fill="#C8E6C9" />
      {/* 对勾 */}
      <circle cx="60" cy="85" r="12" fill="#4CAF50" />
      <path d="M54 85 L58 89 L66 81" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* 庆祝星星 */}
      <path d="M25 35 L27 39 L31 39 L28 42 L29 46 L25 44 L21 46 L22 42 L19 39 L23 39 Z" fill="#FFD54F" />
      <path d="M95 55 L96 58 L99 58 L97 60 L98 63 L95 61 L92 63 L93 60 L91 58 L94 58 Z" fill="#FFD54F" opacity="0.7" />
    </svg>
  ),

  'no-data': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 文件夹 */}
      <path d="M20 40 L20 90 Q20 95 25 95 L95 95 Q100 95 100 90 L100 45 Q100 40 95 40 L55 40 L50 30 L25 30 Q20 30 20 35 Z" fill="#E8F5E9" stroke="#81C784" strokeWidth="2" />
      {/* 虚线文件 */}
      <rect x="40" y="55" width="40" height="30" rx="3" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeDasharray="4 4" />
      {/* 可爱表情 */}
      <circle cx="52" cy="67" r="2" fill="#BDBDBD" />
      <circle cx="68" cy="67" r="2" fill="#BDBDBD" />
      <path d="M55 75 Q60 72 65 75" stroke="#BDBDBD" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),

  'search-empty': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 放大镜 */}
      <circle cx="50" cy="50" r="25" fill="#E8F5E9" stroke="#81C784" strokeWidth="3" />
      <path d="M68 68 L90 90" stroke="#81C784" strokeWidth="6" strokeLinecap="round" />
      {/* 放大镜手柄 */}
      <rect x="85" y="82" width="12" height="20" rx="4" fill="#A5D6A7" transform="rotate(45 85 82)" />
      {/* 困惑表情 */}
      <circle cx="42" cy="47" r="3" fill="#4CAF50" />
      <circle cx="58" cy="47" r="3" fill="#4CAF50" />
      <path d="M45 58 Q50 55 55 58" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* 问号 */}
      <text x="75" y="35" fontSize="16" fill="#9E9E9E" fontWeight="bold">?</text>
    </svg>
  ),

  'error': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 三角警告 */}
      <path d="M60 20 L100 90 L20 90 Z" fill="#FFF3E0" stroke="#FF9800" strokeWidth="3" />
      {/* 感叹号 */}
      <rect x="56" y="40" width="8" height="25" rx="4" fill="#FF9800" />
      <circle cx="60" cy="75" r="5" fill="#FF9800" />
      {/* 可爱难过表情 */}
      <circle cx="35" cy="100" r="12" fill="#FFCC80" />
      <circle cx="31" cy="98" r="1.5" fill="#5D4037" />
      <circle cx="39" cy="98" r="1.5" fill="#5D4037" />
      <path d="M32 105 Q35 102 38 105" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 小云朵 */}
      <ellipse cx="90" cy="30" rx="12" ry="8" fill="#E0E0E0" />
      <ellipse cx="82" cy="32" rx="8" ry="6" fill="#E0E0E0" />
    </svg>
  ),
};

// 尺寸配置
const sizeConfig = {
  sm: { illustration: 80, title: 'text-base', description: 'text-sm' },
  md: { illustration: 120, title: 'text-lg', description: 'text-sm' },
  lg: { illustration: 160, title: 'text-xl', description: 'text-base' },
};

export default function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  const config = defaultConfig[type];
  const Illustration = illustrations[type];
  const sizeStyle = sizeConfig[size];

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* 插画 */}
      <div className="mb-6 animate-bounce-slow">
        <Illustration size={sizeStyle.illustration} />
      </div>

      {/* 标题 */}
      <h3 className={`${sizeStyle.title} font-semibold text-text-primary mb-2 text-center`}>
        {displayTitle}
      </h3>

      {/* 描述 */}
      <p className={`${sizeStyle.description} text-text-secondary text-center max-w-xs mb-6`}>
        {displayDescription}
      </p>

      {/* 行动按钮 */}
      {(actionLabel && (onAction || actionHref)) && (
        actionHref ? (
          <a href={actionHref}>
            <Button variant="primary" size="md">
              {actionLabel}
            </Button>
          </a>
        ) : (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}

// 导出类型供其他组件使用
export type { EmptyStateProps };
