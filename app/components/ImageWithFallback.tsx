'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
}: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  // 이미지 로드 실패시 기타 이모지 표시
  if (didError || !src) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <span className="text-6xl">🎸</span>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        onError={handleError}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 400}
      height={height || 300}
      className={className}
      onError={handleError}
      unoptimized
    />
  );
}
