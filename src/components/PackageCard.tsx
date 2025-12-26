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
          ? 'border-2 border-orange-400 shadow-[0_8px_30px_rgba(255,107,0,0.15)] scale-[1.02] md:scale-105 z-10'
          : 'border border-gray-200 shadow-md hover:shadow-lg'
        }
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Most Popular Badge - Centered at top */}
      {isHero && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            🔥 最受欢迎
          </div>
        </div>
      )}

      <div className="p-6 pt-8">
        {/* Package Name */}
        <h3 className={`text-center text-lg font-semibold mb-2 ${isHero ? 'text-orange-600' : 'text-gray-800'}`}>
          {pkg.name}
        </h3>

        {/* Price Section */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-4xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>
              RM {price.toFixed(0)}
            </span>
            {showSavings && savings > 0 && (
              <span className="text-xs text-gray-400 line-through">
                RM {originalPrice.toFixed(0)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            平均 <span className="font-semibold text-gray-700">RM {pricePerTime.toFixed(2)}</span>/次
          </p>
        </div>

        {/* Savings Tag - Positioned near price */}
        {showSavings && savings > 0 && (
          <div className="flex justify-center mb-5">
            <span className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold
              ${isHero
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-green-100 text-green-700 border border-green-200'
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
            <li key={idx} className="flex items-center gap-2.5 text-sm text-gray-600">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHero ? 'text-orange-500' : 'text-orange-400'}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button - Full Width */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && pkg.active) onPurchase(pkg);
          }}
          disabled={disabled || !pkg.active}
          className={`
            w-full py-3 rounded-xl text-sm font-bold transition-all duration-200
            ${isHero
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
              : 'bg-white border-2 border-orange-400 text-orange-500 hover:bg-orange-50 active:scale-[0.98]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {!pkg.active ? '暂不可购买' : '立即购买'}
        </button>
      </div>
    </div>
  );
}


