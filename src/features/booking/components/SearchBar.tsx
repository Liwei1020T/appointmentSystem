/**
 * 搜索框组件 (Search Bar)
 * 
 * 用于搜索球线（品牌、型号、规格）
 * 支持防抖处理，减少不必要的过滤操作
 */

'use client';

import React, { useCallback, useState } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
}

export default function SearchBar({
    value,
    onChange,
    placeholder = '搜索球线（品牌、型号、规格）',
    debounceMs = 300,
}: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setLocalValue(newValue);

            // Clear previous debounce timer
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            // Set new debounce timer
            debounceRef.current = setTimeout(() => {
                onChange(newValue);
            }, debounceMs);
        },
        [onChange, debounceMs]
    );

    const handleClear = useCallback(() => {
        setLocalValue('');
        onChange('');
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
    }, [onChange]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Sync local value with external value
    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <div className="relative">
            {/* Search Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                    className="w-5 h-5 text-text-tertiary"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Input */}
            <input
                type="text"
                value={localValue}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full h-12 pl-10 pr-10 bg-ink-elevated border border-border-subtle rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-border focus:border-transparent transition-all"
                aria-label={placeholder}
            />

            {/* Clear Button */}
            {localValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-ink transition-colors"
                    aria-label="清除搜索"
                >
                    <svg
                        className="w-4 h-4 text-text-tertiary"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
