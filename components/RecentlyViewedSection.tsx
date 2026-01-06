import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X, Heart } from 'lucide-react';
import { Listing } from '../types';
import { useStore } from '../context/StoreContext';

interface RecentlyViewedSectionProps {
  listings: Listing[];
  maxItems?: number;
  showClearButton?: boolean;
  compact?: boolean;
}

const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  listings,
  maxItems = 8,
  showClearButton = true,
  compact = false
}) => {
  const { currentUser, toggleFavorite } = useStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (listings.length === 0) {
    return null;
  }

  const displayedListings = listings.slice(0, maxItems);

  const handleClear = () => {
    localStorage.removeItem('pipit_recently_viewed');
    window.location.reload();
  };

  const isFavorite = (listingId: string) =>
    currentUser?.savedListingIds?.includes(listingId);

  return (
    <section className={compact ? 'py-2' : 'py-4'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#B8A395]" />
          <h2 className="text-sm font-medium text-[#6B5D52]">Recently Viewed</h2>
          <span className="text-xs text-[#B8A395]">({listings.length})</span>
        </div>
        {showClearButton && listings.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-[#B8A395] hover:text-[#E8725C] transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {displayedListings.map((listing) => (
          <div
            key={listing.id}
            className="flex-shrink-0 w-32 group relative"
            onMouseEnter={() => setHoveredId(listing.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Link to={`/listing/${listing.id}`}>
              <div className="aspect-square rounded-xl overflow-hidden bg-[#F5EDE6] mb-2 relative">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {listing.isSold && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded">SOLD</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#4A3F37] font-medium truncate">{listing.title}</p>
              <p className="text-xs text-[#2D9B8C] font-bold">${listing.price}</p>
            </Link>

            {/* Quick Action - Favorite */}
            {currentUser && hoveredId === listing.id && !listing.isSold && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(listing.id);
                }}
                className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md transition-all ${
                  isFavorite(listing.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/90 text-[#4A3F37] hover:bg-white'
                }`}
              >
                <Heart className={`w-3 h-3 ${isFavorite(listing.id) ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        ))}

        {/* View All Card (if more items exist) */}
        {listings.length > maxItems && (
          <Link
            to="/?tab=recent"
            className="flex-shrink-0 w-32 aspect-square rounded-xl bg-[#F5EDE6] flex flex-col items-center justify-center text-[#6B5D52] hover:bg-[#E8DDD4] transition-colors"
          >
            <span className="text-2xl mb-1">+{listings.length - maxItems}</span>
            <span className="text-xs">View all</span>
          </Link>
        )}
      </div>
    </section>
  );
};

export default RecentlyViewedSection;
