/**
 * 拉力输入组件 (Tension Input)
 * 
 * 输入球线拉力值，支持滑块同步、竖横线独立设置、推荐值一键使用、视觉磅数分级提示等。
 * 包含专业限制：横线需高于竖线，差磅需在 1-3 磅之间。
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components';

interface TensionInputProps {
  tension: number | null;
  crossTension: number | null;
  onTensionChange: (vertical: number, horizontal: number) => void;
  recommendedTension?: number | null;
  error?: string;
}

export default function TensionInput({
  tension,
  crossTension: initialCrossTension,
  onTensionChange,
  recommendedTension,
  error
}: TensionInputProps) {
  const MIN_TENSION = 18;
  const MAX_TENSION = 30;
  const MIN_DIFF = 1;
  const MAX_DIFF = 3;
  const commonTensions = [20, 22, 24, 26, 28];
  const [isAdvanced, setIsAdvanced] = useState(initialCrossTension !== null && initialCrossTension !== tension);
  const [mainTension, setMainTension] = useState<number>(tension || 24);
  const [crossTension, setCrossTension] = useState<number>(initialCrossTension || tension || 24);

  /**
   * Normalize tensions to keep difference within 1-3 lbs in advanced mode.
   * @param main - Vertical tension value.
   * @param cross - Horizontal tension value.
   * @returns Clamped vertical/horizontal values with valid diff range.
   */
  const normalizeAdvanced = (main: number, cross: number) => {
    const clampedMain = Math.max(MIN_TENSION, Math.min(MAX_TENSION - MIN_DIFF, main));
    const minCross = clampedMain + MIN_DIFF;
    const maxCross = Math.min(MAX_TENSION, clampedMain + MAX_DIFF);
    const clampedCross = Math.max(minCross, Math.min(maxCross, cross));
    return { main: clampedMain, cross: clampedCross, minCross, maxCross };
  };

  // 同步外部状态
  useEffect(() => {
    if (tension && !isAdvanced) {
      setMainTension(tension);
      setCrossTension(tension);
    }
  }, [tension, isAdvanced]);

  // Advanced 模式下同步差磅范围
  useEffect(() => {
    if (!isAdvanced) return;
    const normalized = normalizeAdvanced(mainTension, crossTension);
    if (normalized.main !== mainTension || normalized.cross !== crossTension) {
      setMainTension(normalized.main);
      setCrossTension(normalized.cross);
      onTensionChange(normalized.main, normalized.cross);
    }
  }, [isAdvanced, mainTension, crossTension, onTensionChange]);

  // 当竖线下发生变化时，如果非高级模式，自动同步横线并通知外部
  const handleMainChange = (val: number) => {
    const clampedMain = Math.max(MIN_TENSION, Math.min(MAX_TENSION, val));

    if (!isAdvanced) {
      setMainTension(clampedMain);
      setCrossTension(clampedMain);
      onTensionChange(clampedMain, clampedMain);
    } else {
      const normalized = normalizeAdvanced(clampedMain, crossTension);
      setMainTension(normalized.main);
      setCrossTension(normalized.cross);
      onTensionChange(normalized.main, normalized.cross);
    }
  };

  const handleCrossChange = (val: number) => {
    const clampedCross = Math.max(MIN_TENSION, Math.min(MAX_TENSION, val));

    // 限制：横线需高于竖线，差磅控制在 1-3 磅
    const normalized = normalizeAdvanced(mainTension, clampedCross);

    setMainTension(normalized.main);
    setCrossTension(normalized.cross);
    onTensionChange(normalized.main, normalized.cross);
  };

  // 根据磅数返回颜色分级 (18 - 30)
  const getGaugeColor = (val: number) => {
    if (val <= 22) return 'bg-emerald-500';
    if (val <= 25) return 'bg-blue-500';
    if (val <= 28) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTensionDescription = (val: number) => {
    if (val <= 22) return '初学者：弹性极佳，保护手臂';
    if (val <= 25) return '进阶选：控制平稳，发力均衡';
    if (val <= 28) return '专业级：落点精准，需要发力';
    return '极速控：极致控制，容易断线';
  };

  return (
    <div className="space-y-6">
      {/* 推荐值 (如果有) */}
      {recommendedTension && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-text-tertiary">基于历史订单推荐：</span>
          <button
            type="button"
            onClick={() => handleMainChange(recommendedTension)}
            className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
          >
            {recommendedTension} lbs (一键使用)
          </button>
        </div>
      )}

      {/* 主面板 (竖线) */}
      <Card variant="elevated" className="p-6 border-border-subtle shadow-md bg-white">
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-extrabold text-text-primary">
                {isAdvanced ? '竖线拉力 (Vertical)' : '设定拉力 (Tension)'}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm ${getGaugeColor(mainTension)}`}>
                {mainTension} LBS
              </span>
            </div>
            <p className="text-sm font-medium text-text-secondary">
              {getTensionDescription(mainTension)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">分拉模式</span>
            <button
              onClick={() => setIsAdvanced(!isAdvanced)}
              className={`w-12 h-6 rounded-full transition-all relative ${isAdvanced ? 'bg-accent shadow-glow' : 'bg-ink-surface border border-border-subtle'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isAdvanced ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
            <div className="relative h-3 w-full bg-ink-surface/50 rounded-full overflow-hidden border border-border-subtle">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-300 opacity-40 shadow-inner ${getGaugeColor(mainTension)}`}
              style={{ width: `${((mainTension - MIN_TENSION) / (MAX_TENSION - MIN_TENSION)) * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={MIN_TENSION}
            max={MAX_TENSION}
            step="1"
            value={mainTension}
            onChange={(e) => handleMainChange(parseInt(e.target.value))}
            className="w-full h-3 bg-transparent appearance-none cursor-pointer accent-accent relative z-10 -mt-[42px]"
          />
          <div className="flex justify-between px-1 text-[10px] text-text-tertiary font-bold font-mono">
            <span>18</span><span>21</span><span>24</span><span>27</span><span>30</span>
          </div>
        </div>
      </Card>

      {/* 高级模式：横线拉力 */}
      {isAdvanced && (
        <Card variant="elevated" className="p-6 border-border-subtle shadow-md bg-white animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-extrabold text-text-primary">
                  横线拉力 (Cross)
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm ${getGaugeColor(crossTension)}`}>
                  {crossTension} LBS
                </span>
              </div>
              <p className="text-sm font-medium text-text-secondary">
                建议：横线通常比竖线高 1-2 磅（差磅 1-3 磅）
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative h-3 w-full bg-ink-surface/50 rounded-full overflow-hidden border border-border-subtle">
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-300 opacity-40 shadow-inner ${getGaugeColor(crossTension)}`}
                style={{ width: `${((crossTension - MIN_TENSION) / (MAX_TENSION - MIN_TENSION)) * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={MIN_TENSION}
              max={MAX_TENSION}
              step="1"
              value={crossTension}
              onChange={(e) => handleCrossChange(parseInt(e.target.value))}
              className="w-full h-3 bg-transparent appearance-none cursor-pointer accent-accent relative z-10 -mt-[42px]"
            />
            <div className="flex justify-between px-1 text-[10px] text-text-tertiary font-bold font-mono">
              <span>{mainTension + MIN_DIFF} (min)</span>
              <span className="text-accent">当前可调范围</span>
              <span>{Math.min(MAX_TENSION, mainTension + MAX_DIFF)} (max)</span>
            </div>

            <div className="bg-accent/5 border border-accent/10 rounded-lg p-3 mt-2">
              <p className="text-[11px] text-accent/80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                专业限制：横线需高于竖线，差值需在 1-3 磅，系统自动监测异常。
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 常用拉力快捷选择 (仅在非高级模式下显示) */}
      {!isAdvanced && (
        <div className="px-1">
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            快速预设
          </label>
          <div className="flex flex-wrap gap-2">
            {commonTensions.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleMainChange(value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mainTension === value
                  ? 'bg-accent text-white shadow-glow ring-2 ring-accent/20 scale-105'
                  : 'bg-ink-elevated text-text-secondary hover:bg-ink-surface'
                  }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="text-red-500 text-xs px-1 animate-pulse">
          ⚠️ {error}
        </p>
      )}

      {/* 默认勾选项 */}
      <div className="flex items-center gap-2 px-1 py-1">
        <input type="checkbox" id="saveDefault" className="w-4 h-4 accent-accent rounded" defaultChecked />
        <label htmlFor="saveDefault" className="text-sm text-text-secondary cursor-pointer">
          设为我的常用拉力
        </label>
      </div>

      {/* 拉力参考科普 */}
      <div className="text-[11px] text-text-tertiary leading-relaxed px-1 space-y-1 mt-4">
        <p>💡 <strong>小知识：</strong> 高磅位（26+）能提供更精准的控制，但弹性会降低，且对体力要求更高。</p>
        <p>⚠️ <strong>注意：</strong> 磅数越高，球线在剧烈击球时断裂的风险越大。</p>
      </div>
    </div>
  );
}
