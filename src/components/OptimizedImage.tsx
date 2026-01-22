import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** 占位符背景色 */
  placeholderColor?: string;
  /** 是否启用 IntersectionObserver 懒加载 */
  lazy?: boolean;
  /** 进入视口多少距离开始加载 */
  rootMargin?: string;
}

/**
 * OptimizedImage 组件
 * 提供图片懒加载和渐进式加载体验
 *
 * @param src - 图片 URL
 * @param alt - 替代文本
 * @param placeholderColor - 加载时的占位背景色
 * @param lazy - 是否懒加载（默认 true）
 * @param rootMargin - IntersectionObserver 的 rootMargin
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  placeholderColor = 'bg-ink',
  lazy = true,
  rootMargin = '200px',
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!lazy || !imgRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [lazy, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${placeholderColor} ${className}`}
    >
      {/* 占位符/骨架屏 */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-text-tertiary">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* 实际图片 */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          loading={lazy ? 'lazy' : undefined}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
