'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { FilterPanel } from '../components/FilterPanel';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';

interface Product {
  id: number;
  name: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  originalPrice?: number;
  discountRate?: number;
  image: string;
  reviewCount?: number;
}

interface Brand {
  id: string;
  name: string;
  productCount?: number;
}

interface Store {
  id: number;
  name: string;
}

type SortOption = 'price-low' | 'price-high' | 'new' | 'reviews' | 'discount';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('price-low');
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const initialBrand = searchParams.get('brand');
  const initialStore = searchParams.get('store');
  const initialSearch = searchParams.get('search');

  const [filters, setFilters] = useState({
    priceRange: [0, 10000000] as [number, number],
    selectedBrands: initialBrand ? [initialBrand] : ([] as string[]),
    selectedShapes: [] as string[],
    selectedStores: initialStore ? [Number(initialStore)] : ([] as number[]),
    minDiscountRate: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsRes = await fetch('/api/products?limit=100');
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products || []);
        }

        // Fetch brands
        const brandsRes = await fetch('/api/brands');
        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          setBrands(brandsData.brands || []);
        }

        // Fetch stores
        const storesRes = await fetch('/api/stores');
        if (storesRes.ok) {
          const storesData = await storesRes.json();
          setStores(storesData.stores || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortOptions = [
    { value: 'price-low', label: '최저가순' },
    { value: 'price-high', label: '최고가순' },
    { value: 'new', label: '신상품순' },
    { value: 'reviews', label: '리뷰 많은 순' },
    { value: 'discount', label: '할인율 높은순' },
  ];

  // Filter and sort products
  const filteredProducts = products.filter((product) => {
    // Search filter
    if (initialSearch) {
      const searchLower = initialSearch.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Price filter
    if (product.minPrice < filters.priceRange[0] || product.minPrice > filters.priceRange[1]) {
      return false;
    }

    // Brand filter
    if (filters.selectedBrands.length > 0 && !filters.selectedBrands.includes(product.brand)) {
      return false;
    }

    // Discount filter
    if (filters.minDiscountRate > 0) {
      if (!product.discountRate || product.discountRate < filters.minDiscountRate) {
        return false;
      }
    }

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.minPrice - b.minPrice;
      case 'price-high':
        return b.minPrice - a.minPrice;
      case 'new':
        return b.id - a.id;
      case 'reviews':
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      case 'discount':
        return (b.discountRate || 0) - (a.discountRate || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">일렉기타 목록</h2>
            <p className="text-sm text-gray-500 mt-1">총 {sortedProducts.length}개의 상품</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none cursor-pointer hover:border-gray-300"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-2.5 bg-white border border-gray-200 rounded-lg flex items-center gap-2 text-gray-900"
            >
              <SlidersHorizontal className="w-4 h-4" />
              필터
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div className="lg:sticky lg:top-24">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                brands={brands}
                stores={stores}
              />
            </div>
          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20 bg-white rounded-xl">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl">
                <p className="text-gray-500">조건에 맞는 상품이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
