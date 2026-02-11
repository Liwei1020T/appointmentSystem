import Image from 'next/image';

type BaseImageProps = Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height' | 'unoptimized'>;

interface AppImageProps extends BaseImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  unoptimized?: boolean;
}

/**
 * AppImage
 * - Defaults to `unoptimized` to support current mixed image sources (CDN/blob/local) safely.
 * - Provides fallback width/height so existing `className`-driven layouts can migrate from `<img>` quickly.
 */
export function AppImage({
  src,
  alt,
  width = 1200,
  height = 1200,
  unoptimized = true,
  ...props
}: AppImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized={unoptimized}
      {...props}
    />
  );
}

export default AppImage;
