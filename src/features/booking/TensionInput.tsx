/**
 * 拉力输入组件 (Tension Input)
 * 
 * 输入球线拉力值，支持验证范围（通常 18-30 磅）
 */

'use client';

import React from 'react';
import { Input } from '@/components';

interface TensionInputProps {
  tension: number | null;
  onTensionChange: (tension: number) => void;
  error?: string;
}

export default function TensionInput({ tension, onTensionChange, error }: TensionInputProps) {
  const commonTensions = [20, 22, 24, 26, 28];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      onTensionChange(value);
    } else if (e.target.value === '') {
      onTensionChange(0);
    }
  };

  const handlePresetClick = (value: number) => {
    onTensionChange(value);
  };

  return (
    <div className="space-y-4">
      {/* 拉力输入框 */}
      <Input
        label="拉力 (磅) Tension (lbs)"
        type="number"
        value={tension || ''}
        onChange={handleChange}
        placeholder="输入拉力值 (18-30)"
        error={error}
        helperText="建议范围：18-30 磅"
        min={18}
        max={30}
        required
      />

      {/* 常用拉力快捷选择 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          常用拉力
        </label>
        <div className="grid grid-cols-5 gap-2">
          {commonTensions.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handlePresetClick(value)}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                tension === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* 拉力参考提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">拉力参考</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>18-22 磅</strong>: 初学者，弹性好，手感柔</li>
          <li>• <strong>23-25 磅</strong>: 进阶选手，控制与弹性平衡</li>
          <li>• <strong>26-28 磅</strong>: 高手，精准控制，爆发力强</li>
          <li>• <strong>29-30 磅</strong>: 专业选手，极致控制</li>
        </ul>
      </div>
    </div>
  );
}
