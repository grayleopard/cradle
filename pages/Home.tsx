import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Search, Filter, X, Camera, Loader2, Mic, MicOff, SlidersHorizontal, Palette, Leaf, Baby, ShoppingCart, Shirt, Puzzle, Scissors, Users, MapPin, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import ListingCardSkeleton from '../components/ListingCardSkeleton';
import { AgeRange, Category, SavedSearch } from '../types';
import { generateUUID } from '../utils/uuid';
import { processImage } from '../utils/fileHelpers';
import { identifyItemFromImage, processVoiceCommand } from '../services/geminiService';

type SortOption = 'closest' | 'newest' | 'price_asc' | 'price_desc';
type FeedTab = 'nearby' | 'following';

const SAFETY_TIPS = [
    "Car seats expire! Always check the sticker.",
    "Avoid used cribs with drop-sides.",
    "Check for recalls on the CPSC website.",
    "Ensure used strollers have functional brakes.",
    "Used toys should be free of chips.",
    "Wash used clothes in hot water."
];

const Home = () => {
  const { listings, currentUser, saveSearch, getUserById } = useStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listingsRef = useRef<HTMLDivElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FeedTab>('nearby');
  const [visualSearchLoading, setVisualSearchLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedAge, setSelectedAge] = useState<AgeRange | 'All'>('All');
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<SortOption>('closest');

  const [showSafetyTip, setShowSafetyTip] = useState(true);
  const [dailyTip, setDailyTip] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      setDailyTip(SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)]);
  }, []);

  // Simulate initial loading state (for skeleton demo)
  // In production, this would be tied to actual data fetching
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter Logic
  const filteredListings = listings
    .filter(l => !l.isSold)
    .filter(l => {
      if (activeTab === 'following') {
         if (!currentUser?.followingIds?.includes(l.userId)) return false;
      }
      
      const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (l.brand && l.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || l.category === selectedCategory;
      const matchesAge = selectedAge === 'All' || l.ageRange === selectedAge;
      
      const price = l.price;
      const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
      const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      const matchesPrice = price >= minPrice && price <= maxPrice;

      return matchesSearch && matchesCategory && matchesAge && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'closest': return a.distanceMiles - b.distanceMiles;
        case 'newest': return 0; // Mock date sorting
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        default: return 0;
      }
    });

  const activeFiltersCount = [
    selectedCategory !== 'All',
    selectedAge !== 'All',
    priceRange.min !== '',
    priceRange.max !== ''
  ].filter(Boolean).length;

  // Get listings from users in the same neighborhood (for "New near you" section)
  const neighborhoodListings = listings
    .filter(l => !l.isSold)
    .filter(l => {
      if (!currentUser?.neighborhood) return false;
      const seller = getUserById(l.userId);
      return seller?.neighborhood?.toLowerCase() === currentUser.neighborhood.toLowerCase();
    })
    .slice(0, 4); // Limit to 4 items for the carousel

  const handleSaveSearch = () => {
    if (!currentUser) return;
    const newSearch: SavedSearch = {
      id: generateUUID(),
      query: searchTerm,
      category: selectedCategory,
      ageRange: selectedAge,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      createdAt: new Date().toISOString()
    };
    saveSearch(newSearch);
    showToast("Search saved!", "success");
  };

  const handleVisualSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVisualSearchLoading(true);
      try {
        const processed = await processImage(e.target.files[0]);
        const result = await identifyItemFromImage(processed.base64, processed.mimeType);
        if (result) {
          setSearchTerm(result.searchQuery);
          setActiveTab('nearby');
          showToast(`Identified: ${result.searchQuery}`, 'success');
        } else {
          showToast("Couldn't identify item.", "error");
        }
      } catch (err) {
        showToast("Visual search failed.", "error");
      } finally {
        setVisualSearchLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
           const base64 = (reader.result as string).split(',')[1];
           setVisualSearchLoading(true);
           try {
             const intent = await processVoiceCommand(base64, 'audio/webm');
             if (intent) {
               setSearchTerm(intent.query || '');
               showToast("Filters applied from voice!", "success");
             }
           } catch(e) {
             showToast("Could not understand audio.", "error");
           } finally {
             setVisualSearchLoading(false);
           }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      showToast("Microphone access denied.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="pb-4 relative min-h-full bg-[#FFFCF9]">

      {/* Header */}
      <div className="sticky top-0 z-30 transition-all bg-[#FFFCF9]/95 backdrop-blur-md pt-4 pb-2">

        {/* Header Branding - Mobile only, desktop has top nav */}
        <div className="px-4 lg:px-8 mb-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center text-white font-bold text-sm rounded-lg bg-[#2D9B8C]">P</div>
            <h1 className="font-serif text-2xl text-[#4A3F37] tracking-tight">Pipit</h1>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 lg:px-8 flex gap-3 items-center mb-2">
          <div className="relative flex-1 group transition-all">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8A395]">
              {visualSearchLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#2D9B8C]" /> : <Search className="w-4 h-4 text-[#2D9B8C]" />}
            </div>
            <input
              type="text"
              placeholder={isRecording ? "Listening..." : "Find curated items..."}
              className={`w-full pl-10 pr-10 py-2.5 text-sm transition-all outline-none bg-white rounded-full shadow-sm border border-[#E8DDD4] text-[#4A3F37] placeholder:text-[#247A6F]/60 focus:ring-1 focus:ring-[#2D9B8C] ${isRecording ? 'text-red-500' : ''}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={visualSearchLoading || isRecording}
            />
            <input type="file" ref={fileInputRef} onChange={handleVisualSearch} accept="image/*" className="hidden" />
          </div>
        </div>

        {/* Feed Tabs - Only show if logged in */}
        {currentUser && (
          <div className="px-4 lg:px-8 flex gap-2">
            <button
              onClick={() => setActiveTab('nearby')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'nearby'
                  ? 'bg-[#4A3F37] text-white'
                  : 'bg-white border border-[#E8DDD4] text-[#4A3F37] hover:border-[#2D9B8C]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Nearby
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'following'
                  ? 'bg-[#4A3F37] text-white'
                  : 'bg-white border border-[#E8DDD4] text-[#4A3F37] hover:border-[#2D9B8C]'
              }`}
            >
              <Users className="w-4 h-4" />
              Following
              {currentUser.followingIds && currentUser.followingIds.length > 0 && (
                <span className="bg-[#2D9B8C] text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                  {currentUser.followingIds.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="px-4 lg:px-8 py-2">
        <div className="relative rounded-[2rem] overflow-hidden h-48 lg:h-64 bg-[#E8DDD4]">
          <img src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFFCF9]/90 via-[#FFFCF9]/70 to-transparent p-6 flex flex-col justify-center max-w-[60%] lg:max-w-[50%]">
            <h2 className="font-serif text-3xl lg:text-4xl text-[#4A3F37] leading-none mb-2">Discover<br/>Pre-Loved<br/>Treasures</h2>
            <button
              onClick={() => listingsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#2D9B8C] text-white px-6 py-2 rounded-full text-sm font-bold w-fit mt-2 shadow-sm hover:bg-[#247A6F] transition-colors"
            >
              Shop Now
            </button>
          </div>
          {/* Floating product images */}
          <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 lg:gap-3">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden shadow-lg border-2 border-white transform rotate-3 hover:rotate-0 transition-transform">
              <img src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Stroller" />
            </div>
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden shadow-lg border-2 border-white transform -rotate-2 hover:rotate-0 transition-transform">
              <img src="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Toys" />
            </div>
            <div className="hidden lg:block w-20 h-20 rounded-xl overflow-hidden shadow-lg border-2 border-white transform rotate-2 hover:rotate-0 transition-transform">
              <img src="https://images.unsplash.com/photo-1566004100631-35d015d6a491?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Clothes" />
            </div>
          </div>
        </div>
      </div>

      {/* New Near You Section - Only show on Nearby tab with neighborhood set */}
      {activeTab === 'nearby' && currentUser?.neighborhood && neighborhoodListings.length > 0 && selectedCategory === 'All' && !searchTerm && (
        <div className="px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-[#2D9B8C]/10 p-2 rounded-full">
                <MapPin className="w-4 h-4 text-[#2D9B8C]" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-[#4A3F37]">From {currentUser.neighborhood}</h3>
                <p className="text-xs text-[#6B5D52]">Parents in your neighborhood</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {neighborhoodListings.map(listing => {
              const seller = getUserById(listing.userId);
              return (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="flex-shrink-0 w-40 bg-white rounded-xl border border-[#E8DDD4] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square relative">
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-[#4A3F37]">
                      ${listing.price}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-[#4A3F37] line-clamp-1">{listing.title}</p>
                    {seller && (
                      <div className="flex items-center gap-1 mt-1">
                        <img src={seller.avatarUrl} alt={seller.name} className="w-4 h-4 rounded-full object-cover" />
                        <span className="text-[10px] text-[#6B5D52]">{seller.name.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filter Banner */}
      {selectedCategory !== 'All' && (
        <div className="px-4 lg:px-8 pt-4">
          <div className="bg-[#F5EDE6] border border-[#E8DDD4] rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-[#4A3F37]">
              Showing: <span className="font-semibold">{selectedCategory}</span>
            </span>
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-bold text-[#2D9B8C] flex items-center gap-1 hover:underline"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Categories Scroll */}
      <div className="px-4 lg:px-8 py-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-6 lg:gap-8 justify-start lg:justify-center min-w-max px-2">
          {/* All Category */}
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory('All')}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all ${selectedCategory === 'All' ? 'bg-[#4A3F37] text-white scale-110' : 'bg-[#E8DDD4] text-[#4A3F37]'}`}>
              <Filter className="w-7 h-7" />
            </div>
            <span className={`text-xs font-medium ${selectedCategory === 'All' ? 'text-[#4A3F37] font-bold' : 'text-[#4A3F37]'}`}>All</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.CRIBS)}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transform rotate-3 hover:rotate-0 transition-transform ${selectedCategory === Category.CRIBS ? 'bg-[#4A3F37] text-white scale-110' : 'bg-[#2D9B8C] text-white'}`}>
              <Baby className="w-8 h-8" />
            </div>
            <span className={`text-xs font-medium ${selectedCategory === Category.CRIBS ? 'text-[#4A3F37] font-bold' : 'text-[#4A3F37]'}`}>Nursery</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.STROLLERS)}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transform -rotate-3 hover:rotate-0 transition-transform ${selectedCategory === Category.STROLLERS ? 'bg-[#4A3F37] text-white scale-110' : 'bg-[#2D9B8C] text-white'}`}>
              <ShoppingCart className="w-8 h-8" />
            </div>
            <span className={`text-xs font-medium ${selectedCategory === Category.STROLLERS ? 'text-[#4A3F37] font-bold' : 'text-[#4A3F37]'}`}>Gear</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.FEEDING)}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transform rotate-3 hover:rotate-0 transition-transform ${selectedCategory === Category.FEEDING ? 'bg-[#4A3F37] text-white scale-110' : 'bg-[#2D9B8C] text-white'}`}>
              <Leaf className="w-8 h-8" />
            </div>
            <span className={`text-xs font-medium ${selectedCategory === Category.FEEDING ? 'text-[#4A3F37] font-bold' : 'text-[#4A3F37]'}`}>Feeding</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.CLOTHING)}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transform -rotate-3 hover:rotate-0 transition-transform ${selectedCategory === Category.CLOTHING ? 'bg-[#4A3F37] text-white scale-110' : 'bg-[#2D9B8C] text-white'}`}>
              <Shirt className="w-8 h-8" />
            </div>
            <span className={`text-xs font-medium ${selectedCategory === Category.CLOTHING ? 'text-[#4A3F37] font-bold' : 'text-[#4A3F37]'}`}>Apparel</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.TOYS)}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transform rotate-3 hover:rotate-0 transition-transform ${selectedCategory === Category.TOYS ? 'bg-[#4A3F37] text-white scale-110' : 'bg-[#2D9B8C] text-white'}`}>
              <Puzzle className="w-8 h-8" />
            </div>
            <span className={`text-xs font-medium ${selectedCategory === Category.TOYS ? 'text-[#4A3F37] font-bold' : 'text-[#4A3F37]'}`}>Toys</span>
          </div>
        </div>
      </div>

      <div ref={listingsRef} className="px-4 lg:px-8 mb-2 scroll-mt-20">
        <h3 className="font-serif text-xl lg:text-2xl text-[#4A3F37]">
          {activeTab === 'following' ? 'From Parents You Follow' : 'New Arrivals'}
        </h3>
      </div>

      {/* Listing Grid */}
      <div className="grid gap-4 lg:gap-6 p-4 lg:px-8 min-h-[50vh] pt-0 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {isLoading ? (
          /* Skeleton loaders */
          [...Array(8)].map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))
        ) : filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : activeTab === 'following' ? (
          /* Empty state for Following tab */
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-[#F5EDE6] p-6 rounded-full mb-4">
              <Users className="w-12 h-12 text-[#2D9B8C]" />
            </div>
            {currentUser?.followingIds?.length === 0 ? (
              <>
                <h4 className="font-serif text-lg text-[#4A3F37] mb-2">Start Following Parents</h4>
                <p className="text-sm text-[#6B5D52] max-w-xs mb-6">
                  Follow other parents to see their listings here. Tap any seller profile to follow them!
                </p>
                <button
                  onClick={() => setActiveTab('nearby')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#2D9B8C] text-white rounded-full font-medium text-sm hover:bg-[#247A6F] transition-colors"
                >
                  <MapPin className="w-4 h-4" /> Browse Nearby
                </button>
              </>
            ) : (
              <>
                <h4 className="font-serif text-lg text-[#4A3F37] mb-2">No New Listings</h4>
                <p className="text-sm text-[#6B5D52] max-w-xs">
                  The parents you follow haven't posted any items matching your filters.
                </p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSearchTerm(''); }}
                  className="mt-4 text-xs font-bold underline text-[#2D9B8C]"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          /* Empty state for no results */
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-[#F5EDE6] rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-[#2D9B8C]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white border-2 border-[#E8DDD4] rounded-full p-1.5">
                <X className="w-4 h-4 text-[#247A6F]" />
              </div>
            </div>

            <h3 className="font-serif text-xl text-[#4A3F37] mb-2">No Items Found</h3>

            {searchTerm ? (
              <p className="text-sm text-[#6B5D52] max-w-xs mb-2">
                We couldn't find anything matching "<span className="font-medium text-[#4A3F37]">{searchTerm}</span>"
              </p>
            ) : selectedCategory !== 'All' ? (
              <p className="text-sm text-[#6B5D52] max-w-xs mb-2">
                No items in <span className="font-medium text-[#4A3F37]">{selectedCategory}</span> right now
              </p>
            ) : (
              <p className="text-sm text-[#6B5D52] max-w-xs mb-2">
                No items match your current filters
              </p>
            )}

            <p className="text-xs text-[#9CA3AF] max-w-xs mb-6">
              Try adjusting your search or check back later for new listings
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedAge('All'); setSearchTerm(''); setPriceRange({min:'', max:''}); }}
                className="px-6 py-2.5 bg-[#2D9B8C] text-white rounded-full font-medium text-sm hover:bg-[#247A6F] transition-colors"
              >
                Clear All Filters
              </button>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-2.5 bg-[#F5EDE6] text-[#4A3F37] rounded-full font-medium text-sm hover:bg-[#E8DDD4] transition-colors"
                >
                  Clear Search Only
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 h-[85vh] sm:h-auto overflow-y-auto animate-in slide-in-from-bottom-10 duration-300 bg-[#FFFCF9] rounded-t-3xl sm:rounded-2xl">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#4A3F37]">Refine</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 rounded-full hover:bg-[#E8DDD4]">
                <X className="w-5 h-5 text-[#9A8578]" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Categories */}
              <div>
                <label className="text-xs font-bold text-[#B8A395] uppercase tracking-wider mb-3 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedCategory('All')} className={`px-4 py-2 text-xs font-medium border rounded-full ${selectedCategory === 'All' ? 'bg-[#2D9B8C] text-white border-[#2D9B8C]' : 'bg-white text-[#4A3F37] border-[#E8DDD4]'}`}>All</button>
                  {Object.values(Category).map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 text-xs font-medium border rounded-full ${selectedCategory === cat ? 'bg-[#2D9B8C] text-white border-[#2D9B8C]' : 'bg-white text-[#4A3F37] border-[#E8DDD4]'}`}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-[#B8A395] uppercase tracking-wider mb-3 block">Price Range</label>
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))} className="w-full p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D9B8C] bg-white rounded-xl border border-[#E8DDD4]" />
                  <span className="text-[#B8A395]">-</span>
                  <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))} className="w-full p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D9B8C] bg-white rounded-xl border border-[#E8DDD4]" />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 pt-4 mt-8 border-t border-[#E8DDD4] flex gap-3 bg-[#FFFCF9]">
              <button onClick={() => setShowFilters(false)} className="flex-[2] py-3.5 font-bold shadow-lg transition-colors bg-[#2D9B8C] text-white rounded-xl hover:bg-[#247A6F]">
                Show Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;