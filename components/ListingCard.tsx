
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Scale, Clock, Heart } from 'lucide-react';
import SafetyBadge from './SafetyBadge';
import ImageWithSkeleton from './ImageWithSkeleton';
import { Listing } from '../types';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const { compareIds, toggleCompare, toggleFavorite, currentUser } = useStore();
  const { theme } = useTheme();
  const isSelected = compareIds.includes(listing.id);
  const isFavorite = currentUser?.savedListingIds?.includes(listing.id);

  // Simple heuristic for "New" badge based on mock string data
  const isNew = listing.createdAt.includes('hour') || listing.createdAt.includes('min') || listing.createdAt.includes('Just now');

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(listing.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  // --- RETRO THEME (Neo-Brutalism) ---
  if (theme === 'retro') {
    return (
      <Link 
        to={`/listing/${listing.id}`} 
        className="bg-white border-2 border-black p-2 hover:translate-y-1 hover:shadow-none shadow-retro transition-all group block h-full flex flex-col relative"
      >
        <div className="relative aspect-square bg-gray-100 border-b-2 border-black mb-2">
          <ImageWithSkeleton 
            src={listing.images[0]} 
            alt={listing.title} 
            className="w-full h-full grayscale-[20%] group-hover:grayscale-0 transition-all"
          />
          
          {listing.isSafetyVerified && (
             <div className="absolute top-2 right-2 bg-green-400 border-2 border-black px-2 py-0.5 text-[10px] font-bold text-black transform rotate-2">
               SAFE
             </div>
          )}

          {listing.isSold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white border-2 border-black text-xs font-bold px-3 py-1 transform -rotate-12">SOLD</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-sm text-black line-clamp-1 flex-1 pr-2">{listing.title}</h3>
            <span className="font-black text-sm text-black bg-yellow-300 px-1 border border-black">${listing.price}</span>
          </div>
          <div className="text-[10px] text-gray-600 font-bold uppercase mt-auto">
            {listing.condition} • {listing.distanceMiles}mi
          </div>
        </div>
      </Link>
    );
  }

  // --- HEIRLOOM THEME (Curated, Soft) ---
  if (theme === 'heirloom') {
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
            {/* Using description or category for subtitle to match image style slightly */}
            <p className="text-xs text-gray-400 mt-0.5">{listing.category.split('&')[0]}</p>
        </Link>
    );
  }

  // --- DEFAULT & MIDNIGHT THEMES ---
  return (
    <Link 
      to={`/listing/${listing.id}`} 
      className={`bg-bg-card rounded-card overflow-hidden border ${theme === 'midnight' ? 'border-gray-800' : 'border-gray-100'} shadow-sm hover:shadow-md transition-shadow group block h-full flex flex-col relative`}
    >
      <div className="relative aspect-square bg-gray-100">
        <ImageWithSkeleton 
          src={listing.images[0]} 
          alt={listing.title} 
          className="w-full h-full"
        />
        
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
           <SafetyBadge isVerified={listing.isSafetyVerified} size="sm" showLabel={false} />
           
           {!listing.isSold && (
             <button 
               onClick={handleCompareClick}
               className={`p-1.5 rounded-full backdrop-blur-sm transition-all ${isSelected ? 'bg-brand-600 text-white shadow-lg scale-110' : 'bg-white/80 text-gray-500 hover:bg-white hover:text-brand-600'}`}
             >
               <Scale className="w-4 h-4" />
             </button>
           )}
        </div>
        
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {isNew && !listing.isSold && (
                <div className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-btn shadow-sm flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" /> NEW
                </div>
            )}
            
            {listing.originalPrice && (
            <div className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-btn backdrop-blur-sm">
                {Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)}% OFF
            </div>
            )}
        </div>
        
        {listing.isSold && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-btn transform -rotate-12">SOLD</span>
          </div>
        )}
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className={`font-medium text-sm line-clamp-1 flex-1 pr-2 ${theme === 'midnight' ? 'text-gray-100' : 'text-gray-900'}`}>{listing.title}</h3>
          <span className="font-bold text-sm text-brand-600">${listing.price}</span>
        </div>
        
        <div className={`flex items-center text-xs mb-2 gap-1 ${theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>
          <MapPin className="w-3 h-3" />
          <span>{listing.distanceMiles}mi • {listing.locationZip}</span>
        </div>

        <div className="flex gap-1 flex-wrap mt-auto">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-btn ${theme === 'midnight' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {listing.condition}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-btn ${theme === 'midnight' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {listing.ageRange}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
