'use client';

import { TrendingUp, ArrowRight } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
  modelCount: number;
  image?: string;
}

interface Store {
  id: number;
  name: string;
}

const trendingKeywords = ['펜더', '깁슨', 'PRS', '아이바네즈', '레스폴'];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured products
        const productsRes = await fetch('/api/products?limit=8');
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products || []);
        }

        // Fetch brands
        const brandsRes = await fetch('/api/brands?limit=5');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="mb-4 text-4xl md:text-5xl font-bold text-gray-900">
              일렉기타 가격 비교
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              10개 쇼핑몰의 가격을 실시간으로 비교하고 최저가를 찾아보세요
            </p>
          </div>

          <div className="mb-8">
            <SearchBar />
          </div>

          {/* Trending Keywords */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>인기 검색어</span>
            </div>
            {trendingKeywords.map((keyword) => (
              <Link
                key={keyword}
                href={`/products?search=${encodeURIComponent(keyword)}`}
                className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-emerald-600 hover:text-emerald-600 transition-all"
              >
                {keyword}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Section */}
      {brands.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">브랜드별 찾기</h2>
              <Link
                href="/brands"
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:opacity-70 transition-opacity"
              >
                전체보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${encodeURIComponent(brand.name)}`}
                  className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-600 transition-all"
                >
                  <div className="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                    {brand.image ? (
                      <img
                        src={brand.image}
                        alt={brand.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-4xl">🎸</span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {brand.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {brand.modelCount}개 모델
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop Links */}
      {stores.length > 0 && (
        <section className="py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">쇼핑몰별 찾기</h3>
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/products?store=${store.id}`}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-emerald-600 hover:text-emerald-600 transition-all"
                >
                  🎸 {store.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">추천 기타</h2>
              <Link
                href="/products"
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:opacity-70 transition-opacity"
              >
                전체보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl px-8 py-16 text-center overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4 text-white">
                모든 일렉기타를 한눈에
              </h2>
              <p className="text-lg text-emerald-50 mb-8 max-w-lg mx-auto">
                1,200개 이상의 기타를 비교하고 최저가를 찾아보세요
              </p>
              <Link
                href="/products"
                className="inline-block px-8 py-3.5 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
              >
                전체 상품 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎸</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">기타비교</div>
                  <div className="text-xs text-gray-500">Guitar Price Compare</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                국내 주요 악기 쇼핑몰 10곳의 일렉기타 가격을<br />
                한눈에 비교하고 최저가를 찾아보세요.
              </p>
            </div>

            <div>
              <h4 className="mb-3 font-semibold text-gray-900">메뉴</h4>
              <div className="space-y-2">
                <Link
                  href="/"
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  홈
                </Link>
                <Link
                  href="/products"
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  상품 리스트
                </Link>
                <Link
                  href="/brands"
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  브랜드
                </Link>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold text-gray-900">제휴 쇼핑몰</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>프리버드</div>
                <div>뮤지션마켓</div>
                <div>스쿨뮤직</div>
                <div>경은어쿠스틱</div>
                <div>기타랜드</div>
                <div className="text-xs text-gray-400 pt-2">외 5개 쇼핑몰</div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2025 기타비교. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
