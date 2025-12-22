/**
 * 品牌标签组件 (Brand Tabs)
 * 
 * 横向滚动的品牌筛选标签，支持"全部"选项
 * 品牌列表从真实数据动态生成
 */

'use client';

import React from 'react';

interface BrandTabsProps {
    brands: string[];
    selectedBrand: string;
    onSelect: (brand: string) => void;
    loading?: boolean;
}

export default function BrandTabs({
    brands,
    selectedBrand,
    onSelect,
    loading = false,
}: BrandTabsProps) {
    if (loading) {
        return (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {/* Loading skeletons */}
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-10 w-20 bg-ink-elevated rounded-xl animate-pulse flex-shrink-0"
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            role="tablist"
            aria-label="品牌筛选"
        >
            {/* "全部" tab */}
            <button
                role="tab"
                aria-selected={selectedBrand === ''}
                onClick={() => onSelect('')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedBrand === ''
                    ? 'bg-accent text-white shadow-glow'
                    : 'bg-white text-text-secondary border border-border-subtle hover:bg-accent/5 hover:text-accent hover:border-accent/20'
                    }`}
            >
                全部
            </button>

            {/* Brand tabs */}
            {brands.map((brand) => (
                <button
                    key={brand}
                    role="tab"
                    aria-selected={selectedBrand === brand}
                    onClick={() => onSelect(brand)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedBrand === brand
                        ? 'bg-accent text-white shadow-glow'
                        : 'bg-white text-text-secondary border border-border-subtle hover:bg-accent/5 hover:text-accent hover:border-accent/20'
                        }`}
                >
                    {brand}
                </button>
            ))}
        </div>
    );
}
