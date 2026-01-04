import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Search, X, ChevronDown, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import ListingCardSkeleton from '../components/ListingCardSkeleton';
import { Category } from '../types';

type SortOption = 'closest' | 'newest' | 'price_asc' | 'price_desc';

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
  const [sortBy, setSortBy] = useState<SortOption>('closest');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pipit_recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));
  }, []);

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

  // Filter listings
  const filteredListings = listings
    .filter(l => !l.isSold)
    .filter(l => {
      const matchesSearch = !searchTerm ||
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.brand && l.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || l.category === selectedCategory;
      const matchesRadius = l.distanceMiles <= selectedRadius;
      return matchesSearch && matchesCategory && matchesRadius;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'closest': return a.distanceMiles - b.distanceMiles;
        case 'newest': return 0;
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        default: return 0;
      }
    });

  // Get listings from followed users
  const followingListings = currentUser?.followingIds?.length
    ? listings.filter(l => !l.isSold && currentUser.followingIds?.includes(l.userId))
    : [];

  // Handle search submission with loading state
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setShowSearchModal(false);

    // Show brief loading state for search results
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);

    // Save to recent searches
    if (term.trim()) {
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
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
      </section>

      {/* Guest CTA */}
      {!currentUser && (
        <section className="px-4 pt-4">
          <div className="bg-[#FFF8F3] border border-[#E8B44C]/30 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-[#6B5D52]">
              Sign up to save favorites and message sellers
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

            {/* Recent Searches */}
            <div className="max-h-64 overflow-y-auto">
              {recentSearches.length > 0 ? (
                <div className="p-2">
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
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(search)}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#4A3F37] hover:bg-[#F5EDE6] transition-colors flex items-center gap-2 group"
                    >
                      <Search className="w-3.5 h-3.5 text-[#B8A395] group-hover:text-[#2D9B8C]" />
                      {search}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Search className="w-8 h-8 text-[#E8DDD4] mx-auto mb-2" />
                  <p className="text-xs text-[#B8A395]">Search for strollers, toys, clothing...</p>
                </div>
              )}
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
