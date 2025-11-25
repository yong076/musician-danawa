import { getProductGroup, getProductGroupPrices } from '@/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Store, TrendingDown } from 'lucide-react';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    notFound();
  }

  const product = await getProductGroup(productId);

  if (!product) {
    notFound();
  }

  const prices = await getProductGroupPrices(productId);

  const minPrice = product.min_price || 0;
  const maxPrice = product.max_price || 0;
  const savings = maxPrice - minPrice;
  const savingsPercent = maxPrice > 0 ? ((savings / maxPrice) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>상품 목록으로</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-9xl">🎸</span>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  {product.category_name && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
                      {product.category_name}
                    </span>
                  )}
                  {product.brand && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                      {product.brand}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                {product.model && (
                  <p className="text-lg text-gray-600">
                    모델: {product.model}
                  </p>
                )}
              </div>

              {/* Price Info */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 mb-6">
                <div className="mb-4">
                  <p className="text-sm text-emerald-800 font-medium mb-1">최저가</p>
                  <p className="text-4xl font-bold text-emerald-900">
                    {minPrice.toLocaleString()}원
                  </p>
                </div>

                {savings > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">최대 절약 금액</p>
                      <p className="text-lg font-bold text-red-600">
                        {savings.toLocaleString()}원 ({savingsPercent}%)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Store Count */}
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <Store className="w-5 h-5" />
                <span>{product.store_count}개 쇼핑몰에서 판매 중</span>
              </div>

              {/* Specs (if available) */}
              {product.specs && typeof product.specs === 'object' && Object.keys(product.specs).length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">제품 사양</h2>
                  <dl className="grid grid-cols-2 gap-4">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm text-gray-600 mb-1">{key}</dt>
                        <dd className="text-sm font-medium text-gray-900">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">가격 비교</h2>
            <p className="text-gray-600 mt-1">
              {prices.length}개 쇼핑몰의 가격 정보
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {prices.length === 0 ? (
              <div className="px-8 py-12 text-center">
                <p className="text-gray-500">판매 중인 쇼핑몰이 없습니다.</p>
              </div>
            ) : (
              prices.map((price, index) => {
                const isLowest = index === 0;
                const priceDiff = price.price - minPrice;
                const priceDiffPercent = minPrice > 0 ? ((priceDiff / minPrice) * 100).toFixed(1) : 0;

                return (
                  <div
                    key={price.id}
                    className={`px-8 py-6 hover:bg-gray-50 transition-colors ${
                      isLowest ? 'bg-emerald-50 hover:bg-emerald-50' : ''
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {price.store_name}
                          </h3>
                          {isLowest && (
                            <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded">
                              최저가
                            </span>
                          )}
                          {price.in_stock ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              재고있음
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              품절
                            </span>
                          )}
                        </div>
                        {price.product_name && (
                          <p className="text-sm text-gray-600 mb-1">
                            {price.product_name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          수집일시: {new Date(price.scraped_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {price.price.toLocaleString()}원
                          </p>
                          {!isLowest && priceDiff > 0 && (
                            <p className="text-sm text-red-600">
                              +{priceDiff.toLocaleString()}원 ({priceDiffPercent}%)
                            </p>
                          )}
                        </div>

                        {price.product_url && (
                          <a
                            href={price.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            <span>구매하기</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Back to List */}
        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            다른 상품 보러가기
          </Link>
        </div>
      </main>
    </div>
  );
}
