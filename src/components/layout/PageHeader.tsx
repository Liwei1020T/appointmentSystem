'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    maxWidth?: string;
}

/**
 * 统一页面头部组件 (Standardized Page Header)
 * 
 * 特性：
 * 1. 玻璃拟态效果 (Glassmorphism)
 * 2. 粘性定位 (Sticky)
 * 3. 统一返回键风格 (Capsule Button)
 * 4. 可配置副标题和宽度
 */
const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    showBack = true,
    onBack,
    maxWidth = 'max-w-2xl'
}) => {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md sticky top-[64px] z-30 border-b border-border-subtle shadow-sm">
            <div className={`${maxWidth} mx-auto px-4 py-5 flex items-center gap-4`}>
                {showBack && (
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center bg-ink hover:bg-ink/80 rounded-xl transition-colors shrink-0"
                        aria-label="返回"
                    >
                        <ArrowLeft className="w-5 h-5 text-text-secondary" />
                    </button>
                )}
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-text-primary font-display truncate">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-text-secondary mt-0.5 truncate">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
