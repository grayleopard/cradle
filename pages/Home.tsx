import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useTheme, Theme } from '../context/ThemeContext';
import { Search, Filter, X, Camera, Loader2, Mic, MicOff, SlidersHorizontal, Palette, Leaf, Baby, ShoppingCart, Shirt, Puzzle, Scissors } from 'lucide-react';
import ListingCard from '../components/ListingCard';
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
  const { listings, currentUser, saveSearch } = useStore();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => {
      setDailyTip(SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)]);
  }, []);

  const cycleTheme = () => {
    // New cycle: Default -> Heirloom -> Midnight -> Retro
    const cycle: Theme[] = ['default', 'heirloom', 'midnight', 'retro'];
    const currentIndex = cycle.indexOf(theme);
    const nextTheme = cycle[(currentIndex + 1) % cycle.length];
    setTheme(nextTheme);
    showToast(`Theme: ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}`);
  };

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

  // --- Theme Helpers ---
  const isMidnight = theme === 'midnight';
  const isRetro = theme === 'retro';
  const isHeirloom = theme === 'heirloom';

  return (
    <div className={`pb-4 relative min-h-full ${isMidnight ? 'bg-black' : isRetro ? 'bg-bg-main' : 'bg-bg-main'}`}>
      
      {/* Header */}
      <div className={`sticky top-0 z-30 transition-all ${
          isHeirloom 
            ? 'bg-[#F9F6F0]/95 backdrop-blur-md pt-4 pb-2' 
            : isMidnight ? 'bg-gray-900/90 backdrop-blur-md border-b border-gray-800' : isRetro ? 'bg-white border-b-2 border-black' : 'bg-white shadow-sm'
        }`}>
        
        {/* Heirloom Header Branding - Mobile only, desktop has top nav */}
        {isHeirloom && (
           <div className="px-4 lg:px-8 mb-3 lg:hidden">
              <div className="flex items-center gap-2">
                 <Scissors className="w-6 h-6 text-[#2F3E2E]" />
                 <h1 className="font-serif text-2xl text-[#2F3E2E] tracking-tight">Heirloom Exchange</h1>
              </div>
           </div>
        )}

        {/* Actions */}
        <div className={`px-4 lg:px-8 flex gap-3 items-center ${isHeirloom ? 'mb-2' : 'py-4'}`}>
            {/* Theme Cycle Button */}
            {!isHeirloom && (
                <button 
                onClick={cycleTheme}
                className={`p-2.5 rounded-full flex items-center justify-center transition-colors ${isMidnight ? 'bg-gray-800 text-white' : isRetro ? 'bg-yellow-300 border-2 border-black text-black' : 'text-gray-400 hover:text-brand-600 bg-gray-100'}`}
                title="Change Theme"
                >
                <Palette className="w-5 h-5" />
                </button>
            )}
            
            {/* Heirloom has theme toggle in "Heirloom Exchange" logic implicitly or via Profile, but let's keep a hidden way or just use Profile for switching back if desired. Actually user asked for a cycle button on home. */}
            {isHeirloom && (
                <button onClick={cycleTheme} className="hidden"></button> // Hidden, access via profile usually, but sticking to requested 'palette icon on home' behavior for others.
            )}
            
            {/* Heirloom Search is cleaner */}
            <div className={`relative flex-1 group transition-all`}>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {visualSearchLoading ? <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> : <Search className={`w-4 h-4 ${isHeirloom ? 'text-[#C68E68]' : ''}`} />}
              </div>
              <input 
                type="text" 
                placeholder={isRecording ? "Listening..." : isHeirloom ? "Find curated items..." : "Search..."} 
                className={`w-full pl-10 pr-16 py-2.5 text-sm transition-all outline-none 
                  ${isMidnight
                    ? 'bg-gray-800 text-white rounded-lg focus:ring-1 focus:ring-brand-500 placeholder:text-gray-500' 
                    : isRetro 
                        ? 'bg-white border-2 border-black rounded-none shadow-[2px_2px_0px_black] text-black focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]' 
                        : isHeirloom 
                            ? 'bg-white rounded-full shadow-sm border border-[#E3D5CA] text-[#2F3E2E] placeholder:text-[#B07D5B]/60 focus:ring-1 focus:ring-[#C68E68]'
                            : 'bg-gray-100 rounded-btn focus:ring-2 focus:ring-brand-500'
                  }
                  ${isRecording ? 'text-red-500' : ''}
                `}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={visualSearchLoading || isRecording}
              />
              
              {!isHeirloom && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`p-1.5 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white scale-110' : 'text-gray-400 hover:text-brand-600'}`}
                    >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-gray-400 hover:text-brand-600 rounded-full transition-colors"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                  </div>
              )}
              {isHeirloom && (
                  // Cycle Theme Button disguised as Palette in Heirloom search bar for demo access
                  <button onClick={cycleTheme} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C68E68]/50 hover:text-[#C68E68]">
                      <Palette className="w-4 h-4" />
                  </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleVisualSearch} accept="image/*" className="hidden" />
            </div>

            {/* Filter Toggle */}
            {!isHeirloom && (
                <button 
                onClick={() => setShowFilters(true)}
                className={`p-2.5 flex items-center gap-2 transition-colors 
                    ${isMidnight
                    ? 'bg-gray-800 text-white rounded-lg'
                    : isRetro 
                        ? 'bg-white border-2 border-black rounded-none shadow-[2px_2px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]' 
                        : `rounded-btn border ${activeFiltersCount > 0 ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`
                    }`}
                >
                <SlidersHorizontal className="w-5 h-5" />
                {activeFiltersCount > 0 && !isMidnight && (
                    <span className="bg-brand-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {activeFiltersCount}
                    </span>
                )}
                </button>
            )}
        </div>

        {/* Tab Switcher (Non-Heirloom) */}
        {!isHeirloom && (
            <div className={`flex px-4 lg:px-8 ${isRetro ? '' : 'border-b'} ${isMidnight ? 'border-gray-800' : 'border-gray-100'}`}>
                <button 
                onClick={() => setActiveTab('nearby')}
                className={`pb-3 text-sm font-bold border-b-2 mr-6 transition-colors 
                    ${activeTab === 'nearby' 
                        ? (isRetro ? 'border-black text-black' : isMidnight ? 'border-brand-500 text-white' : 'border-brand-600 text-brand-600') 
                        : 'border-transparent text-gray-400'
                    }`}
                >
                Nearby
                </button>
                <button 
                onClick={() => setActiveTab('following')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors 
                    ${activeTab === 'following' 
                        ? (isRetro ? 'border-black text-black' : isMidnight ? 'border-brand-500 text-white' : 'border-brand-600 text-brand-600') 
                        : 'border-transparent text-gray-400'
                    }`}
                >
                Following
                </button>
            </div>
        )}
      </div>

      {/* --- HEIRLOOM HERO SECTION --- */}
      {isHeirloom && (
          <>
            <div className="px-4 lg:px-8 py-2">
               <div className="relative rounded-[2rem] overflow-hidden h-48 lg:h-64 bg-[#E3D5CA]">
                  <img src="https://images.unsplash.com/photo-1544126566-4751433f52aa?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-90 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F9F6F0]/90 to-transparent p-6 flex flex-col justify-center max-w-[70%]">
                     <h2 className="font-serif text-3xl text-[#2F3E2E] leading-none mb-2">Discover<br/>Pre-Loved<br/>Treasures</h2>
                     <button className="bg-[#C68E68] text-white px-6 py-2 rounded-full text-sm font-bold w-fit mt-2 shadow-sm">Shop Now</button>
                  </div>
               </div>
            </div>

            {/* Categories Scroll */}
            <div className="px-4 lg:px-8 py-6 overflow-x-auto no-scrollbar">
               <div className="flex gap-6 lg:gap-8 justify-start lg:justify-center min-w-max px-2">
                  <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.CRIBS)}>
                     <div className="w-14 h-14 bg-[#C68E68] rounded-2xl flex items-center justify-center text-white shadow-sm transform rotate-3 hover:rotate-0 transition-transform">
                        <Baby className="w-8 h-8" />
                     </div>
                     <span className="text-xs font-medium text-[#2F3E2E]">Nursery</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.STROLLERS)}>
                     <div className="w-14 h-14 bg-[#C68E68] rounded-2xl flex items-center justify-center text-white shadow-sm transform -rotate-3 hover:rotate-0 transition-transform">
                        <ShoppingCart className="w-8 h-8" />
                     </div>
                     <span className="text-xs font-medium text-[#2F3E2E]">Gear</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.FEEDING)}>
                     <div className="w-14 h-14 bg-[#C68E68] rounded-2xl flex items-center justify-center text-white shadow-sm transform rotate-3 hover:rotate-0 transition-transform">
                        <Leaf className="w-8 h-8" />
                     </div>
                     <span className="text-xs font-medium text-[#2F3E2E]">Feeding</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.CLOTHING)}>
                     <div className="w-14 h-14 bg-[#C68E68] rounded-2xl flex items-center justify-center text-white shadow-sm transform -rotate-3 hover:rotate-0 transition-transform">
                        <Shirt className="w-8 h-8" />
                     </div>
                     <span className="text-xs font-medium text-[#2F3E2E]">Apparel</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(Category.TOYS)}>
                     <div className="w-14 h-14 bg-[#C68E68] rounded-2xl flex items-center justify-center text-white shadow-sm transform rotate-3 hover:rotate-0 transition-transform">
                        <Puzzle className="w-8 h-8" />
                     </div>
                     <span className="text-xs font-medium text-[#2F3E2E]">Toys</span>
                  </div>
               </div>
            </div>

            <div className="px-4 lg:px-8 mb-2">
               <h3 className="font-serif text-xl lg:text-2xl text-[#2F3E2E]">New Arrivals</h3>
            </div>
          </>
      )}

      {/* Listing Grid - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
      <div className={`grid gap-3 lg:gap-6 p-4 lg:px-8 min-h-[50vh] pt-0
        grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
        ${isMidnight ? '' : isRetro ? 'gap-4' : isHeirloom ? 'gap-4' : ''}`}>
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <Filter className="w-12 h-12 mb-2 opacity-20" />
            <p>No items found.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSelectedAge('All'); setSearchTerm(''); setPriceRange({min:'', max:''}); }}
              className={`mt-6 text-xs font-bold underline ${isMidnight ? 'text-gray-300' : 'text-gray-900'}`}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Filter Drawer (Reused) */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 h-[85vh] sm:h-auto overflow-y-auto animate-in slide-in-from-bottom-10 duration-300 
             ${isMidnight ? 'bg-gray-900 rounded-t-2xl border-t border-gray-800' : isRetro ? 'bg-white rounded-none border-t-4 border-black' : 'bg-bg-card rounded-t-3xl sm:rounded-2xl'}`}>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${isMidnight ? 'text-white' : 'text-gray-900'}`}>Refine</h2>
              <button onClick={() => setShowFilters(false)} className={`p-2 rounded-full ${isMidnight ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100'}`}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Categories */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedCategory('All')} className={`px-4 py-2 text-xs font-medium border ${selectedCategory === 'All' ? 'bg-brand-600 text-white border-brand-600' : isMidnight ? 'text-gray-300 border-gray-700' : 'bg-transparent text-gray-600 border-gray-200'} ${isRetro ? 'rounded-none border-2 border-black font-bold' : 'rounded-btn'}`}>All</button>
                  {Object.values(Category).map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 text-xs font-medium border ${selectedCategory === cat ? 'bg-brand-600 text-white border-brand-600' : isMidnight ? 'text-gray-300 border-gray-700' : 'bg-transparent text-gray-600 border-gray-200'} ${isRetro ? 'rounded-none border-2 border-black font-bold' : 'rounded-btn'}`}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Price Range</label>
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))} className={`w-full p-3 text-sm focus:outline-none focus:ring-1 focus:ring-black ${isMidnight ? 'bg-gray-800 border-gray-700 text-white rounded-lg' : isRetro ? 'bg-white border-2 border-black rounded-none' : 'bg-gray-50 rounded-btn border border-gray-200'}`} />
                  <span className="text-gray-400">-</span>
                  <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))} className={`w-full p-3 text-sm focus:outline-none focus:ring-1 focus:ring-black ${isMidnight ? 'bg-gray-800 border-gray-700 text-white rounded-lg' : isRetro ? 'bg-white border-2 border-black rounded-none' : 'bg-gray-50 rounded-btn border border-gray-200'}`} />
                </div>
              </div>
            </div>

            <div className={`sticky bottom-0 pt-4 mt-8 border-t flex gap-3 ${isMidnight ? 'bg-gray-900 border-gray-800' : 'bg-bg-card border-gray-100'}`}>
              <button onClick={() => setShowFilters(false)} className={`flex-[2] py-3.5 font-bold shadow-lg transition-colors ${isRetro ? 'bg-black text-white rounded-none border-2 border-black shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]' : 'bg-brand-600 text-white rounded-btn hover:bg-brand-700'}`}>
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