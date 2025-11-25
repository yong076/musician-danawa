'use client';

import { Heart, Search } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎸</span>
            </div>
            <div>
              <div className="font-bold text-gray-900">기타비교</div>
              <div className="text-xs text-gray-500">Guitar Price Compare</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
              홈
            </Link>
            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
              상품 리스트
            </Link>
            <Link href="/brands" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
              브랜드
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link
              href="/favorites"
              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Heart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
