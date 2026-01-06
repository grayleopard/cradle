import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Search, X, ChevronDown, MapPin, ArrowUpDown, Clock, SlidersHorizontal, TrendingUp, Tag, History, Sparkles, Heart, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import ListingCardSkeleton from '../components/ListingCardSkeleton';
import { Category, Condition, AgeRange, Listing } from '../types';
import { fuzzyMatch, scoreListing, getSearchSuggestions, POPULAR_SEARCHES } from '../utils/fuzzySearch';
import { getRecommendedListings } from '../utils/recommendations';

const CONDITION_OPTIONS = [
  { key: Condition.LIKE_NEW, label: 'Like New' },
  { key: Condition.EXCELLENT, label: 'Excellent' },
  { key: Condition.VERY_GOOD, label: 'Very Good' },
  { key: Condition.GOOD, label: 'Good' },
  { key: Condition.FAIR, label: 'Fair' },
];

const AGE_RANGE_OPTIONS = [
  { key: AgeRange.ZERO_TO_SIX_MO, label: '0-6 months' },
  { key: AgeRange.SIX_TO_TWELVE_MO, label: '6-12 months' },
  { key: AgeRange.TWELVE_TO_EIGHTEEN_MO, label: '12-18 months' },
  { key: AgeRange.EIGHTEEN_TO_TWENTY_FOUR_MO, label: '18-24 months' },
  { key: AgeRange.TWO_TO_THREE_YR, label: '2-3 years' },
  { key: AgeRange.THREE_TO_FIVE_YR, label: '3-5 years' },
  { key: AgeRange.FIVE_PLUS, label: '5+ years' },
];

type SortOption = 'closest' | 'newest' | 'price_asc' | 'price_desc' | 'relevance';

// Category chip definitions
const CATEGORY_CHIPS = [
  { key: 'All', label: 'All' },
  { key: Category.GEAR, label: 'Baby Gear' },
  { key: Category.STROLLERS, label: 'Strollers' },
  { key: Category.CRIBS, label: 'Nursery' },
  { key: Category.CAR_SEATS, label: 'Car Seats' },
  { key: Category.TOYS, label: 'Toys' },
  { key: Category.CLOTHING, label: 'Clothing' },
  { key: Category.FEEDING, label: 'Feeding' },
  { key: Category.CARRIERS, label: 'Carriers' },
  { key: Category.SAFETY, label: 'Safety' },
];

const RADIUS_OPTIONS = [5, 15, 25, 50];

const getGreeting = (name?: string) => {
  const hour = new Date().getHours();
  const firstName = name?.split(' ')[0] || 'there';
  if (hour < 12) return `Good morning, ${firstName} 👋`;
  if (hour < 17) return `Good afternoon, ${firstName} 👋`;
  return `Good evening, ${firstName} 👋`;
};

const Home = () => {
  const { listings, currentUser, getUserById } = useStore();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<AgeRange[]>([]);
  const [shipsOnly, setShipsOnly] = useState(false);
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Load recent searches and recently viewed from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('pipit_recent_searches');
    if (savedSearches) setRecentSearches(JSON.parse(savedSearches).slice(0, 5));

    const savedViewed = localStorage.getItem('pipit_recently_viewed');
    if (savedViewed) setRecentlyViewed(JSON.parse(savedViewed).slice(0, 8));
  }, []);

  // Sort option labels - relevance only shown when searching
  const SORT_OPTIONS: { key: SortOption; label: string }[] = searchTerm
    ? [
        { key: 'relevance', label: 'Best Match' },
        { key: 'newest', label: 'Newest First' },
        { key: 'price_asc', label: 'Price: Low to High' },
        { key: 'price_desc', label: 'Price: High to Low' },
        { key: 'closest', label: 'Closest to You' },
      ]
    : [
        { key: 'newest', label: 'Newest First' },
        { key: 'price_asc', label: 'Price: Low to High' },
        { key: 'price_desc', label: 'Price: High to Low' },
        { key: 'closest', label: 'Closest to You' },
      ];

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (showSearchModal) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearchModal]);

  // Get default location
  const userCity = currentUser?.neighborhood || 'Auburn';
  const listingsCount = listings.filter(l => !l.isSold).length;

  // Count active filters
  const activeFilterCount = (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + selectedConditions.length + selectedAgeRanges.length + (shipsOnly ? 1 : 0) + (freeShippingOnly ? 1 : 0);

  // Filter listings with fuzzy search support
  const filteredListings = useMemo(() => {
    const availableListings = listings.filter(l => !l.isSold);

    // Apply filters
    const filtered = availableListings.filter(l => {
      // Fuzzy search matching - checks title, description, brand, and category
      const matchesSearch = !searchTerm ||
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.brand && l.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        fuzzyMatch(searchTerm, l.title) ||
        (l.brand && fuzzyMatch(searchTerm, l.brand)) ||
        fuzzyMatch(searchTerm, l.category);

      const matchesCategory = selectedCategory === 'All' || l.category === selectedCategory;
      const matchesRadius = l.distanceMiles <= selectedRadius;
      const matchesPriceMin = !priceMin || l.price >= parseInt(priceMin);
      const matchesPriceMax = !priceMax || l.price <= parseInt(priceMax);
      const matchesCondition = selectedConditions.length === 0 || selectedConditions.includes(l.condition);
      const matchesAgeRange = selectedAgeRanges.length === 0 || selectedAgeRanges.includes(l.ageRange);
      const matchesShipping = !shipsOnly || l.offersShipping;
      const matchesFreeShipping = !freeShippingOnly || (l.offersShipping && l.shippingPrice === 0);

      return matchesSearch && matchesCategory && matchesRadius && matchesPriceMin && matchesPriceMax && matchesCondition && matchesAgeRange && matchesShipping && matchesFreeShipping;
    });

    // Calculate relevance scores if searching
    const listingsWithScores = searchTerm
      ? filtered.map(l => ({
          listing: l,
          score: scoreListing(searchTerm, l)
        }))
      : filtered.map(l => ({ listing: l, score: 0 }));

    // Sort by selected option
    const effectiveSortBy = searchTerm && sortBy === 'relevance' ? 'relevance' : sortBy;

    listingsWithScores.sort((a, b) => {
      switch (effectiveSortBy) {
        case 'relevance': return b.score - a.score;
        case 'closest': return a.listing.distanceMiles - b.listing.distanceMiles;
        case 'newest': return 0; // Assuming listings are already in newest-first order
        case 'price_asc': return a.listing.price - b.listing.price;
        case 'price_desc': return b.listing.price - a.listing.price;
        default: return 0;
      }
    });

    return listingsWithScores.map(item => item.listing);
  }, [listings, searchTerm, selectedCategory, selectedRadius, priceMin, priceMax, selectedConditions, selectedAgeRanges, sortBy, shipsOnly, freeShippingOnly]);

  // Get listings from followed users
  const followingListings = currentUser?.followingIds?.length
    ? listings.filter(l => !l.isSold && currentUser.followingIds?.includes(l.userId))
    : [];

  // Get recently viewed listings
  const recentlyViewedListings = recentlyViewed
    .map(id => listings.find(l => l.id === id))
    .filter((l): l is Listing => l !== undefined && !l.isSold)
    .slice(0, 4);

  // Get personalized recommendations
  const recommendedListings = useMemo(() => {
    if (!currentUser) return [];
    return getRecommendedListings(listings, currentUser, recentlyViewed, {
      limit: 8,
      excludeIds: recentlyViewed // Don't show recently viewed in recommendations
    });
  }, [listings, currentUser, recentlyViewed]);

  // Get search suggestions based on current input
  const searchSuggestions = useMemo(() => {
    return getSearchSuggestions(searchTerm, recentSearches, 6);
  }, [searchTerm, recentSearches]);

  // Handle search submission with loading state
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setShowSearchModal(false);

    // Auto-select relevance sort when searching
    if (term.trim()) {
      setSortBy('relevance');
    }

    // Show brief loading state for search results
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);

    // Save to recent searches
    if (term.trim()) {
      const updated = [term, ...recentSearches.filter(s => s.toLowerCase() !== term.toLowerCase())].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('pipit_recent_searches', JSON.stringify(updated));
    }
  };

  // Handle category change with loading state
  const handleCategoryChange = (category: Category | 'All') => {
    setSelectedCategory(category);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 200);
  };

  const handleRadiusSelect = (radius: number) => {
    setSelectedRadius(radius);
    setShowRadiusPicker(false);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
    showToast(`Showing listings within ${radius} miles`, 'success');
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="min-h-full bg-[#FFFCF9] pb-24">
      {/* Header - Mobile only (desktop uses Layout.tsx nav) */}
      <header className="sticky top-0 z-40 bg-[#FFFCF9] border-b border-[#E8DDD4]/50 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐦</span>
            <span className="font-serif text-xl font-bold text-[#4A3F37]">pipit</span>
          </Link>

          {/* Right: Search + Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2.5 rounded-full bg-white border border-[#E8DDD4] text-[#4A3F37] hover:bg-[#F5EDE6] transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            {currentUser ? (
              <Link to="/profile">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-[#E8DDD4]"
                />
              </Link>
            ) : (
              <Link
                to="#"
                onClick={(e) => { e.preventDefault(); setShowSearchModal(true); }}
                className="p-2.5 rounded-full bg-white border border-[#E8DDD4] text-[#4A3F37]"
              >
                <span className="text-lg">👤</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Search Icon - appears in top right on large screens */}
      <div className="hidden lg:flex justify-end px-8 pt-2">
        <button
          onClick={() => setShowSearchModal(true)}
          className="p-2.5 rounded-full bg-white border border-[#E8DDD4] text-[#4A3F37] hover:bg-[#F5EDE6] transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Greeting Section */}
      <section className="px-4 pt-6 pb-2">
        {currentUser ? (
          <>
            <h1 className="font-serif text-2xl text-[#4A3F37] mb-2">
              {getGreeting(currentUser.name)}
            </h1>
            <button
              onClick={() => setShowRadiusPicker(true)}
              className="flex items-center gap-1.5 text-sm text-[#6B5D52] hover:text-[#4A3F37] transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#2D9B8C]" />
              <span>Within {selectedRadius} mi of {userCity}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <h1 className="font-serif text-2xl text-[#4A3F37] mb-2">
              Welcome to Pipit 👋
            </h1>
            <button
              onClick={() => setShowRadiusPicker(true)}
              className="flex items-center gap-1.5 text-sm text-[#6B5D52] hover:text-[#4A3F37] transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#2D9B8C]" />
              <span>{listingsCount} listings near {userCity}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </>
        )}
      </section>

      {/* Category Chips */}
      <section className="px-4 pt-6">
        <div
          ref={categoryScrollRef}
          className="flex gap-2 overflow-x-auto no-scrollbar pb-2"
        >
          {CATEGORY_CHIPS.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key as Category | 'All')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.key
                  ? 'bg-[#2D9B8C] text-white shadow-sm'
                  : 'bg-white border border-[#E8DDD4] text-[#6B5D52] hover:border-[#2D9B8C] hover:text-[#4A3F37]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort & Filter Buttons */}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => setShowFilterModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeFilterCount > 0
                ? 'bg-[#2D9B8C] text-white'
                : 'text-[#6B5D52] hover:bg-[#F5EDE6]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{activeFilterCount}</span>
            )}
          </button>
          <button
            onClick={() => setShowSortPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#6B5D52] hover:bg-[#F5EDE6] transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>{SORT_OPTIONS.find(o => o.key === sortBy)?.label}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* Recently Viewed Section */}
      {recentlyViewedListings.length > 0 && !searchTerm && selectedCategory === 'All' && (
        <section className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B8A395]" />
              <h2 className="text-sm font-medium text-[#6B5D52]">Recently Viewed</h2>
            </div>
            <button
              onClick={() => {
                setRecentlyViewed([]);
                localStorage.removeItem('pipit_recently_viewed');
                showToast('History cleared', 'success');
              }}
              className="text-[10px] text-[#B8A395] hover:text-[#E8725C] transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {recentlyViewedListings.map((listing) => (
              <Link
                key={listing.id}
                to={`/listing/${listing.id}`}
                className="flex-shrink-0 w-32 group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-[#F5EDE6] mb-2 relative">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {currentUser?.savedListingIds?.includes(listing.id) && (
                    <div className="absolute top-1.5 right-1.5 p-1 bg-red-500 rounded-full">
                      <Heart className="w-2.5 h-2.5 text-white fill-current" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#4A3F37] font-medium truncate">{listing.title}</p>
                <p className="text-xs text-[#2D9B8C] font-bold">${listing.price}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommended For You Section */}
      {recommendedListings.length > 0 && !searchTerm && selectedCategory === 'All' && (
        <section className="px-4 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E8B44C]" />
              <div>
                <h2 className="font-serif text-base font-bold text-[#4A3F37]">Recommended For You</h2>
                <p className="text-[10px] text-[#B8A395]">Based on what you like</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {recommendedListings.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Guest CTA */}
      {!currentUser && (
        <section className="px-4 pt-4">
          <div className="bg-[#FFF8F3] border border-[#E8B44C]/30 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-[#6B5D52]">
              Sign up to save favorites and get personalized recommendations
            </p>
            <Link
              to="/profile"
              className="text-sm font-bold text-[#2D9B8C] hover:underline flex-shrink-0 ml-2"
            >
              Sign up
            </Link>
          </div>
        </section>
      )}

      {/* Active Search Banner */}
      {searchTerm && (
        <section className="px-4 pt-4">
          <div className="bg-[#F5EDE6] border border-[#E8DDD4] rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-[#4A3F37]">
              Results for "<span className="font-semibold">{searchTerm}</span>"
            </span>
            <button
              onClick={clearSearch}
              className="text-xs font-bold text-[#2D9B8C] flex items-center gap-1 hover:underline"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
        </section>
      )}

      {/* Listing Grid */}
      <section className="px-4 pt-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {isLoading || isSearching ? (
            [...Array(6)].map((_, i) => <ListingCardSkeleton key={i} />)
          ) : filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">🐦</div>
              {searchTerm ? (
                <>
                  <h3 className="font-serif text-xl text-[#4A3F37] mb-2">No results found</h3>
                  <p className="text-sm text-[#6B5D52] max-w-xs mb-4">
                    We couldn't find anything matching "{searchTerm}"
                  </p>
                  <button
                    onClick={clearSearch}
                    className="px-6 py-2.5 bg-[#2D9B8C] text-white rounded-full font-medium text-sm hover:bg-[#247A6F] transition-colors"
                  >
                    Clear Search
                  </button>
                </>
              ) : selectedCategory !== 'All' ? (
                <>
                  <h3 className="font-serif text-xl text-[#4A3F37] mb-2">No {selectedCategory} listings nearby</h3>
                  <p className="text-sm text-[#6B5D52] max-w-xs mb-4">
                    Try expanding your search radius or check back soon.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRadiusPicker(true)}
                      className="px-6 py-2.5 bg-[#2D9B8C] text-white rounded-full font-medium text-sm hover:bg-[#247A6F] transition-colors"
                    >
                      Expand Radius
                    </button>
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className="px-6 py-2.5 bg-white border border-[#E8DDD4] text-[#4A3F37] rounded-full font-medium text-sm hover:bg-[#F5EDE6] transition-colors"
                    >
                      Clear Filter
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-serif text-xl text-[#4A3F37] mb-2">No listings near you yet!</h3>
                  <p className="text-sm text-[#6B5D52] max-w-xs mb-4">
                    Be the first parent in {userCity} to list something.
                  </p>
                  <Link
                    to="/sell"
                    className="px-6 py-2.5 bg-[#2D9B8C] text-white rounded-full font-medium text-sm hover:bg-[#247A6F] transition-colors"
                  >
                    Create a Listing
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* From Parents You Follow Section */}
      {currentUser && followingListings.length > 0 && !searchTerm && selectedCategory === 'All' && (
        <section className="px-4 pt-8">
          {/* Section Divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-[#E8DDD4]" />
            <span className="text-sm font-medium text-[#6B5D52]">From parents you follow</span>
            <div className="flex-1 h-px bg-[#E8DDD4]" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {followingListings.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {followingListings.length > 4 && (
            <div className="text-center mt-4">
              <button className="text-sm font-bold text-[#2D9B8C] hover:underline">
                See all {followingListings.length} →
              </button>
            </div>
          )}
        </section>
      )}

      {/* Search Dropdown */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 bg-black/20 animate-in fade-in duration-150"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="absolute top-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-2xl shadow-warm-lg border border-[#E8DDD4] overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-[#E8DDD4]">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8A395]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search baby gear..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch(searchTerm);
                      if (e.key === 'Escape') setShowSearchModal(false);
                    }}
                    className="w-full pl-9 pr-8 py-2.5 bg-[#F5EDE6] rounded-xl text-sm text-[#4A3F37] placeholder:text-[#B8A395] focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#E8DDD4] text-[#B8A395] hover:text-[#4A3F37] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleSearch(searchTerm)}
                  className="px-4 py-2.5 bg-[#2D9B8C] text-white rounded-xl text-sm font-medium hover:bg-[#247A6F] transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Search Suggestions */}
            <div className="max-h-72 overflow-y-auto">
              {searchTerm ? (
                // Show smart suggestions while typing
                searchSuggestions.length > 0 ? (
                  <div className="p-2">
                    {searchSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearch(suggestion.term)}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#4A3F37] hover:bg-[#F5EDE6] transition-colors flex items-center gap-2 group"
                      >
                        {suggestion.type === 'recent' ? (
                          <History className="w-3.5 h-3.5 text-[#B8A395] group-hover:text-[#2D9B8C]" />
                        ) : suggestion.type === 'brand' ? (
                          <Tag className="w-3.5 h-3.5 text-[#2D9B8C]" />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5 text-[#E8B44C]" />
                        )}
                        <span className={suggestion.type === 'brand' ? 'font-medium' : ''}>
                          {suggestion.term}
                        </span>
                        {suggestion.type === 'brand' && (
                          <span className="ml-auto text-[10px] text-[#B8A395] uppercase">Brand</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <Search className="w-8 h-8 text-[#E8DDD4] mx-auto mb-2" />
                    <p className="text-xs text-[#B8A395]">No suggestions found</p>
                  </div>
                )
              ) : (
                // Show recent searches and popular when empty
                <div className="p-2">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <>
                      <div className="flex items-center justify-between px-2 mb-1">
                        <p className="text-[10px] font-bold text-[#B8A395] uppercase tracking-wide">
                          Recent
                        </p>
                        <button
                          onClick={() => {
                            setRecentSearches([]);
                            localStorage.removeItem('pipit_recent_searches');
                          }}
                          className="text-[10px] text-[#B8A395] hover:text-[#E8725C] transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      {recentSearches.slice(0, 5).map((search, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSearch(search)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#4A3F37] hover:bg-[#F5EDE6] transition-colors flex items-center gap-2 group"
                        >
                          <History className="w-3.5 h-3.5 text-[#B8A395] group-hover:text-[#2D9B8C]" />
                          {search}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Popular Searches */}
                  <div className="mt-3">
                    <p className="px-2 mb-1 text-[10px] font-bold text-[#B8A395] uppercase tracking-wide">
                      Popular
                    </p>
                    <div className="flex flex-wrap gap-2 px-2 py-1">
                      {POPULAR_SEARCHES.slice(0, 8).map((term, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSearch(term)}
                          className="px-3 py-1.5 bg-[#F5EDE6] rounded-full text-xs text-[#6B5D52] hover:bg-[#E8DDD4] transition-colors flex items-center gap-1"
                        >
                          <TrendingUp className="w-3 h-3 text-[#E8B44C]" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 bg-black/30 animate-in fade-in duration-150"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="absolute inset-x-4 top-20 sm:left-auto sm:right-4 sm:w-80 max-h-[70vh] bg-white rounded-2xl shadow-warm-lg border border-[#E8DDD4] overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#E8DDD4] bg-[#FFFCF9] flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#2D9B8C]" />
                <p className="text-sm font-semibold text-[#4A3F37]">Filters</p>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setPriceMin('');
                    setPriceMax('');
                    setSelectedConditions([]);
                    setSelectedAgeRanges([]);
                    setShipsOnly(false);
                    setFreeShippingOnly(false);
                  }}
                  className="text-xs text-[#E8725C] hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[calc(70vh-120px)] p-4 space-y-5">
              {/* Price Range */}
              <div>
                <h4 className="text-xs font-bold text-[#6B5D52] uppercase tracking-wide mb-2">Price Range</h4>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8A395]">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E8DDD4] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]"
                    />
                  </div>
                  <span className="text-[#B8A395]">–</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8A395]">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E8DDD4] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]"
                    />
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div>
                <h4 className="text-xs font-bold text-[#6B5D52] uppercase tracking-wide mb-2">Condition</h4>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setSelectedConditions(prev =>
                          prev.includes(option.key)
                            ? prev.filter(c => c !== option.key)
                            : [...prev, option.key]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedConditions.includes(option.key)
                          ? 'bg-[#2D9B8C] text-white'
                          : 'bg-[#F5EDE6] text-[#6B5D52] hover:bg-[#E8DDD4]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <h4 className="text-xs font-bold text-[#6B5D52] uppercase tracking-wide mb-2">Age Range</h4>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setSelectedAgeRanges(prev =>
                          prev.includes(option.key)
                            ? prev.filter(a => a !== option.key)
                            : [...prev, option.key]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedAgeRanges.includes(option.key)
                          ? 'bg-[#2D9B8C] text-white'
                          : 'bg-[#F5EDE6] text-[#6B5D52] hover:bg-[#E8DDD4]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shipping Options */}
              <div>
                <h4 className="text-xs font-bold text-[#6B5D52] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Shipping
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipsOnly}
                      onChange={(e) => setShipsOnly(e.target.checked)}
                      className="w-4 h-4 text-[#2D9B8C] rounded accent-[#2D9B8C]"
                    />
                    <span className="text-sm text-[#4A3F37]">Ships nationwide</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={freeShippingOnly}
                      onChange={(e) => {
                        setFreeShippingOnly(e.target.checked);
                        if (e.target.checked) setShipsOnly(true);
                      }}
                      className="w-4 h-4 text-[#2D9B8C] rounded accent-[#2D9B8C]"
                    />
                    <span className="text-sm text-[#4A3F37]">Free shipping only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E8DDD4] bg-[#FFFCF9]">
              <button
                onClick={() => {
                  setShowFilterModal(false);
                  setIsSearching(true);
                  setTimeout(() => setIsSearching(false), 300);
                }}
                className="w-full py-2.5 bg-[#2D9B8C] text-white font-semibold rounded-full hover:bg-[#247A6F] transition-colors"
              >
                Show {filteredListings.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Picker Dropdown */}
      {showSortPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/20 animate-in fade-in duration-150"
          onClick={() => setShowSortPicker(false)}
        >
          <div
            className="absolute right-4 top-48 sm:top-52 sm:w-64 bg-white rounded-2xl shadow-warm-lg border border-[#E8DDD4] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-[#E8DDD4] bg-[#FFFCF9]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#2D9B8C]" />
                <p className="text-sm font-medium text-[#4A3F37]">Sort by</p>
              </div>
            </div>
            <div className="p-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => {
                    setSortBy(option.key);
                    setShowSortPicker(false);
                    setIsSearching(true);
                    setTimeout(() => setIsSearching(false), 200);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm text-left flex items-center justify-between transition-all ${
                    sortBy === option.key
                      ? 'bg-[#2D9B8C] text-white'
                      : 'text-[#4A3F37] hover:bg-[#F5EDE6]'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {sortBy === option.key && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Selected</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Radius Picker Dropdown */}
      {showRadiusPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/20 animate-in fade-in duration-150"
          onClick={() => setShowRadiusPicker(false)}
        >
          <div
            className="absolute left-4 right-4 top-32 sm:left-auto sm:right-auto sm:top-36 sm:left-4 sm:w-72 bg-white rounded-2xl shadow-warm-lg border border-[#E8DDD4] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-[#E8DDD4] bg-[#FFFCF9]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#2D9B8C]" />
                <p className="text-sm font-medium text-[#4A3F37]">Search radius</p>
              </div>
            </div>
            <div className="p-2">
              {RADIUS_OPTIONS.map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleRadiusSelect(radius)}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm text-left flex items-center justify-between transition-all ${
                    selectedRadius === radius
                      ? 'bg-[#2D9B8C] text-white'
                      : 'text-[#4A3F37] hover:bg-[#F5EDE6]'
                  }`}
                >
                  <span className="font-medium">{radius} miles</span>
                  {selectedRadius === radius && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Selected</span>
                  )}
                </button>
              ))}
              <div className="border-t border-[#E8DDD4] mt-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedRadius(100);
                    setShowRadiusPicker(false);
                    setIsSearching(true);
                    setTimeout(() => setIsSearching(false), 300);
                    showToast('Showing all listings', 'success');
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                    selectedRadius === 100
                      ? 'bg-[#4A3F37] text-white'
                      : 'text-[#6B5D52] hover:bg-[#F5EDE6]'
                  }`}
                >
                  Show all (any distance)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
