/**
 * BrandLogo 品牌 Logo 组件
 * 
 * 功能：
 * - 统一全站 Logo 样式
 * - 支持多种尺寸变体
 * - 方便未来替换为 SVG Logo
 * 
 * 使用方法：
 * <BrandLogo size="sm" />  // 小尺寸 (24x24)
 * <BrandLogo size="md" />  // 中尺寸 (32x32) - 默认
 * <BrandLogo size="lg" />  // 大尺寸 (48x48)
 * <BrandLogo size="xl" />  // 超大尺寸 (64x64)
 * 
 * 后续替换为 SVG:
 * 1. 将 SVG 文件放入 public/logo.svg
 * 2. 取消下方 SVG 版本的注释
 * 3. 注释掉文字版本
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BrandLogoProps {
    /** 尺寸变体 */
    size?: LogoSize;
    /** 是否显示品牌名称 */
    showName?: boolean;
    /** 额外的 CSS 类 */
    className?: string;
    /** 名称的额外 CSS 类 */
    nameClassName?: string;
}

const sizeConfig: Record<LogoSize, { container: string; text: string; name: string }> = {
    xs: { container: 'w-6 h-6', text: 'text-[10px]', name: 'text-sm' },
    sm: { container: 'w-8 h-8', text: 'text-xs', name: 'text-base' },
    md: { container: 'w-9 h-9', text: 'text-sm', name: 'text-lg' },
    lg: { container: 'w-12 h-12', text: 'text-base', name: 'text-xl' },
    xl: { container: 'w-16 h-16', text: 'text-xl', name: 'text-2xl' },
};

export default function BrandLogo({
    size = 'md',
    showName = false,
    className,
    nameClassName,
}: BrandLogoProps) {
    const config = sizeConfig[size];

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {/* ========== 文字版 Logo (当前使用) ========== */}
            <div
                className={cn(
                    config.container,
                    'rounded-xl bg-accent flex items-center justify-center',
                    'font-bold text-text-onAccent shadow-sm',
                    config.text
                )}
            >
                LW
            </div>

            {/* ========== SVG 版 Logo (后续替换时取消注释) ========== */}
            {/* 
      <div className={cn(config.container, 'relative')}>
        <Image
          src="/logo.svg"
          alt="LW String Studio"
          fill
          className="object-contain"
          priority
        />
      </div>
      */}

            {/* 品牌名称 */}
            {showName && (
                <span className={cn(
                    'font-bold tracking-tight text-text-primary',
                    config.name,
                    nameClassName
                )}>
                    LW String Studio
                </span>
            )}
        </div>
    );
}
