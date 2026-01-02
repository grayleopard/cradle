
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Share2, Heart, MapPin, UserCheck, MessageCircle, Cigarette, Dog, Shield, Pencil, CheckCircle, Trash2, ChevronRight, Flag, ShoppingBag, ExternalLink, Sparkles, Loader2, TrendingUp, DollarSign, Home, X, ScanLine, ShieldCheck } from 'lucide-react';
import SafetyBadge from '../components/SafetyBadge';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import { analyzeDeal } from '../services/geminiService';
import { DealAnalysis } from '../types';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getListingById, startConversation, sendMessage, currentUser, getUserById, markAsSold, deleteListing, toggleFavorite, createTransaction, getActiveTransactionForListing, reportListing } = useStore();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Deal Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [dealAnalysis, setDealAnalysis] = useState<DealAnalysis | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Swipe Gesture State
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 75; // Distance required to trigger swipe
  const maxEdgeStart = 50; // Only allow swipe if started from the left 50px (Edge swipe)

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    const isEdgeSwipe = touchStart.current < maxEdgeStart;

    // Navigate back on Right Swipe (Left-to-Right movement), ONLY if started from edge
    if (isRightSwipe && isEdgeSwipe) {
      handleBack();
    }
  };

  const listing = getListingById(id || '');

  // Initialize with stored analysis if present
  useEffect(() => {
    setCurrentImageIndex(0);
    if (listing?.dealAnalysis) {
      setDealAnalysis(listing.dealAnalysis);
    } else {
      setDealAnalysis(null);
    }
  }, [id, listing?.dealAnalysis]);

  if (!listing) return <div className="p-4">Listing not found</div>;

  const seller = getUserById(listing.userId);
  const isOwnListing = currentUser?.id === listing.userId;
  const isFavorite = currentUser?.savedListingIds?.includes(listing.id);
  const activeTransaction = getActiveTransactionForListing(listing.id);
  const isHeirloom = theme === 'heirloom';

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  const handleMessageSeller = () => {
    const conversationId = startConversation(listing.id);
    navigate(`/chat/${conversationId}`);
  };

  const handleRequestToBuy = () => {
    if (!currentUser) {
        navigate('/welcome');
        return;
    }
    if (activeTransaction) {
        navigate(`/transaction/${activeTransaction.id}`);
        return;
    }
    
    // 1. Create the Transaction record
    const txId = createTransaction(listing.id);

    // 2. Automatically start chat & notify seller
    const conversationId = startConversation(listing.id);
    sendMessage(conversationId, "👋 I'm interested in buying this! I've sent a formal purchase request.");

    showToast("Request sent! Seller notified in chat.", "success");
    navigate(`/transaction/${txId}`);
  };

  const handleMarkSold = () => {
    if (window.confirm("Mark this item as sold? This will hide it from the main feed.")) {
      markAsSold(listing.id);
      showToast('Item marked as sold');
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this listing permanently?")) {
      deleteListing(listing.id);
      showToast('Listing deleted');
      navigate('/profile');
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(listing.id);
    showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success');
  };

  const handleShare = async () => {
    const shareData = {
      title: `Check out this ${listing.title} on Cradle`,
      text: `I found this ${listing.title} for $${listing.price} on Cradle - the safest way to buy baby gear!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Opened share options');
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard');
    }
  };

  const handleReport = () => {
    const reason = window.prompt("Why are you reporting this listing?");
    if (reason) {
       reportListing(listing.id, reason);
       showToast('Listing reported. Our team will review it shortly.', 'info');
    }
  };

  const handleAnalyzeDeal = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeDeal(listing.title, listing.price, listing.condition, listing.originalPrice);
      setDealAnalysis(result);
      if (!result) showToast("Could not analyze deal. Try again.", "error");
    } catch (e) {
      showToast("Analysis failed", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex < listing.images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const renderDealScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 5) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  return (
    <div 
        className={`min-h-full pb-40 relative ${isHeirloom ? 'bg-[#F9F6F0]' : 'bg-white'}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      
      {/* Top Nav Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-[60] pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={handleBack} 
            className={`p-2 rounded-full shadow-sm transition-colors cursor-pointer ${isHeirloom ? 'bg-[#F9F6F0]/80 text-[#2F3E2E] hover:bg-[#F9F6F0]' : 'bg-white/80 backdrop-blur-md text-gray-800 hover:bg-white'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {!isHeirloom && (
            <button 
                onClick={handleHome} 
                className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors cursor-pointer"
            >
                <Home className="w-5 h-5 text-gray-800" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
           <button 
             onClick={handleShare}
             className={`p-2 rounded-full shadow-sm transition-colors cursor-pointer ${isHeirloom ? 'bg-[#F9F6F0]/80 text-[#2F3E2E] hover:bg-[#F9F6F0]' : 'bg-white/80 backdrop-blur-md text-gray-800 hover:bg-white'}`}
           >
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full shadow-sm transition-colors cursor-pointer ${isHeirloom ? 'bg-[#F9F6F0]/80 hover:bg-[#F9F6F0]' : 'bg-white/80 backdrop-blur-md hover:bg-white'} ${isFavorite ? 'text-red-500' : isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-800'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Image Gallery Carousel */}
      <div className={`w-full relative group ${isHeirloom ? 'h-[50vh] rounded-b-[2.5rem] overflow-hidden shadow-sm' : 'h-80 bg-gray-200'}`}>
        <ImageWithSkeleton
          src={listing.images[currentImageIndex]} 
          alt={`${listing.title} - ${currentImageIndex + 1}`} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${listing.isSold ? 'grayscale opacity-75' : ''}`} 
        />
        
        {/* Navigation Arrows */}
        {listing.images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 text-white rounded-full backdrop-blur-sm hover:bg-black/50 transition-colors z-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {currentImageIndex < listing.images.length - 1 && (
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 text-white rounded-full backdrop-blur-sm hover:bg-black/50 transition-colors z-20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            
            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
              {listing.images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Sold Overlay */}
        {listing.isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] z-10">
            <div className="bg-white/90 px-8 py-3 rounded-2xl transform -rotate-12 shadow-2xl border-4 border-red-500">
              <span className="text-4xl font-black text-red-500 tracking-widest uppercase">SOLD</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`relative z-0 ${isHeirloom ? 'px-6 pt-6' : 'p-5 -mt-6 bg-white rounded-t-3xl'}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-4">
            <span className={`text-xs font-semibold uppercase tracking-wide ${isHeirloom ? 'text-[#C68E68]' : 'text-brand-600'}`}>{listing.category}</span>
            <h1 className={`${isHeirloom ? 'font-serif text-3xl text-[#2F3E2E] mt-2' : 'text-2xl font-bold text-gray-900 mt-1'} leading-tight`}>{listing.title}</h1>
          </div>
          <div className="flex flex-col items-end">
            <div className={`${isHeirloom ? 'text-2xl font-sans text-[#2F3E2E]' : 'text-xl text-brand-600 bg-brand-50 px-3 py-1 rounded-lg'} font-bold whitespace-nowrap`}>
              ${listing.price}
            </div>
            {listing.originalPrice && (
              <span className="text-xs text-gray-400 line-through mt-1">Retail ${listing.originalPrice}</span>
            )}
            {!dealAnalysis && (
              <button 
                  onClick={handleAnalyzeDeal}
                  disabled={analyzing}
                  className={`flex items-center gap-1 text-[10px] font-bold mt-2 px-2.5 py-1 rounded-full transition-colors ${isHeirloom ? 'bg-[#E3D5CA]/30 text-[#B07D5B]' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
              >
                  {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Is this a good deal?
              </button>
            )}
          </div>
        </div>

        {/* Deal Analyzer Section */}
        {dealAnalysis && (
           <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className={`border rounded-xl p-4 shadow-sm relative overflow-hidden ${isHeirloom ? 'bg-white border-[#E3D5CA]' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'}`}>
                 <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`font-bold flex items-center gap-2 ${isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-900'}`}>
                        <Sparkles className="w-4 h-4 text-purple-500" /> AI Price Analysis
                      </h3>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${renderDealScoreColor(dealAnalysis.dealScore)}`}>
                       Score: {dealAnalysis.dealScore}/10
                    </div>
                 </div>
                 <p className="text-sm font-medium italic mb-2 text-gray-600">"{dealAnalysis.verdict}: {dealAnalysis.explanation}"</p>
                 <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Retail: ${dealAnalysis.estimatedRetailPrice}</span>
                    <span className="text-green-600 font-bold">{Math.round(dealAnalysis.savingsPercentage)}% Savings</span>
                 </div>
                 
                 {/* Display grounding sources for Search Grounding compliance */}
                 {dealAnalysis.sources && dealAnalysis.sources.length > 0 && (
                   <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight">Verified Price Sources:</p>
                      <div className="flex flex-wrap gap-2">
                         {dealAnalysis.sources.map((s, idx) => (
                           <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5">
                             <ExternalLink className="w-2.5 h-2.5" /> {s.title}
                           </a>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
           </div>
        )}

        {/* Safety Status */}
        <div onClick={() => setShowSafetyModal(true)} className={`my-6 rounded-xl border overflow-hidden cursor-pointer transition-colors ${isHeirloom ? 'bg-[#F5EBE0]/50 border-[#E3D5CA]' : 'bg-brand-50/50 border-brand-100 active:bg-brand-50'}`}>
           <div className="p-3 flex items-start gap-3">
              <SafetyBadge isVerified={listing.isSafetyVerified} size="lg" />
              <div className="flex-1">
                <p className={`text-xs mt-1 leading-relaxed ${isHeirloom ? 'text-[#5C5C5C]' : 'text-brand-800'}`}>
                  {listing.isSafetyVerified 
                    ? "This item has passed our AI-powered CPSC recall database check." 
                    : "This item requires manual safety verification."}
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 self-center ${isHeirloom ? 'text-[#C68E68]' : 'text-brand-300'}`} />
           </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`${isHeirloom ? 'bg-white border border-[#E3D5CA]' : 'bg-gray-50'} p-3 rounded-xl`}>
            <span className="text-xs text-gray-500 block mb-1">Condition</span>
            <span className={`font-medium ${isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-900'}`}>{listing.condition}</span>
          </div>
          <div className={`${isHeirloom ? 'bg-white border border-[#E3D5CA]' : 'bg-gray-50'} p-3 rounded-xl`}>
            <span className="text-xs text-gray-500 block mb-1">Age Range</span>
            <span className={`font-medium ${isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-900'}`}>{listing.ageRange}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className={`font-semibold mb-2 ${isHeirloom ? 'text-[#2F3E2E] font-serif text-lg' : 'text-gray-900'}`}>Description</h3>
          <p className={`leading-relaxed text-sm whitespace-pre-line ${isHeirloom ? 'text-[#5C5C5C]' : 'text-gray-600'}`}>{listing.description}</p>
        </div>

        {/* Seller Info */}
        <div className={`border-t pt-6 ${isHeirloom ? 'border-[#E3D5CA]' : 'border-gray-100'}`}>
           <h3 className={`font-semibold mb-4 ${isHeirloom ? 'text-[#2F3E2E] font-serif text-lg' : 'text-gray-900'}`}>Seller</h3>
           <Link to={`/user/${listing.userId}`} className={`flex items-center gap-4 p-3 rounded-2xl transition-colors ${isHeirloom ? 'bg-white border border-[#E3D5CA]' : 'hover:bg-gray-50 -ml-2'}`}>
             <img 
               src={seller?.avatarUrl || 'https://via.placeholder.com/100'} 
               className="w-12 h-12 rounded-full object-cover" 
               alt="Seller" 
             />
             <div className="flex-1">
               <div className="flex items-center gap-1">
                 <span className={`font-medium ${isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-900'}`}>{seller?.name || 'Unknown User'}</span>
                 {seller?.isVerifiedParent && <UserCheck className="w-3 h-3 text-blue-500" />}
               </div>
               <div className="text-xs text-gray-500">
                  {seller?.itemsSold || 0} items sold • Joined {seller?.joinDate}
               </div>
             </div>
             <div className="text-xs text-gray-400 text-right">
                <div className="flex items-center justify-end gap-1 mb-0.5">
                  <MapPin className="w-3 h-3" />
                  {listing.locationZip}
                </div>
                {listing.distanceMiles} miles away
             </div>
           </Link>
        </div>

        {/* Report Link */}
        <div className="mt-8 text-center pb-8">
          <button 
            onClick={handleReport}
            className="text-xs text-gray-400 flex items-center justify-center gap-1 mx-auto hover:text-red-500 transition-colors"
          >
            <Flag className="w-3 h-3" />
            Report this listing
          </button>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 border-t max-w-md mx-auto z-50 ${isHeirloom ? 'bg-[#F9F6F0] border-[#E3D5CA]' : 'bg-white border-gray-100'}`}>
        {isOwnListing ? (
          <div className="grid grid-cols-2 gap-3">
             {listing.isSold ? (
               <>
                 <button disabled className="bg-gray-100 text-gray-400 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <CheckCircle className="w-5 h-5" /> Sold
                </button>
                <button onClick={handleDelete} className="bg-red-50 text-red-600 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                  <Trash2 className="w-5 h-5" /> Delete
                </button>
               </>
             ) : (
               <>
                <button onClick={() => navigate(`/edit/${listing.id}`)} className="bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                  <Pencil className="w-5 h-5" /> Edit
                </button>
                <button onClick={handleMarkSold} className={`font-semibold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${isHeirloom ? 'bg-[#C68E68] text-white hover:bg-[#B07D5B]' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
                  <CheckCircle className="w-5 h-5" /> Mark Sold
                </button>
               </>
             )}
          </div>
        ) : (
          listing.isSold ? (
            <button disabled className="w-full bg-gray-100 text-gray-400 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
              This item has been sold
            </button>
          ) : (
            <div className="grid grid-cols-5 gap-3">
               <button 
                 onClick={handleMessageSeller}
                 className={`col-span-2 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors ${isHeirloom ? 'bg-white border border-[#C68E68] text-[#C68E68]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
               >
                 <MessageCircle className="w-5 h-5" />
                 Chat
               </button>
               <button 
                 onClick={handleRequestToBuy}
                 className={`col-span-3 font-semibold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${isHeirloom ? 'bg-[#C68E68] text-white hover:bg-[#B07D5B]' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
               >
                 <ShoppingBag className="w-5 h-5" />
                 {activeTransaction ? 'View Request' : 'Request to Buy'}
               </button>
            </div>
          )
        )}
      </div>

      {/* Safety Info Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 relative">
              <button onClick={() => setShowSafetyModal(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
              
              <div className="flex flex-col items-center text-center mb-6">
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isHeirloom ? 'bg-white border border-[#E3D5CA]' : 'bg-brand-100'}`}>
                    <ShieldCheck className={`w-8 h-8 ${isHeirloom ? 'text-[#C68E68]' : 'text-brand-600'}`} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">The Cradle Safety Promise</h3>
                 <p className="text-sm text-gray-500 leading-relaxed">
                    We use Google Gemini AI to analyze every listing against thousands of safety recalls.
                 </p>
              </div>

              <div className="space-y-4 mb-6">
                 <div className="flex gap-3 text-left">
                    <ScanLine className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isHeirloom ? 'text-[#C68E68]' : 'text-brand-500'}`} />
                    <div>
                       <h4 className="font-bold text-sm text-gray-900">Real-Time Check</h4>
                       <p className="text-xs text-gray-500">We scan the title, description, and images for known recalled models.</p>
                    </div>
                 </div>
                 <div className="flex gap-3 text-left">
                    <ExternalLink className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isHeirloom ? 'text-[#C68E68]' : 'text-brand-500'}`} />
                    <div>
                       <h4 className="font-bold text-sm text-gray-900">CPSC Database</h4>
                       <p className="text-xs text-gray-500">Cross-referenced with the official Consumer Product Safety Commission data.</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowSafetyModal(false)}
                className={`w-full py-3 text-white font-bold rounded-xl ${isHeirloom ? 'bg-[#C68E68]' : 'bg-brand-600'}`}
              >
                Got it
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
