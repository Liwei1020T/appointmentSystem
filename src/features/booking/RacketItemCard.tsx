/**
 * 球拍配置卡片组件
 * 
 * 显示单支球拍的配置：球线、磅数、照片
 * 用于多球拍订单的购物车列表
 */

'use client';

import React, { useState, memo } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
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
    photoStatus?: 'success' | 'failed';
    photoError?: string;
    photoFileName?: string;
}

interface RacketItemCardProps {
    item: RacketItemData;
    index: number;
    onUpdate: (id: string, data: Partial<RacketItemData>) => void;
    onRemove: (id: string) => void;
    disabled?: boolean;
    isTemplate?: boolean;
    onSetTemplate?: () => void;
}

function RacketItemCardComponent({
    item,
    index,
    onUpdate,
    onRemove,
    disabled = false,
    isTemplate = false,
    onSetTemplate,
}: RacketItemCardProps) {
    const [expanded, setExpanded] = useState(true);
    const MIN_TENSION = 18;
    const MAX_TENSION = 35;
    const MIN_DIFF = 0;
    const MAX_DIFF = 3;

    const price = typeof item.string.sellingPrice === 'object'
        ? item.string.sellingPrice.toNumber()
        : Number(item.string.sellingPrice);

    /**
     * Normalize tension values to enforce valid difference rules.
     * @param vertical - Vertical string tension.
     * @param horizontal - Horizontal string tension.
     * @returns Clamped vertical/horizontal tensions respecting diff limits.
     */
    const normalizeTension = (vertical: number, horizontal: number) => {
        const clampedVertical = Math.max(MIN_TENSION, Math.min(MAX_TENSION - MIN_DIFF, vertical));
        const minHorizontal = clampedVertical + MIN_DIFF;
        const maxHorizontal = Math.min(MAX_TENSION, clampedVertical + MAX_DIFF);
        const clampedHorizontal = Math.max(minHorizontal, Math.min(maxHorizontal, horizontal));
        return { vertical: clampedVertical, horizontal: clampedHorizontal };
    };

    const showLimitToast = (message: string) => {
        toast.error(message, { duration: 2000 });
    };

    const handleTensionChange = (type: 'vertical' | 'horizontal', value: number) => {
        if (type === 'vertical') {
            if (value > item.tensionVertical) {
                const maxVerticalAllowed = Math.min(MAX_TENSION - MIN_DIFF, item.tensionHorizontal - MIN_DIFF);
                if (value > maxVerticalAllowed) {
                    showLimitToast('已达到拉力上限或差磅下限，无法继续增加');
                    return;
                }
            }
            const normalized = normalizeTension(value, item.tensionHorizontal);
            onUpdate(item.id, { tensionVertical: normalized.vertical, tensionHorizontal: normalized.horizontal });
            return;
        }
        if (value > item.tensionHorizontal) {
            const maxHorizontalAllowed = Math.min(MAX_TENSION, item.tensionVertical + MAX_DIFF);
            if (value > maxHorizontalAllowed) {
                showLimitToast('差磅上限 3 磅，无法继续增加');
                return;
            }
        }
        const normalized = normalizeTension(item.tensionVertical, value);
        onUpdate(item.id, { tensionVertical: normalized.vertical, tensionHorizontal: normalized.horizontal });
    };

    const handlePhotoChange = (url: string, meta?: { fileName?: string }) => {
        onUpdate(item.id, {
            racketPhoto: url,
            photoFileName: meta?.fileName,
        });
    };

    const handlePhotoRemove = () => {
        onUpdate(item.id, {
            racketPhoto: '',
            photoFileName: undefined,
        });
    };

    const handleRacketInfoChange = (field: 'racketBrand' | 'racketModel', value: string) => {
        onUpdate(item.id, { [field]: value });
    };

    const handleNotesChange = (value: string) => {
        onUpdate(item.id, { notes: value });
    };

    // 检查是否完成配置（含差磅有效性）
    const tensionDiff = item.tensionHorizontal - item.tensionVertical;
    const diffValid = tensionDiff >= MIN_DIFF && tensionDiff <= MAX_DIFF;
    const isComplete = item.racketPhoto && item.tensionVertical && item.tensionHorizontal && diffValid;
    const missingPhoto = !item.racketPhoto;
    const diffInvalid = !diffValid;
    const containerTone = diffInvalid
        ? 'border-danger/30 bg-danger/5'
        : isComplete
            ? 'border-success/30 bg-success/5'
            : 'border-warning/30 bg-warning/5';

    return (
        <div className={`
      rounded-xl border-2 transition-all overflow-hidden
      ${containerTone}
    `}>
            {/* 卡片头部 */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-ink/50 transition-colors"
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
                    {missingPhoto && (
                        <span className="text-xs bg-warning/15 text-warning px-2 py-1 rounded-full font-medium">
                            缺照片
                        </span>
                    )}
                    {diffInvalid && (
                        <span className="text-xs bg-danger/15 text-danger px-2 py-1 rounded-full font-medium">
                            差磅异常
                        </span>
                    )}
                    {onSetTemplate && (
                        <button
                            type="button"
                            onClick={(event) => {
                                // Keep template toggle from collapsing the card.
                                event.stopPropagation();
                                onSetTemplate();
                            }}
                            disabled={disabled}
                            aria-pressed={isTemplate}
                            aria-label={isTemplate ? '当前模板球拍' : '设为模板球拍'}
                            className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${isTemplate
                                ? 'bg-accent/15 text-accent'
                                : 'bg-ink text-text-secondary hover:text-accent'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                    {isTemplate ? '模板' : '设为模板'}
                </button>
            )}
            {expanded ? (
                <ChevronUp className="w-5 h-5 text-text-tertiary" />
            ) : (
                <ChevronDown className="w-5 h-5 text-text-tertiary" />
            )}
        </div>
        {item.photoStatus === 'failed' && item.photoError && (
            <div className="px-4 pb-3 text-xs text-danger">
                批量上传失败：{item.photoError}
            </div>
        )}
            </div>

            {/* 展开内容 */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border-subtle">
                    {/* 球拍照片上传 */}
                    <div className="pt-4">
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            球拍照片 <span className="text-danger">*</span>
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
                            拉力设置
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-text-tertiary mb-1">竖线 (Main)</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleTensionChange('vertical', Math.max(MIN_TENSION, item.tensionVertical - 1))}
                                        disabled={disabled}
                                        aria-label="减少竖线拉力"
                                        className={`w-10 h-10 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center text-lg font-bold text-text-secondary hover:bg-ink disabled:opacity-50 ${item.tensionVertical <= MIN_TENSION ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center">
                                        <span className="text-2xl font-bold text-text-primary">{item.tensionVertical}</span>
                                        <span className="text-sm text-text-tertiary ml-1">lbs</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTensionChange('vertical', Math.min(MAX_TENSION, item.tensionVertical + 1))}
                                        disabled={disabled}
                                        aria-label="增加竖线拉力"
                                        className={`w-10 h-10 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center text-lg font-bold text-text-secondary hover:bg-ink disabled:opacity-50 ${item.tensionVertical >= MAX_TENSION - MIN_DIFF ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                                        onClick={() => handleTensionChange('horizontal', Math.max(MIN_TENSION, item.tensionHorizontal - 1))}
                                        disabled={disabled}
                                        aria-label="减少横线拉力"
                                        className={`w-10 h-10 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center text-lg font-bold text-text-secondary hover:bg-ink disabled:opacity-50 ${item.tensionHorizontal <= MIN_TENSION ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center">
                                        <span className="text-2xl font-bold text-text-primary">{item.tensionHorizontal}</span>
                                        <span className="text-sm text-text-tertiary ml-1">lbs</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTensionChange('horizontal', Math.min(MAX_TENSION, item.tensionHorizontal + 1))}
                                        disabled={disabled}
                                        aria-label="增加横线拉力"
                                        className={`w-10 h-10 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center text-lg font-bold text-text-secondary hover:bg-ink disabled:opacity-50 ${item.tensionHorizontal >= Math.min(MAX_TENSION, item.tensionVertical + MAX_DIFF) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-[11px] text-text-tertiary">
                                差磅需在 0-3 磅之间，系统会自动监测异常。
                            </p>
                            {!diffValid && (
                                <p className="text-[11px] text-warning mt-1">
                                    当前差磅异常，请调整为 0-3 磅。
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 球拍信息（可选） */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            球拍信息（可选）
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
                            备注（可选）
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

/**
 * Memoized RacketItemCard to prevent unnecessary re-renders in multi-racket list.
 * Re-renders only when item data, index, template status, or disabled state changes.
 */
const RacketItemCard = memo(RacketItemCardComponent, (prevProps, nextProps) => {
    // 深度比较 item 对象的关键字段
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.racketPhoto === nextProps.item.racketPhoto &&
        prevProps.item.tensionVertical === nextProps.item.tensionVertical &&
        prevProps.item.tensionHorizontal === nextProps.item.tensionHorizontal &&
        prevProps.item.notes === nextProps.item.notes &&
        prevProps.item.photoStatus === nextProps.item.photoStatus &&
        prevProps.item.photoError === nextProps.item.photoError &&
        prevProps.index === nextProps.index &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.isTemplate === nextProps.isTemplate
    );
});

export default RacketItemCard;
