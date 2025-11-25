'use client';

import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';

interface FilterPanelProps {
  filters: {
    priceRange: [number, number];
    selectedBrands: string[];
    selectedShapes: string[];
    selectedStores: number[];
    minDiscountRate: number;
  };
  onFilterChange: (filters: any) => void;
  brands: Array<{ id: string; name: string; productCount?: number }>;
  stores: Array<{ id: number; name: string }>;
}

const guitarShapes = [
  'Stratocaster',
  'Telecaster',
  'Les Paul',
  'SG',
  'Jazzmaster',
  'Jaguar',
  'Flying V',
  'Explorer',
  'Superstrat',
];

export function FilterPanel({ filters, onFilterChange, brands, stores }: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    brand: true,
    shape: false,
    store: false,
    discount: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleBrand = (brandName: string) => {
    const newBrands = filters.selectedBrands.includes(brandName)
      ? filters.selectedBrands.filter((b) => b !== brandName)
      : [...filters.selectedBrands, brandName];
    onFilterChange({ ...filters, selectedBrands: newBrands });
  };

  const toggleShape = (shape: string) => {
    const newShapes = filters.selectedShapes.includes(shape)
      ? filters.selectedShapes.filter((s) => s !== shape)
      : [...filters.selectedShapes, shape];
    onFilterChange({ ...filters, selectedShapes: newShapes });
  };

  const toggleStore = (storeId: number) => {
    const newStores = filters.selectedStores.includes(storeId)
      ? filters.selectedStores.filter((s) => s !== storeId)
      : [...filters.selectedStores, storeId];
    onFilterChange({ ...filters, selectedStores: newStores });
  };

  const resetFilters = () => {
    onFilterChange({
      priceRange: [0, 10000000],
      selectedBrands: [],
      selectedShapes: [],
      selectedStores: [],
      minDiscountRate: 0,
    });
  };

  const hasActiveFilters =
    filters.selectedBrands.length > 0 ||
    filters.selectedShapes.length > 0 ||
    filters.selectedStores.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 10000000 ||
    filters.minDiscountRate > 0;

  const formatPrice = (price: number) => {
    return (price / 10000).toFixed(0) + '만원';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900">필터</h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-sm text-emerald-600 hover:opacity-70"
          >
            <X className="w-4 h-4" />
            초기화
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Price Range */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="font-medium text-gray-900">가격대</span>
            {expandedSections.price ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.price && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      priceRange: [Number(e.target.value), filters.priceRange[1]],
                    })
                  }
                  placeholder="최소"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600"
                />
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      priceRange: [filters.priceRange[0], Number(e.target.value)],
                    })
                  }
                  placeholder="최대"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600"
                />
              </div>
              <div className="text-xs text-gray-500">
                {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Brand Filter */}
        <div>
          <button
            onClick={() => toggleSection('brand')}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="font-medium text-gray-900">브랜드</span>
            {expandedSections.brand ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.brand && (
            <div className="space-y-2.5">
              {brands.slice(0, 8).map((brand) => (
                <label key={brand.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.selectedBrands.includes(brand.name)}
                    onChange={() => toggleBrand(brand.name)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {brand.name}
                  </span>
                  {brand.productCount !== undefined && (
                    <span className="text-xs text-gray-400 ml-auto">{brand.productCount}</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Shape Filter */}
        <div>
          <button
            onClick={() => toggleSection('shape')}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="font-medium text-gray-900">기타 형태</span>
            {expandedSections.shape ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.shape && (
            <div className="flex flex-wrap gap-2">
              {guitarShapes.map((shape) => (
                <button
                  key={shape}
                  onClick={() => toggleShape(shape)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    filters.selectedShapes.includes(shape)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Discount Filter */}
        <div>
          <button
            onClick={() => toggleSection('discount')}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="font-medium text-gray-900">할인율</span>
            {expandedSections.discount ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.discount && (
            <div className="flex flex-wrap gap-2">
              {[0, 10, 20, 30].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onFilterChange({ ...filters, minDiscountRate: rate })}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    filters.minDiscountRate === rate
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {rate === 0 ? '전체' : `${rate}% 이상`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Store Filter */}
        <div>
          <button
            onClick={() => toggleSection('store')}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="font-medium text-gray-900">쇼핑몰</span>
            {expandedSections.store ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.store && (
            <div className="space-y-2.5">
              {stores.map((store) => (
                <label key={store.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.selectedStores.includes(store.id)}
                    onChange={() => toggleStore(store.id)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    🎸 {store.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
