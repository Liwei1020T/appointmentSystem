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

import React, { useState, useEffect, useId } from 'react';
import { Store, Truck, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export type ServiceType = 'in_store' | 'pickup_delivery';

interface ServiceMethodSelectorProps {
    value: ServiceType;
    onChange: (value: ServiceType) => void;
    pickupAddress: string;
    onAddressChange: (address: string) => void;
    defaultAddress?: string; // 用户个人资料中的地址
    savedAddresses?: string[]; // 常用地址（本地缓存）
    onSelectSaved?: (address: string) => void;
    addressError?: string | null;
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
    savedAddresses = [],
    onSelectSaved,
    addressError = null,
    disabled = false,
}: ServiceMethodSelectorProps) {
    const [showAddressInput, setShowAddressInput] = useState(value === 'pickup_delivery');
    const addressErrorId = useId();

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
            <label className="block text-sm font-medium text-text-secondary">
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
                                    ? 'border-accent-border bg-accent-soft shadow-md'
                                    : 'border-border-subtle bg-ink-surface hover:border-accent-border hover:shadow-sm'
                                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
                        >
                            {/* 选中标记 */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}

                            {/* 图标 */}
                            <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center mb-3
                ${isSelected ? 'bg-accent text-text-onAccent' : 'bg-ink text-text-tertiary'}
              `}>
                                <Icon className="w-5 h-5" />
                            </div>

                            {/* 标题和描述 */}
                            <p className={`font-medium ${isSelected ? 'text-text-primary' : 'text-text-primary'}`}>
                                {option.title}
                            </p>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                {option.description}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* 地址输入区域 - 仅在选择上门取送时显示 */}
            {showAddressInput && (
                <div className="p-4 bg-accent-soft rounded-xl border border-accent-border space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-accent">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">取拍地址</span>
                    </div>

                    <textarea
                        value={pickupAddress}
                        onChange={(e) => onAddressChange(e.target.value)}
                        placeholder="请输入完整地址，例如：XX花园 1号楼 2单元 301室"
                        disabled={disabled}
                        rows={2}
                        aria-invalid={!!addressError}
                        aria-describedby={addressError ? addressErrorId : undefined}
                        className="w-full px-3 py-2.5 rounded-lg border border-border-subtle bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-border resize-none text-sm"
                    />
                    {addressError && (
                        <p id={addressErrorId} className="text-xs text-danger">
                            {addressError}
                        </p>
                    )}

                    {defaultAddress && pickupAddress !== defaultAddress && (
                        <button
                            type="button"
                            onClick={() => onAddressChange(defaultAddress)}
                            className="text-xs text-accent hover:text-accent/80 flex items-center gap-1"
                        >
                            <span>使用个人资料地址</span>
                        </button>
                    )}

                    {savedAddresses.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-text-tertiary">常用地址</p>
                            <div className="flex flex-wrap gap-2">
                                {savedAddresses.map((address) => (
                                    <button
                                        key={address}
                                        type="button"
                                        onClick={() => onSelectSaved?.(address)}
                                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${pickupAddress === address
                                            ? 'border-accent bg-accent/10 text-accent'
                                            : 'border-border-subtle text-text-secondary hover:text-accent'
                                            }`}
                                    >
                                        {address}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
