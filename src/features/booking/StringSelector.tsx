/**
 * 球线选择组件 (String Selector)
 * 
 * 显示所有可用球线，支持品牌筛选和搜索
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Input, Card, Badge, Spinner } from '@/components';
import { getAvailableStrings, getBrands } from '@/services/inventoryService';
import { StringInventory } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface StringSelectorProps {
  selectedString: StringInventory | null;
  onSelect: (string: StringInventory) => void;
}

export default function StringSelector({ selectedString, onSelect }: StringSelectorProps) {
  const [strings, setStrings] = useState<StringInventory[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadStrings();
  }, [selectedBrand]);

  const loadData = async () => {
    setLoading(true);
    const [stringsResult, brandsResult] = await Promise.all([
      getAvailableStrings(),
      getBrands(),
    ]);

    if (stringsResult.strings) {
      setStrings(stringsResult.strings);
    }

    if (brandsResult.brands) {
      setBrands(brandsResult.brands);
    }

    setLoading(false);
  };

  const loadStrings = async () => {
    const { strings: data } = await getAvailableStrings(selectedBrand || undefined);
    if (data) {
      setStrings(data);
    }
  };

  const filteredStrings = strings.filter((string) => {
    const search = searchTerm.toLowerCase();
    return (
      string.brand.toLowerCase().includes(search) ||
      string.model.toLowerCase().includes(search) ||
      string.specification?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <Card>
        <div className="p-6 flex items-center justify-center">
          <Spinner size="medium" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <Input
        placeholder="搜索球线（品牌、型号、规格）"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        leftIcon={
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        }
      />

      {/* 品牌筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedBrand('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedBrand === ''
              ? 'bg-accent text-text-onAccent'
              : 'bg-ink-elevated text-text-secondary hover:bg-ink-surface'
          }`}
        >
          全部
        </button>
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(brand)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedBrand === brand
                ? 'bg-accent text-text-onAccent'
                : 'bg-ink-elevated text-text-secondary hover:bg-ink-surface'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* 球线列表 */}
      {filteredStrings.length === 0 ? (
        <Card>
          <div className="p-6 text-center text-text-tertiary">
            <p>没有找到球线</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStrings.map((string) => (
            <Card
              key={string.id}
              onClick={() => onSelect(string)}
              className={`cursor-pointer transition-all ${
                selectedString?.id === string.id
                  ? 'ring-2 ring-accent-border bg-ink-elevated'
                  : 'hover:bg-ink-elevated/70'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">
                      {string.brand} {string.model}
                    </h3>
                    {string.specification && (
                      <p className="text-sm text-text-secondary mt-1">
                        {string.specification}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={string.stock < 5 ? 'warning' : 'success'}>
                        库存: {string.stock}
                      </Badge>
                      {string.stock < 5 && (
                        <span className="text-xs text-warning">库存紧张</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-accent font-mono">
                        {formatCurrency(Number(string.sellingPrice) || 0)}
                    </p>
                    {string.costPrice && (
                      <p className="text-xs text-text-tertiary line-through">
                        {formatCurrency(Number(string.costPrice))}
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedString?.id === string.id && (
                  <div className="mt-3 pt-3 border-t border-accent-border">
                    <div className="flex items-center text-sm text-accent">
                      <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      已选择
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
