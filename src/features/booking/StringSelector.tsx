/**
 * 球线选择组件 (String Selector) - Refactored
 * 
 * 显示所有可用球线，支持品牌筛选、搜索和排序
 * 包含完整的状态处理：Loading、Empty、Error
 */

'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getAvailableStrings, getBrands } from '@/services/inventoryService';
import { StringInventory } from '@/types';
import {
  SearchBar,
  BrandTabs,
  SortSelect,
  StringCard,
  StickySelectionBar,
  type SortOption,
} from './components';

interface StringSelectorProps {
  selectedString: StringInventory | null;
  onSelect: (string: StringInventory | null) => void;
  onNext: () => void;
}

export default function StringSelector({ selectedString, onSelect, onNext }: StringSelectorProps) {
  // Data state
  const [strings, setStrings] = useState<StringInventory[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Filter state
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [stringsResult, brandsResult] = await Promise.all([
        getAvailableStrings(),
        getBrands(),
      ]);

      if (stringsResult.error) {
        setError(stringsResult.error);
        return;
      }

      if (stringsResult.strings) {
        setStrings(stringsResult.strings);
      }

      if (brandsResult.brands) {
        setBrands(brandsResult.brands);
      }
    } catch (err) {
      setError('加载球线数据失败，请重试');
      console.error('Failed to load strings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload strings when brand changes
  useEffect(() => {
    const loadStrings = async () => {
      try {
        const { strings: data, error: err } = await getAvailableStrings(selectedBrand || undefined);
        if (err) {
          setError(err);
          return;
        }
        if (data) {
          setStrings(data);
        }
      } catch (err) {
        console.error('Failed to load strings by brand:', err);
      }
    };

    if (!loading) {
      loadStrings();
    }
  }, [selectedBrand, loading]);

  // Filter and sort strings
  const filteredStrings = useMemo(() => {
    let result = [...strings];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter((string) => {
        const description = (string as any).description?.toLowerCase() || '';
        return (
          string.brand.toLowerCase().includes(search) ||
          string.model.toLowerCase().includes(search) ||
          string.specification?.toLowerCase().includes(search) ||
          description.includes(search)
        );
      });
    }

    // Apply sorting
    switch (sortOption) {
      case 'price_asc':
        result.sort((a, b) => {
          const priceA = Number(a.sellingPrice) || Number(a.selling_price) || 0;
          const priceB = Number(b.sellingPrice) || Number(b.selling_price) || 0;
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        result.sort((a, b) => {
          const priceA = Number(a.sellingPrice) || Number(a.selling_price) || 0;
          const priceB = Number(b.sellingPrice) || Number(b.selling_price) || 0;
          return priceB - priceA;
        });
        break;
      case 'stock_desc':
        result.sort((a, b) => b.stock - a.stock);
        break;
      default:
        // Default: in-stock first, then by brand/model
        result.sort((a, b) => {
          if (a.stock === 0 && b.stock > 0) return 1;
          if (a.stock > 0 && b.stock === 0) return -1;
          return a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model);
        });
    }

    return result;
  }, [strings, searchTerm, sortOption]);

  // Handle selection
  const handleSelect = useCallback((string: StringInventory) => {
    // Toggle selection: click again to deselect
    if (selectedString?.id === string.id) {
      onSelect(null);
    } else {
      onSelect(string);
    }
  }, [selectedString, onSelect]);

  const handleClearSelection = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search skeleton */}
        <div className="h-12 bg-ink-elevated rounded-xl animate-pulse" />

        {/* Brand tabs skeleton */}
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-20 bg-ink-elevated rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>

        {/* Card skeletons */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-ink-elevated rounded-2xl animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-ink-surface rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-ink-surface rounded w-3/4" />
                  <div className="h-4 bg-ink-surface rounded w-1/2" />
                  <div className="h-6 bg-ink-surface rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky bar placeholder */}
        <div className="h-24" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-8 bg-ink-elevated rounded-2xl text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-accent text-text-onAccent rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            点击重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
      />

      {/* Brand Tabs and Sort */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 overflow-hidden">
          <BrandTabs
            brands={brands}
            selectedBrand={selectedBrand}
            onSelect={setSelectedBrand}
          />
        </div>
        <div className="flex-shrink-0">
          <SortSelect
            value={sortOption}
            onChange={setSortOption}
          />
        </div>
      </div>

      {/* String List */}
      {filteredStrings.length === 0 ? (
        /* Empty state */
        <div className="p-8 bg-ink-elevated rounded-2xl text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-ink-surface flex items-center justify-center">
            <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-text-secondary">没有找到球线</p>
          {(searchTerm || selectedBrand) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBrand('');
              }}
              className="mt-3 text-sm text-accent hover:underline"
            >
              清除筛选条件
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3" role="radiogroup" aria-label="球线列表">
          {filteredStrings.map((string) => (
            <StringCard
              key={string.id}
              string={string}
              isSelected={selectedString?.id === string.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Sticky Selection Bar */}
      <StickySelectionBar
        selectedString={selectedString}
        onClearSelection={handleClearSelection}
        onNext={onNext}
      />
    </div>
  );
}
