import React from 'react';

const ListingCardSkeleton: React.FC = () => {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5EDE6' }}
    >
      {/* Image skeleton with shimmer */}
      <div
        className="aspect-[4/3]"
        style={{
          background: 'linear-gradient(90deg, #FFF8F3 0%, #FFFCF9 50%, #FFF8F3 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite'
        }}
      />
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-4 rounded-full w-3/4" style={{ backgroundColor: '#F5EDE6' }} />
        <div className="h-5 rounded-full w-1/3" style={{ backgroundColor: '#F5EDE6' }} />
        <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: '#F5EDE6' }} />
      </div>

      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default ListingCardSkeleton;
