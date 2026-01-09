/**
 * 球线卡片组件 (String Card)
 * 
 * 显示单个球线信息，支持选中态、禁用态、键盘导航
 * 包含：图片、品牌型号、描述、规格、库存状态、价格、推荐标签
 */

'use client';

import React from 'react';
import { StringInventory } from '@/types';
import { INVENTORY } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

interface StringCardProps {
    string: StringInventory;
    isSelected: boolean;
    onSelect: (string: StringInventory) => void;
}

export default function StringCard({ string, isSelected, onSelect }: StringCardProps) {
    const isOutOfStock = string.stock === 0;
    const isLowStock = string.stock > 0 && string.stock <= INVENTORY.LOW_STOCK_THRESHOLD;
    const isDisabled = isOutOfStock;
    const isRecommended = string.isRecommended || string.is_recommended || false;

    const price = Number(string.sellingPrice) || Number(string.selling_price) || 0;
    const imageUrl = string.imageUrl || string.image_url;
    const description = (string as any).description;

    const handleClick = () => {
        if (!isDisabled) {
            onSelect(string);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
            e.preventDefault();
            onSelect(string);
        }
    };

    return (
        <div
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`
        relative p-4 rounded-2xl border-2 transition-all cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink
        ${isDisabled
                    ? 'opacity-50 cursor-not-allowed border-border-subtle bg-white'
                    : isSelected
                        ? 'border-accent bg-accent/10 shadow-glow'
                        : 'border-border-subtle bg-white hover:border-accent/40 hover:shadow-card'
                }
      `}
        >
            {/* Recommended Badge - Top Right */}
            {isRecommended && !isSelected && (
                <div className="absolute -top-2 -right-2 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-accent text-white shadow-sm">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        推荐
                    </span>
                </div>
            )}

            <div className="flex gap-4">
                {/* Image */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-ink-surface overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={`${string.brand} ${string.model}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-ink">
                            {/* String cross-section icon */}
                            <svg className="w-8 h-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <circle cx="12" cy="12" r="9" />
                                <line x1="12" y1="3" x2="12" y2="21" strokeWidth={1} />
                                <line x1="3" y1="12" x2="21" y2="12" strokeWidth={1} />
                                <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" strokeWidth={1} />
                                <line x1="18.4" y1="5.6" x2="5.6" y2="18.4" strokeWidth={1} />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title and Price Row */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-text-primary truncate">
                            {string.brand} {string.model}
                        </h3>
                        <span
                            className="flex-shrink-0 text-lg font-bold text-accent font-mono"
                        >
                            {formatCurrency(price)}
                        </span>
                    </div>

                    {/* Description */}
                    {description && (
                        <p className="text-sm text-text-tertiary mt-0.5 line-clamp-1">
                            {description}
                        </p>
                    )}

                    {/* Specification / Gauge */}
                    {(string.specification || string.gauge) && (
                        <p className="text-sm text-text-secondary mt-1">
                            {[string.specification, string.gauge].filter(Boolean).join(' · ')}
                        </p>
                    )}

                    {/* Characteristic Chips */}
                    {(string.elasticity || string.durability || string.control) && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {string.elasticity && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 border border-blue-500/30">
                                    弹性 {string.elasticity === 'low' ? '低' : string.elasticity === 'medium' ? '中' : '高'}
                                </span>
                            )}
                            {string.durability && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                                    耐久 {string.durability === 'low' ? '低' : string.durability === 'medium' ? '中' : '高'}
                                </span>
                            )}
                            {string.control && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-600 border border-violet-500/30">
                                    控球 {string.control === 'low' ? '低' : string.control === 'medium' ? '中' : '高'}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Stock Badge */}
                    <div className="flex items-center gap-2 mt-2">
                        {isOutOfStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
                                已售罄
                            </span>
                        ) : isLowStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                                库存紧张 ({string.stock})
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                                库存充足 ({string.stock})
                            </span>
                        )}
                    </div>
                </div>

                {/* Selected Checkmark */}
                {isSelected && !isDisabled && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-text-onAccent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
