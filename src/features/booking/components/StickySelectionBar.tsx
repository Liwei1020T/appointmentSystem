/**
 * 底部粘性摘要条组件 (Sticky Selection Bar)
 * 
 * 固定在底部，显示已选球线信息或未选提示
 * 支持取消选择和下一步操作
 */

'use client';

import React from 'react';
import { StringInventory } from '@/types';
import { Button } from '@/components';
import { formatCurrency } from '@/lib/utils';

interface StickySelectionBarProps {
    selectedString: StringInventory | null;
    onNext: () => void;
}

export default function StickySelectionBar({
    selectedString,
    onNext,
}: StickySelectionBarProps) {
    const price = selectedString
        ? Number(selectedString.sellingPrice) || Number(selectedString.selling_price) || 0
        : 0;

    return (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 glass-surface border-t border-border-subtle safe-area-pb z-20">
            <div className="max-w-2xl mx-auto px-4 py-4">
                {selectedString ? (
                    /* Selected State */
                    <div className="flex items-center gap-3">
                        {/* Selection Summary - Left Side */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-text-tertiary mb-0.5">已选</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary truncate">
                                    {selectedString.brand} {selectedString.model}
                                </span>
                                <span className="flex-shrink-0 text-sm font-bold text-accent font-mono">
                                    {formatCurrency(price)}
                                </span>
                            </div>
                        </div>

                        {/* Next Button - Large and Prominent */}
                        <Button
                            variant="primary"
                            onClick={onNext}
                            className="flex-shrink-0 px-6 py-3 text-base font-bold shadow-lg"
                        >
                            下一步：配置球拍
                        </Button>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <p className="text-sm text-text-tertiary">请选择一款球线</p>
                        </div>
                        <Button variant="primary" disabled className="flex-shrink-0 px-6 py-3">
                            下一步
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
