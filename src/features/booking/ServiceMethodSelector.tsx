/**
 * 服务方式选择器 (Service Method Selector)
 * 
 * 允许用户选择服务方式：
 * - 到店自取/自送 (in_store)
 * - 上门取送 (pickup_delivery)
 * 
 * 选择上门取送时，显示地址输入框
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Store, Truck, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export type ServiceType = 'in_store' | 'pickup_delivery';

interface ServiceMethodSelectorProps {
    value: ServiceType;
    onChange: (value: ServiceType) => void;
    pickupAddress: string;
    onAddressChange: (address: string) => void;
    defaultAddress?: string; // 用户个人资料中的地址
    disabled?: boolean;
}

const serviceOptions = [
    {
        id: 'in_store' as ServiceType,
        icon: Store,
        title: '到店自取',
        description: '您自行送拍到店，穿线完成后自取',
    },
    {
        id: 'pickup_delivery' as ServiceType,
        icon: Truck,
        title: '上门取送',
        description: '专人上门取拍，穿线完成后送回府上',
    },
];

export default function ServiceMethodSelector({
    value,
    onChange,
    pickupAddress,
    onAddressChange,
    defaultAddress = '',
    disabled = false,
}: ServiceMethodSelectorProps) {
    const [showAddressInput, setShowAddressInput] = useState(value === 'pickup_delivery');

    // 当选择上门取送时，如果地址为空，填充默认地址
    useEffect(() => {
        if (value === 'pickup_delivery' && !pickupAddress && defaultAddress) {
            onAddressChange(defaultAddress);
        }
        setShowAddressInput(value === 'pickup_delivery');
    }, [value, pickupAddress, defaultAddress, onAddressChange]);

    const handleSelect = (type: ServiceType) => {
        if (disabled) return;
        onChange(type);
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
                服务方式
            </label>

            {/* 服务方式选择卡片 */}
            <div className="grid grid-cols-2 gap-3">
                {serviceOptions.map((option) => {
                    const isSelected = value === option.id;
                    const Icon = option.icon;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelect(option.id)}
                            disabled={disabled}
                            className={`
                relative p-4 rounded-xl border-2 transition-all text-left
                ${isSelected
                                    ? 'border-orange-500 bg-orange-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
                        >
                            {/* 选中标记 */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}

                            {/* 图标 */}
                            <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center mb-3
                ${isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}
              `}>
                                <Icon className="w-5 h-5" />
                            </div>

                            {/* 标题和描述 */}
                            <p className={`font-medium ${isSelected ? 'text-orange-700' : 'text-gray-900'}`}>
                                {option.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {option.description}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* 地址输入区域 - 仅在选择上门取送时显示 */}
            {showAddressInput && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-orange-700">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">取拍地址</span>
                    </div>

                    <textarea
                        value={pickupAddress}
                        onChange={(e) => onAddressChange(e.target.value)}
                        placeholder="请输入完整地址，例如：XX花园 1号楼 2单元 301室"
                        disabled={disabled}
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-lg border border-orange-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none text-sm"
                    />

                    {defaultAddress && pickupAddress !== defaultAddress && (
                        <button
                            type="button"
                            onClick={() => onAddressChange(defaultAddress)}
                            className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                            <span>使用个人资料地址</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
