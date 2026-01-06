import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, MapPin, Package, Truck } from 'lucide-react';
import ImageWithSkeleton from './ImageWithSkeleton';
import { Listing, TrustTier } from '../types';
import { useStore } from '../context/StoreContext';
import { TrustListingBadge } from './TrustBadge';

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const { toggleFavorite, currentUser, getUserById } = useStore();
  const isFavorite = currentUser?.savedListingIds?.includes(listing.id);
  const seller = getUserById(listing.userId);

  // Calculate discount if original price exists
  const discountPercent = listing.originalPrice
    ? Math.round((1 - listing.price / listing.originalPrice) * 100)
    : 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  // Pipit v2.0 Card - Matches DesignPreview spec
  return (
    <Link to={`/listing/${listing.id}`} className="block group">
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300 lg:hover:-translate-y-1 active:scale-[0.98] lg:active:scale-100"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #F5EDE6',
          boxShadow: '0 2px 8px rgba(30, 25, 20, 0.04), 0 4px 16px rgba(30, 25, 20, 0.04)'
        }}
      >
        {/* Image Container */}
        <div className="aspect-[4/3] relative overflow-hidden" style={{ backgroundColor: '#FFF8F3' }}>
          <ImageWithSkeleton
            src={listing.images[0]}
            alt={listing.title}
            className={`w-full h-full object-cover ${listing.isSold ? 'grayscale opacity-60' : ''}`}
          />

          {/* Price Badge - Bottom Left */}
          <div
            className="absolute bottom-3 left-3 px-3 py-1 rounded-full font-semibold"
            style={{
              backgroundColor: '#FFFFFF',
              fontFamily: "'DM Mono', monospace",
              color: '#4A3F37',
              boxShadow: '0 2px 8px rgba(30, 25, 20, 0.1)'
            }}
          >
            ${listing.price}
          </div>

          {/* Safety Badge - Top Left */}
          {listing.isSafetyVerified && !listing.isSold && (
            <div
              className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
              style={{ backgroundColor: '#10B981', color: 'white' }}
            >
              <Shield className="w-3 h-3" />
              Verified
            </div>
          )}

          {/* Bundle Badge - Top Left (below safety or alone) */}
          {listing.bundleEligible && !listing.isSold && !listing.isSafetyVerified && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
              <Package className="w-3 h-3" />
              {listing.bundleDiscount || 10}% bundle
            </div>
          )}

          {/* SOLD Badge - Top Left */}
          {listing.isSold && (
            <div
              className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: '#E8725C', color: 'white' }}
            >
              SOLD
            </div>
          )}

          {/* Save Button - Top Right (visible on hover for desktop) */}
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 p-2 rounded-xl shadow-sm transition-all ${
              isFavorite
                ? 'bg-[#E8725C] text-white opacity-100'
                : 'bg-white/90 hover:bg-white text-[#B8A395] lg:opacity-0 lg:group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content - Fixed height for consistent card sizing */}
        <div className="p-4 min-h-[100px] flex flex-col">
          <h3
            className="font-semibold truncate transition-colors group-hover:text-[#2D9B8C]"
            style={{ color: '#4A3F37' }}
          >
            {listing.title}
          </h3>

          {/* Seller with Trust Badge */}
          {seller && (
            <div className="mt-1">
              <TrustListingBadge
                tier={seller.trustTier || TrustTier.BASIC}
                sellerName={seller.name}
                rating={seller.averageRating}
                reviewCount={seller.reviewCount}
              />
            </div>
          )}

          {/* Original Price & Discount - or spacer for consistent height */}
          <div className="h-5 mt-1">
            {listing.originalPrice && discountPercent > 0 && (
              <div className="flex items-baseline gap-2">
                <span className="text-sm line-through" style={{ color: '#B8A395' }}>
                  ${listing.originalPrice}
                </span>
                <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                  {discountPercent}% off
                </span>
              </div>
            )}
          </div>

          {/* Condition, Distance & Shipping - pushed to bottom */}
          <div className="flex items-center gap-2 mt-auto text-sm flex-wrap" style={{ color: '#9A8578' }}>
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{ backgroundColor: '#FFF4D9', color: '#B45309' }}
            >
              {listing.condition}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.distanceMiles} mi
            </span>
            {listing.offersShipping && (
              <>
                <span>·</span>
                <span
                  className="flex items-center gap-0.5 text-xs font-medium"
                  style={{ color: listing.shippingPrice === 0 ? '#10B981' : '#2D9B8C' }}
                >
                  <Truck className="w-3 h-3" />
                  {listing.shippingPrice === 0 ? 'Free Ship' : 'Ships'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
