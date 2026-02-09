import { useState } from 'react';

interface AvatarProps {
  src: string;
  alt: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

/**
 * Avatar component with fallback to initials on image error
 * Handles external image loading failures gracefully
 */
export function Avatar({ src, alt, initials, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fallbackInitials = initials || alt.slice(0, 2).toUpperCase();

  return (
    <div
      className={`relative overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center font-semibold text-white ${sizeClasses[size]} ${className}`}
    >
      {!imageError && !imageLoaded && (
        <span className="animate-pulse">{fallbackInitials}</span>
      )}

      {!imageError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}

      {imageError && (
        <span>{fallbackInitials}</span>
      )}
    </div>
  );
}
