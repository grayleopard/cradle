import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import {
  ChevronLeft,
  Heart,
  Bell,
  BellOff,
  Trash2,
  TrendingDown,
  DollarSign,
  Clock,
  Filter,
  SortAsc
} from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { WishlistItem, Listing } from '../types';

type SortOption = 'newest' | 'price_low' | 'price_high' | 'price_drop';
type FilterOption = 'all' | 'available' | 'price_dropped';

const Wishlist = () => {
  const navigate = useNavigate();
  const { currentUser, listings, removeFromWishlist, updateWishlistAlertSettings, getWishlistItem } = useStore();
  const { showToast } = useToast();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Get wishlist items with their listings
  const wishlistWithListings = useMemo(() => {
    if (!currentUser?.wishlist) return [];

    return currentUser.wishlist
      .map(wishItem => {
        const listing = listings.find(l => l.id === wishItem.listingId);
        if (!listing) return null;

        const priceDrop = wishItem.priceWhenSaved - listing.price;
        const priceDropPercent = priceDrop > 0 ? Math.round((priceDrop / wishItem.priceWhenSaved) * 100) : 0;

        return {
          wishItem,
          listing,
          priceDrop,
          priceDropPercent,
          isAvailable: !listing.isSold
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [currentUser?.wishlist, listings]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let items = wishlistWithListings;

    switch (filterBy) {
      case 'available':
        items = items.filter(i => i.isAvailable);
        break;
      case 'price_dropped':
        items = items.filter(i => i.priceDrop > 0);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        items = [...items].sort((a, b) =>
          new Date(b.wishItem.savedAt).getTime() - new Date(a.wishItem.savedAt).getTime()
        );
        break;
      case 'price_low':
        items = [...items].sort((a, b) => a.listing.price - b.listing.price);
        break;
      case 'price_high':
        items = [...items].sort((a, b) => b.listing.price - a.listing.price);
        break;
      case 'price_drop':
        items = [...items].sort((a, b) => b.priceDropPercent - a.priceDropPercent);
        break;
    }

    return items;
  }, [wishlistWithListings, filterBy, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const available = wishlistWithListings.filter(i => i.isAvailable).length;
    const priceDropped = wishlistWithListings.filter(i => i.priceDrop > 0).length;
    const totalSavings = wishlistWithListings.reduce((sum, i) => sum + Math.max(0, i.priceDrop), 0);
    return { total: wishlistWithListings.length, available, priceDropped, totalSavings };
  }, [wishlistWithListings]);

  const handleToggleAlert = (listingId: string, currentSetting: boolean) => {
    updateWishlistAlertSettings(listingId, !currentSetting);
    showToast(
      !currentSetting ? 'Price alerts enabled' : 'Price alerts disabled',
      'success'
    );
  };

  const handleRemove = (listingId: string) => {
    removeFromWishlist(listingId);
    showToast('Removed from wishlist', 'success');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFFCF9] flex items-center justify-center p-6">
        <div className="text-center">
          <Heart className="w-16 h-16 text-[#E8DDD4] mx-auto mb-4" />
          <h1 className="font-serif text-xl font-bold text-[#4A3F37] mb-2">Sign in to view your wishlist</h1>
          <Link to="/profile" className="text-[#2D9B8C] font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF9] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#FFFCF9]/95 backdrop-blur-sm border-b border-[#E8DDD4]">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#F5EDE6] rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold font-serif text-xl text-[#4A3F37]">My Wishlist 💕</h1>
            <p className="text-xs text-[#B8A395]">{stats.total} items saved</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Stats Cards */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-[#E8DDD4] p-3 text-center">
              <Heart className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-[#4A3F37]">{stats.available}</p>
              <p className="text-[10px] text-[#B8A395]">Available</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E8DDD4] p-3 text-center">
              <TrendingDown className="w-4 h-4 text-[#2D9B8C] mx-auto mb-1" />
              <p className="text-lg font-bold text-[#4A3F37]">{stats.priceDropped}</p>
              <p className="text-[10px] text-[#B8A395]">Price Drops</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E8DDD4] p-3 text-center">
              <DollarSign className="w-4 h-4 text-[#E8B44C] mx-auto mb-1" />
              <p className="text-lg font-bold text-[#4A3F37]">${stats.totalSavings}</p>
              <p className="text-[10px] text-[#B8A395]">Potential Savings</p>
            </div>
          </div>
        )}

        {/* Filters & Sort */}
        {stats.total > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterBy('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterBy === 'all'
                    ? 'bg-[#2D9B8C] text-white'
                    : 'bg-[#F5EDE6] text-[#6B5D52] hover:bg-[#E8DDD4]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterBy('available')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterBy === 'available'
                    ? 'bg-[#2D9B8C] text-white'
                    : 'bg-[#F5EDE6] text-[#6B5D52] hover:bg-[#E8DDD4]'
                }`}
              >
                Available
              </button>
              <button
                onClick={() => setFilterBy('price_dropped')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterBy === 'price_dropped'
                    ? 'bg-[#2D9B8C] text-white'
                    : 'bg-[#F5EDE6] text-[#6B5D52] hover:bg-[#E8DDD4]'
                }`}
              >
                <TrendingDown className="w-3 h-3" /> Dropped
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#F5EDE6] text-[#6B5D52] rounded-full text-xs font-medium hover:bg-[#E8DDD4] transition-colors"
              >
                <SortAsc className="w-3 h-3" />
                Sort
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl border border-[#E8DDD4] shadow-lg z-10">
                  {[
                    { key: 'newest', label: 'Newest First' },
                    { key: 'price_low', label: 'Price: Low to High' },
                    { key: 'price_high', label: 'Price: High to Low' },
                    { key: 'price_drop', label: 'Biggest Drops' }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortBy(opt.key as SortOption);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        sortBy === opt.key
                          ? 'bg-[#2D9B8C]/10 text-[#2D9B8C] font-medium'
                          : 'text-[#4A3F37] hover:bg-[#F5EDE6]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wishlist Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-[#E8DDD4] mx-auto mb-4" />
            <h2 className="font-serif text-lg font-bold text-[#4A3F37] mb-2">
              {stats.total === 0 ? 'Your wishlist is empty' : 'No items match your filter'}
            </h2>
            <p className="text-sm text-[#B8A395] mb-4">
              {stats.total === 0
                ? 'Save items you love and get notified when prices drop!'
                : 'Try changing your filter settings'}
            </p>
            {stats.total === 0 && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D9B8C] text-white rounded-full text-sm font-medium hover:bg-[#247A6F] transition-colors"
              >
                Browse Listings
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(({ wishItem, listing, priceDrop, priceDropPercent, isAvailable }) => (
              <div
                key={wishItem.listingId}
                className={`bg-white rounded-2xl border border-[#E8DDD4] p-4 ${
                  !isAvailable ? 'opacity-60' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <Link to={`/listing/${listing.id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#F5EDE6] relative">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded">
                            SOLD
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/listing/${listing.id}`}>
                      <h3 className="font-medium text-[#4A3F37] truncate hover:text-[#2D9B8C] transition-colors">
                        {listing.title}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold text-[#2D9B8C]">${listing.price}</span>
                      {priceDrop > 0 && (
                        <>
                          <span className="text-sm text-[#B8A395] line-through">
                            ${wishItem.priceWhenSaved}
                          </span>
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                            -{priceDropPercent}%
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-[#B8A395]">
                      <Clock className="w-3 h-3" />
                      Saved {new Date(wishItem.savedAt).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleToggleAlert(listing.id, wishItem.alertOnPriceDrop)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          wishItem.alertOnPriceDrop
                            ? 'bg-[#2D9B8C]/10 text-[#2D9B8C]'
                            : 'bg-[#F5EDE6] text-[#6B5D52]'
                        }`}
                      >
                        {wishItem.alertOnPriceDrop ? (
                          <>
                            <Bell className="w-3 h-3" /> Alerts On
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3 h-3" /> Alerts Off
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRemove(listing.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#F5EDE6] text-[#6B5D52] rounded-full text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
