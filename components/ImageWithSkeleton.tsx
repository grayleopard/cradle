import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({ className, src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-10">
          <ImageIcon className="w-8 h-8 text-gray-400 opacity-50" />
        </div>
      )}
      
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => { setIsLoaded(true); setHasError(true); }}
          {...props}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
           <span className="text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default ImageWithSkeleton;