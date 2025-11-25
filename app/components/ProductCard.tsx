'use client';

import { Heart, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { ImageWithFallback } from './ImageWithFallback';

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

interface ProductCardProps {
  product: Product;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

export function ProductCard({ product, isFavorite = false, onToggleFavorite }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const priceGap = product.maxPrice - product.minPrice;
  const hasDiscount = product.discountRate && product.discountRate > 0;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group cursor-pointer bg-white rounded-xl border border-gray-200 hover:border-emerald-600 transition-all duration-300 overflow-hidden hover:shadow-lg">
        {/* Image Section */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden flex items-center justify-center">
          {product.image && product.image !== '/placeholder-guitar.jpg' ? (
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <span className="text-6xl">🎸</span>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-md flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{product.discountRate}%</span>
            </div>
          )}

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              className={`absolute top-3 right-3 p-2 rounded-full transition-all shadow-sm ${
                isFavorite
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/90 text-gray-600 hover:bg-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Brand Badge */}
          <div className="mb-2">
            <span className="inline-block text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              {product.brand}
            </span>
          </div>

          {/* Product Name */}
          <h4 className="mb-3 text-sm leading-snug line-clamp-2 min-h-[2.5rem] text-gray-900">
            {product.name}
          </h4>

          {/* Price Section */}
          <div className="space-y-1">
            {/* Original Price (if discount) */}
            {hasDiscount && product.originalPrice && (
              <div className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}원
              </div>
            )}

            {/* Current Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-600">
                {formatPrice(product.minPrice)}
              </span>
              <span className="text-sm font-medium text-gray-900">원</span>
            </div>

            {/* Price Gap */}
            {priceGap > 0 && (
              <div className="text-xs text-gray-500">
                최대 {formatPrice(priceGap)}원 차이
              </div>
            )}
          </div>

          {/* Review Count */}
          {product.reviewCount && product.reviewCount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                리뷰 {product.reviewCount}개
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
