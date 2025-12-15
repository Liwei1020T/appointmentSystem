/**
 * 套餐卡片组件 (Package Card)
 * 
 * 展示单个套餐信息，包括名称、价格、次数、节省金额、购买按钮
 */

import React from 'react';
import { Package } from '@/services/package.service';
import Card from '@/components/Card';
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
    <Card
      className={`p-6 relative ${
        isRecommended ? 'ring-2 ring-blue-500' : ''
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {/* 推荐标签 */}
      {isRecommended && (
        <div className="absolute top-0 right-6 transform -translate-y-1/2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white shadow-lg">
            🔥 推荐
          </span>
        </div>
      )}

      {/* 套餐名称 */}
      <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>

      {/* 次数 */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-bold text-blue-600">{pkg.times}</span>
        <span className="text-slate-600">次穿线</span>
      </div>

      {/* 价格 */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">
            RM {price.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          平均每次 RM {pricePerTime.toFixed(2)}
        </p>
      </div>

      {/* 节省金额 */}
      {showSavings && savings > 0 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-green-700">
                节省 RM {savings.toFixed(2)}
              </p>
              <p className="text-xs text-green-600">
                相比单次购买省 {savingsPercentage}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 有效期 */}
      {pkg.validityDays && (
        <p className="text-sm text-slate-600 mb-4">
          有效期：{pkg.validityDays} 天
        </p>
      )}

      {/* 描述 */}
      {pkg.description && (
        <p className="text-sm text-slate-600 mb-4">{pkg.description}</p>
      )}

      {/* 购买按钮 */}
      <Button
        onClick={() => onPurchase(pkg)}
        fullWidth
        disabled={disabled || !pkg.active}
        variant={isRecommended ? 'primary' : 'secondary'}
      >
        {!pkg.active ? '暂不可购买' : '立即购买'}
      </Button>
    </Card>
  );
}
