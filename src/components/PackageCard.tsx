/**
 * 套餐卡片组件 (Package Card)
 * 
 * 展示单个套餐信息，包括名称、价格、次数、节省金额、购买按钮
 */

import React from 'react';
import { Package } from '@/services/packageService';
import Button from '@/components/Button';
import { Sparkles, TrendingDown, CheckCircle2, Zap, Clock, Star } from 'lucide-react';

// 套餐标签类型与显示配置
const TAG_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  best_value: { label: '性价比之选', icon: Star },
  most_popular: { label: '最受欢迎', icon: Sparkles },
  limited_time: { label: '限时优惠', icon: Clock },
  new: { label: '新上架', icon: Zap },
};

interface PackageCardProps {
  package: Package;
  onPurchase: (pkg: Package) => void;
  disabled?: boolean;
  showSavings?: boolean;
  averagePrice?: number; // 单次平均价格（仅在 originalPrice 未设置时作为后备）
}

export default function PackageCard({
  package: pkg,
  onPurchase,
  disabled = false,
  showSavings = true,
  averagePrice = 35,
}: PackageCardProps) {
  const price = Number(pkg.price);
  const pricePerTime = price / pkg.times;
  // 优先使用数据库中的 originalPrice，否则用 averagePrice 计算
  const originalPrice = pkg.originalPrice ? Number(pkg.originalPrice) : averagePrice * pkg.times;
  const savings = originalPrice - price;
  const savingsPercentage = savings > 0 ? ((savings / originalPrice) * 100).toFixed(0) : '0';

  // 使用数据库字段判断是否为"英雄"卡片，优先用 isPopular，否则用 tag 或 times
  const isHero = (pkg as any).isPopular === true || (pkg as any).tag === 'most_popular' || pkg.times === 10;

  // 获取标签配置（优先用数据库 tag，否则根据 isPopular 显示"最受欢迎"）
  const tagKey = (pkg as any).tag || ((pkg as any).isPopular ? 'most_popular' : null);
  const tagConfig = tagKey ? TAG_CONFIG[tagKey] : null;
  const isFirstOrderOnly = (pkg as any).isFirstOrderOnly === true;

  // Feature list for the card
  const features = [
    `${pkg.times} 次穿线服务`,
    pkg.validityDays ? `有效期 ${pkg.validityDays} 天` : '永久有效',
    '专业技师操作',
    '优先预约权',
  ];

  return (
    <div
      className={`
        relative overflow-visible rounded-2xl bg-white
        transition-all duration-300 ease-out
        ${isHero
          ? 'border-2 border-accent-border shadow-glow scale-[1.02] md:scale-105 z-10'
          : 'border border-border-subtle shadow-md hover:shadow-lg'
        }
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Badge - Centered at top (使用数据库标签或默认"最受欢迎") */}
      {(tagConfig || isHero) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 bg-accent text-text-onAccent text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            {tagConfig ? (
              <>
                <tagConfig.icon className="w-3.5 h-3.5" />
                {tagConfig.label}
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                最受欢迎
              </>
            )}
          </div>
        </div>
      )}

      <div className="p-6 pt-8">
        {/* Package Name */}
        <h3 className={`text-center text-lg font-semibold mb-2 font-display ${isHero ? 'text-accent' : 'text-text-primary'}`}>
          {pkg.name}
        </h3>

        {isFirstOrderOnly && (
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/30">
              <Sparkles className="w-3 h-3" />
              首单特价
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-4xl font-extrabold text-text-primary tracking-tight font-mono">
              RM {price.toFixed(0)}
            </span>
            {showSavings && savings > 0 && (
              <span className="text-xs text-text-tertiary line-through">
                RM {originalPrice.toFixed(0)}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">
            平均 <span className="font-semibold text-text-primary font-mono">RM {pricePerTime.toFixed(2)}</span>/次
          </p>
        </div>

        {/* Savings Tag - Positioned near price */}
        {showSavings && savings > 0 && (
          <div className="flex justify-center mb-5">
            <span className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold
              ${isHero
                ? 'bg-accent-soft text-accent border border-accent-border'
                : 'bg-success/15 text-success border border-success/20'
              }
            `}>
              <TrendingDown className="w-3 h-3" />
              立省 RM {savings.toFixed(0)} ({savingsPercentage}%)
            </span>
          </div>
        )}

        {/* Feature List with Checkmarks */}
        <ul className="space-y-2.5 mb-6">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2.5 text-sm text-text-secondary">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHero ? 'text-accent' : 'text-text-tertiary'}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button - Full Width */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && pkg.active) onPurchase(pkg);
          }}
          disabled={disabled || !pkg.active}
          variant={isHero ? 'primary' : 'secondary'}
          fullWidth
          glow={isHero}
          className="text-sm font-bold"
        >
          {!pkg.active ? '暂不可购买' : '立即购买'}
        </Button>
      </div>
    </div>
  );
}
