/**
 * 排序选择组件 (Sort Select)
 * 
 * 下拉选择排序方式：推荐、价格升序、价格降序、库存降序
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'stock_desc';

interface SortSelectProps {
    value: SortOption;
    onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'default', label: '推荐' },
    { value: 'price_asc', label: '价格低到高' },
    { value: 'price_desc', label: '价格高到低' },
    { value: 'stock_desc', label: '库存最多' },
];

export default function SortSelect({ value, onChange }: SortSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value) || SORT_OPTIONS[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-border-subtle rounded-xl text-sm font-bold text-text-secondary hover:bg-accent/5 hover:text-accent transition-all shadow-sm"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span>{selectedOption.label}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-1 w-36 bg-white border border-border-subtle rounded-xl shadow-lg z-20 overflow-hidden"
                    role="listbox"
                >
                    {SORT_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            role="option"
                            aria-selected={value === option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors font-bold ${value === option.value
                                ? 'bg-accent/10 text-accent'
                                : 'text-text-secondary hover:bg-accent/5 hover:text-accent'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
