import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ImageWithSkeleton from './ImageWithSkeleton';
import { Listing } from '../types';
import { useStore } from '../context/StoreContext';

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const { toggleFavorite, currentUser } = useStore();
  const isFavorite = currentUser?.savedListingIds?.includes(listing.id);

  // Simple heuristic for "New" badge based on mock string data
  const isNew = listing.createdAt.includes('hour') || listing.createdAt.includes('min') || listing.createdAt.includes('Just now');

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  // Heirloom Theme Card
  return (
    <Link to={`/listing/${listing.id}`} className="block group">
      <div className="relative aspect-[4/5] bg-[#F5EBE0] rounded-[1.5rem] overflow-hidden mb-3">
        <ImageWithSkeleton
          src={listing.images[0]}
          alt={listing.title}
          className="w-full h-full"
        />

        {/* Heart Icon Bottom Right */}
        <button
          onClick={handleFavoriteClick}
          className="absolute bottom-3 right-3 text-[#C68E68] hover:scale-110 transition-transform"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Status Badges Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isNew && !listing.isSold && (
            <span className="bg-[#C68E68] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">NEW</span>
          )}
          {listing.isSold && (
            <span className="bg-[#B07D5B] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">SOLD</span>
          )}
        </div>
      </div>

      <h3 className="font-sans text-sm text-[#2F3E2E] line-clamp-1">{listing.title}</h3>
      <p className="text-xs text-gray-400 mt-0.5">{listing.category.split('&')[0]}</p>
    </Link>
  );
};

export default ListingCard;
