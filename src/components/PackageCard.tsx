/**
 * 套餐卡片组件 (Package Card)
 * 
 * 展示单个套餐信息，包括名称、价格、次数、节省金额、购买按钮
 */

import React from 'react';
import { Package } from '@/services/packageService';
import Button from '@/components/Button';

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
  averagePrice = 50, // 默认单次价格 RM50
}: PackageCardProps) {
  const price = Number(pkg.price);

  // 计算单次价格
  const pricePerTime = price / pkg.times;

  // 计算节省金额
  const savings = (averagePrice * pkg.times) - price;
  const savingsPercentage = ((savings / (averagePrice * pkg.times)) * 100).toFixed(0);

  // 是否为推荐套餐（通常是10次套餐）
  const isRecommended = pkg.times === 10;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-ink-surface border
        ${isRecommended
          ? 'border-accent shadow-lg shadow-accent/20'
          : 'border-border-subtle'
        }
        ${disabled ? 'opacity-60' : ''}
        transition-all duration-300 ease-out
        hover:shadow-xl hover:-translate-y-1
        group
      `}
    >
      {/* 推荐标签 */}
      {isRecommended && (
        <div className="absolute top-0 right-0 overflow-hidden">
          <div className="absolute top-3 right-[-35px] w-32 transform rotate-45 bg-accent py-1 text-center">
            <span className="text-xs font-bold text-text-onAccent">🔥 推荐</span>
          </div>
        </div>
      )}

      {/* 卡片内容 */}
      <div className="p-6">
        {/* 套餐名称 */}
        <h3 className="text-xl font-bold text-text-primary mb-4">{pkg.name}</h3>

        {/* 次数 - 重点突出 */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`
            text-5xl font-black font-mono
            ${isRecommended ? 'text-accent' : 'text-text-primary'}
            transition-transform duration-300 group-hover:scale-105
          `}>
            {pkg.times}
          </span>
          <span className="text-lg text-text-tertiary">次穿线</span>
        </div>

        {/* 价格 */}
        <div className="mb-4 pb-4 border-b border-border-subtle">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-text-tertiary">RM</span>
            <span className="text-3xl font-bold text-text-primary font-mono">
              {price.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-text-tertiary mt-1">
            平均每次 <span className="text-text-secondary font-medium">RM {pricePerTime.toFixed(2)}</span>
          </p>
        </div>

        {/* 节省金额 */}
        {showSavings && savings > 0 && (
          <div className={`
            mb-4 p-4 rounded-xl
            ${isRecommended
              ? 'bg-gradient-to-r from-accent/15 to-accent/5 border border-accent/30'
              : 'bg-success/10 border border-success/20'
            }
            transition-transform duration-300 group-hover:scale-[1.02]
          `}>
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${isRecommended ? 'bg-accent/20 text-accent' : 'bg-success/20 text-success'}
              `}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className={`text-base font-bold ${isRecommended ? 'text-accent' : 'text-success'}`}>
                  节省 RM {savings.toFixed(2)}
                </p>
                <p className="text-xs text-text-tertiary">
                  相比单次购买省 {savingsPercentage}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 有效期 */}
        {pkg.validityDays && (
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>有效期：<strong>{pkg.validityDays} 天</strong></span>
          </div>
        )}

        {/* 描述 */}
        {pkg.description && (
          <p className="text-sm text-text-secondary mb-4 line-clamp-2">{pkg.description}</p>
        )}

        {/* 购买按钮 */}
        <Button
          onClick={() => onPurchase(pkg)}
          fullWidth
          disabled={disabled || !pkg.active}
          variant={isRecommended ? 'primary' : 'secondary'}
          className={`
            ${isRecommended ? 'shadow-lg shadow-accent/30' : ''}
            transition-all duration-300
            hover:scale-[1.02]
          `}
        >
          {!pkg.active ? '暂不可购买' : '立即购买'}
        </Button>
      </div>
    </div>
  );
}
