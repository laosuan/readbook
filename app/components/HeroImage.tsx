'use client';

import Image from 'next/image';
import { useState } from 'react';

interface HeroImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function HeroImage({ src, alt, width, height, className }: HeroImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  
  const handleError = () => {
    // 如果图片加载失败，显示一个占位符
    setImgSrc('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22500%22%20height%3D%22300%22%20viewBox%3D%220%200%20500%20300%22%3E%3Crect%20fill%3D%22%23f0f0f0%22%20width%3D%22500%22%20height%3D%22300%22%2F%3E%3Ctext%20fill%3D%22%23999%22%20font-family%3D%22Arial%2CSans-serif%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20x%3D%22250%22%20y%3D%22150%22%3E%E9%98%85%E8%AF%8D%E5%90%8D%E8%91%97%3C%2Ftext%3E%3C%2Fsvg%3E');
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
} 