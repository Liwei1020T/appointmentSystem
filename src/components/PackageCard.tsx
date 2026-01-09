/**
 * 套餐卡片组件 (Package Card)
 * 
 * 展示单个套餐信息，包括名称、价格、次数、节省金额、购买按钮
 */

import React from 'react';
import { Package } from '@/services/packageService';
import Button from '@/components/Button';
import { Sparkles, Calendar, TrendingDown, CheckCircle2 } from 'lucide-react';

interface PackageCardProps {
  package: Package;
  onPurchase: (pkg: Package) => void;
  disabled?: boolean;
  showSavings?: boolean;
  averagePrice?: number; // 单次平均价格，用于计算节省金额
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
  const originalPrice = averagePrice * pkg.times;
  const savings = originalPrice - price;
  const savingsPercentage = ((savings / originalPrice) * 100).toFixed(0);

  // Standard package (10-times) is the "Hero" card
  const isHero = pkg.times === 10;

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
      {/* Most Popular Badge - Centered at top */}
      {isHero && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 bg-accent text-text-onAccent text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" />
            最受欢迎
          </div>
        </div>
      )}

      <div className="p-6 pt-8">
        {/* Package Name */}
        <h3 className={`text-center text-lg font-semibold mb-2 font-display ${isHero ? 'text-accent' : 'text-text-primary'}`}>
          {pkg.name}
        </h3>

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

