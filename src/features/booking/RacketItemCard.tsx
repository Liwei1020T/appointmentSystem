/**
 * 球拍配置卡片组件
 * 
 * 显示单支球拍的配置：球线、磅数、照片
 * 用于多球拍订单的购物车列表
 */

'use client';

import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import RacketPhotoUploader from './RacketPhotoUploader';

interface StringInfo {
    id: string;
    brand: string;
    model: string;
    sellingPrice: number | { toNumber(): number };
}

export interface RacketItemData {
    id: string; // 临时 ID，用于前端追踪
    stringId: string;
    string: StringInfo;
    tensionVertical: number;
    tensionHorizontal: number;
    racketBrand?: string;
    racketModel?: string;
    racketPhoto: string;
    notes?: string;
}

interface RacketItemCardProps {
    item: RacketItemData;
    index: number;
    onUpdate: (id: string, data: Partial<RacketItemData>) => void;
    onRemove: (id: string) => void;
    disabled?: boolean;
}

export default function RacketItemCard({
    item,
    index,
    onUpdate,
    onRemove,
    disabled = false,
}: RacketItemCardProps) {
    const [expanded, setExpanded] = useState(true);

    const price = typeof item.string.sellingPrice === 'object'
        ? item.string.sellingPrice.toNumber()
        : Number(item.string.sellingPrice);

    const handleTensionChange = (type: 'vertical' | 'horizontal', value: number) => {
        if (type === 'vertical') {
            onUpdate(item.id, { tensionVertical: value });
        } else {
            onUpdate(item.id, { tensionHorizontal: value });
        }
    };

    const handlePhotoChange = (url: string) => {
        onUpdate(item.id, { racketPhoto: url });
    };

    const handlePhotoRemove = () => {
        onUpdate(item.id, { racketPhoto: '' });
    };

    const handleRacketInfoChange = (field: 'racketBrand' | 'racketModel', value: string) => {
        onUpdate(item.id, { [field]: value });
    };

    const handleNotesChange = (value: string) => {
        onUpdate(item.id, { notes: value });
    };

    // 检查是否完成配置
    const isComplete = item.racketPhoto && item.tensionVertical && item.tensionHorizontal;

    return (
        <div className={`
      rounded-xl border-2 transition-all overflow-hidden
      ${isComplete
                ? 'border-success/30 bg-success/5'
                : 'border-warning/30 bg-warning/5'
            }
    `}>
            {/* 卡片头部 */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-ink-elevated/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
            ${isComplete ? 'bg-success text-white' : 'bg-warning text-white'}
          `}>
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="font-semibold text-text-primary">
                            {item.string.brand} {item.string.model}
                        </h3>
                        <p className="text-sm text-text-secondary">
                            {item.tensionVertical}/{item.tensionHorizontal} 磅 · {formatCurrency(price)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isComplete && (
                        <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full font-medium">
                            未完成
                        </span>
                    )}
                    {isComplete && (
                        <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-medium">
                            已配置
                        </span>
                    )}
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-text-tertiary" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-text-tertiary" />
                    )}
                </div>
            </div>

            {/* 展开内容 */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border-subtle">
                    {/* 球拍照片上传 */}
                    <div className="pt-4">
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            📷 球拍照片 <span className="text-danger">*</span>
                        </label>
                        <RacketPhotoUploader
                            value={item.racketPhoto}
                            onChange={handlePhotoChange}
                            onRemove={handlePhotoRemove}
                            disabled={disabled}
                            index={index}
                        />
                        {!item.racketPhoto && (
                            <p className="text-xs text-warning mt-2">请上传球拍照片，便于识别您的球拍</p>
                        )}
                    </div>

                    {/* 磅数设置 */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            ⚖️ 拉力设置
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-text-tertiary mb-1">竖线 (Main)</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleTensionChange('vertical', Math.max(18, item.tensionVertical - 1))}
                                        disabled={disabled || item.tensionVertical <= 18}
                                        className="w-10 h-10 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center text-lg font-bold text-text-secondary hover:bg-ink-elevated disabled:opacity-50"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center">
                                        <span className="text-2xl font-bold text-text-primary">{item.tensionVertical}</span>
                                        <span className="text-sm text-text-tertiary ml-1">lbs</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTensionChange('vertical', Math.min(35, item.tensionVertical + 1))}
                                        disabled={disabled || item.tensionVertical >= 35}
                                        className="w-10 h-10 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center text-lg font-bold text-text-secondary hover:bg-ink-elevated disabled:opacity-50"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-text-tertiary mb-1">横线 (Cross)</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleTensionChange('horizontal', Math.max(18, item.tensionHorizontal - 1))}
                                        disabled={disabled || item.tensionHorizontal <= 18}
                                        className="w-10 h-10 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center text-lg font-bold text-text-secondary hover:bg-ink-elevated disabled:opacity-50"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center">
                                        <span className="text-2xl font-bold text-text-primary">{item.tensionHorizontal}</span>
                                        <span className="text-sm text-text-tertiary ml-1">lbs</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTensionChange('horizontal', Math.min(35, item.tensionHorizontal + 1))}
                                        disabled={disabled || item.tensionHorizontal >= 35}
                                        className="w-10 h-10 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center text-lg font-bold text-text-secondary hover:bg-ink-elevated disabled:opacity-50"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 球拍信息（可选） */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            🏸 球拍信息（可选）
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="品牌（如 YONEX）"
                                value={item.racketBrand || ''}
                                onChange={(e) => handleRacketInfoChange('racketBrand', e.target.value)}
                                disabled={disabled}
                                className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-ink-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                            <input
                                type="text"
                                placeholder="型号（如 Astrox 88D）"
                                value={item.racketModel || ''}
                                onChange={(e) => handleRacketInfoChange('racketModel', e.target.value)}
                                disabled={disabled}
                                className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-ink-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </div>
                    </div>

                    {/* 备注 */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            📝 备注（可选）
                        </label>
                        <textarea
                            placeholder="特殊要求或备注..."
                            value={item.notes || ''}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            disabled={disabled}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-ink-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                        />
                    </div>

                    {/* 删除按钮 */}
                    <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        disabled={disabled}
                        className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>移除此球拍</span>
                    </button>
                </div>
            )}
        </div>
    );
}
