
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Share2, Heart, MapPin, UserCheck, MessageCircle, Cigarette, Dog, Shield, Pencil, CheckCircle, Trash2, ChevronRight, Flag, ShoppingBag, ExternalLink, Sparkles, Loader2, TrendingUp, DollarSign, Home, X, ScanLine, ShieldCheck, Star, Tag, Send } from 'lucide-react';
import SafetyBadge from '../components/SafetyBadge';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import AuthModal from '../components/AuthModal';
import { analyzeDeal, DealAnalysisError } from '../services/geminiService';
import { DealAnalysis, OfferStatus } from '../types';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getListingById, startConversation, sendMessage, currentUser, getUserById, markAsSold, deleteListing, toggleFavorite, createTransaction, getActiveTransactionForListing, reportListing, getReviewsByUserId, createOffer, getOffersForListing } = useStore();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Deal Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [dealAnalysis, setDealAnalysis] = useState<DealAnalysis | DealAnalysisError | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'message' | 'buy' | 'favorite' | 'offer' | null>(null);

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

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
  const sellerReviews = getReviewsByUserId(listing.userId);
  const sellerRating = sellerReviews.length > 0
    ? sellerReviews.reduce((acc, r) => acc + r.rating, 0) / sellerReviews.length
    : (seller?.rating || 0);
  const isOwnListing = currentUser?.id === listing.userId;
  const isFavorite = currentUser?.savedListingIds?.includes(listing.id);
  const activeTransaction = getActiveTransactionForListing(listing.id);
  const isPipitV2 = theme === 'pipit-v2';

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

  const handleMessageSeller = async () => {
    if (!currentUser) {
      setPendingAction('message');
      setShowAuthModal(true);
      return;
    }
    const conversationId = await startConversation(listing.id);
    navigate(`/chat/${conversationId}`);
  };

  const handleRequestToBuy = async () => {
    if (!currentUser) {
      setPendingAction('buy');
      setShowAuthModal(true);
      return;
    }
    if (activeTransaction) {
      navigate(`/transaction/${activeTransaction.id}`);
      return;
    }

    // 1. Create the Transaction record
    const txId = await createTransaction(listing.id);

    // 2. Automatically start chat & notify seller
    const conversationId = await startConversation(listing.id);
    sendMessage(conversationId, "👋 I'm interested in buying this! I've sent a formal purchase request.");

    showToast("Request sent! Seller notified in chat.", "success");
    navigate(`/transaction/${txId}`);
  };

  // Handle auth success - execute pending action
  const handleAuthSuccess = () => {
    if (pendingAction === 'message') {
      handleMessageSeller();
    } else if (pendingAction === 'buy') {
      handleRequestToBuy();
    } else if (pendingAction === 'favorite') {
      toggleFavorite(listing.id);
      showToast('Added to favorites', 'success');
    } else if (pendingAction === 'offer') {
      setShowOfferModal(true);
    }
    setPendingAction(null);
  };

  // Handle Make Offer
  const handleMakeOffer = () => {
    if (!currentUser) {
      setPendingAction('offer');
      setShowAuthModal(true);
      return;
    }
    setOfferAmount('');
    setOfferMessage('');
    setShowOfferModal(true);
  };

  const handleSubmitOffer = async () => {
    if (!listing || !offerAmount) return;

    const amount = parseInt(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (amount >= listing.price) {
      showToast('Offer must be less than the asking price', 'error');
      return;
    }

    setSubmittingOffer(true);
    try {
      await createOffer(listing.id, amount, offerMessage || undefined);

      // Start chat and notify seller
      const conversationId = await startConversation(listing.id);
      sendMessage(conversationId, `💰 I've made an offer of $${amount} for this item.${offerMessage ? ` "${offerMessage}"` : ''}`);

      setShowOfferModal(false);
      showToast('Offer sent! The seller will be notified.', 'success');
    } catch (e) {
      showToast('Failed to send offer', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Get user's existing offer for this listing
  const myPendingOffer = listing ? getOffersForListing(listing.id).find(
    o => o.buyerId === currentUser?.id && (o.status === OfferStatus.PENDING || o.status === OfferStatus.COUNTERED)
  ) : null;

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
    if (!currentUser) {
      setPendingAction('favorite');
      setShowAuthModal(true);
      return;
    }
    toggleFavorite(listing.id);
    showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success');
  };

  const handleShare = async () => {
    const shareData = {
      title: `Check out this ${listing.title} on Pipit`,
      text: `I found this ${listing.title} for $${listing.price} on Pipit - the safest way to buy baby gear!`,
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
      if (result) {
        setDealAnalysis(result);
      } else {
        showToast("Could not analyze deal. Try again.", "error");
      }
    } catch (e) {
      showToast("Analysis failed", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper to check if dealAnalysis is an error
  const isDealAnalysisError = (result: DealAnalysis | DealAnalysisError | null): result is DealAnalysisError => {
    return result !== null && 'error' in result && result.error === true;
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
        className={`min-h-full pb-40 relative ${isPipitV2 ? 'bg-[#FFFCF9]' : 'bg-white'}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      
      {/* Top Nav Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-[60] pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={handleBack} 
            className={`p-2 rounded-full shadow-sm transition-colors cursor-pointer ${isPipitV2 ? 'bg-[#FFFCF9]/80 text-[#4A3F37] hover:bg-[#FFFCF9]' : 'bg-white/80 backdrop-blur-md text-gray-800 hover:bg-white'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {!isPipitV2 && (
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
             className={`p-2 rounded-full shadow-sm transition-colors cursor-pointer ${isPipitV2 ? 'bg-[#FFFCF9]/80 text-[#4A3F37] hover:bg-[#FFFCF9]' : 'bg-white/80 backdrop-blur-md text-gray-800 hover:bg-white'}`}
           >
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full shadow-sm transition-colors cursor-pointer ${isPipitV2 ? 'bg-[#FFFCF9]/80 hover:bg-[#FFFCF9]' : 'bg-white/80 backdrop-blur-md hover:bg-white'} ${isFavorite ? 'text-red-500' : isPipitV2 ? 'text-[#4A3F37]' : 'text-gray-800'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Image Gallery Carousel */}
      <div className={`w-full relative group ${isPipitV2 ? 'h-[50vh] rounded-b-[2.5rem] overflow-hidden shadow-sm' : 'h-80 bg-gray-200'}`}>
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
      <div className={`relative z-0 ${isPipitV2 ? 'px-6 pt-6' : 'p-5 -mt-6 bg-white rounded-t-3xl'}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-4">
            <span className={`text-xs font-semibold uppercase tracking-wide ${isPipitV2 ? 'text-[#2D9B8C]' : 'text-[#2D9B8C]'}`}>{listing.category}</span>
            <h1 className={`${isPipitV2 ? 'font-serif text-3xl text-[#4A3F37] mt-2' : 'text-2xl font-bold text-[#4A3F37] mt-1'} leading-tight`}>{listing.title}</h1>
          </div>
          <div className="flex flex-col items-end">
            <div className={`${isPipitV2 ? 'text-2xl font-sans text-[#4A3F37]' : 'text-xl text-[#2D9B8C] bg-[#F0FAF8] px-3 py-1 rounded-lg'} font-bold whitespace-nowrap`}>
              ${listing.price}
            </div>
            {listing.originalPrice && (
              <span className="text-xs text-[#B8A395] line-through mt-1">Retail ${listing.originalPrice}</span>
            )}
            {!dealAnalysis && (
              <button 
                  onClick={handleAnalyzeDeal}
                  disabled={analyzing}
                  className={`flex items-center gap-1 text-[10px] font-bold mt-2 px-2.5 py-1 rounded-full transition-colors ${isPipitV2 ? 'bg-[#E8DDD4]/30 text-[#247A6F]' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
              >
                  {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Is this a good deal?
              </button>
            )}
          </div>
        </div>

        {/* Deal Analyzer Section */}
        {dealAnalysis && isDealAnalysisError(dealAnalysis) && (
           <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className={`border rounded-xl p-4 shadow-sm relative overflow-hidden ${isPipitV2 ? 'bg-[#FFF4D9]/50 border-[#E8B44C]/30' : 'bg-yellow-50 border-yellow-200'}`}>
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E8B44C]/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#B45309]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#4A3F37] text-sm mb-1">AI Price Analysis Unavailable</h3>
                      <p className="text-xs text-[#6B5D52]">{dealAnalysis.message}</p>
                      <button
                        onClick={() => setDealAnalysis(null)}
                        className="mt-2 text-xs text-[#2D9B8C] hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                 </div>
              </div>
           </div>
        )}
        {dealAnalysis && !isDealAnalysisError(dealAnalysis) && (
           <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className={`border rounded-xl p-4 shadow-sm relative overflow-hidden ${isPipitV2 ? 'bg-white border-[#E8DDD4]' : 'bg-gradient-to-br from-gray-50 to-white border-[#E8DDD4]'}`}>
                 <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`font-bold flex items-center gap-2 ${isPipitV2 ? 'text-[#4A3F37]' : 'text-[#4A3F37]'}`}>
                        <Sparkles className="w-4 h-4 text-purple-500" /> AI Price Analysis
                      </h3>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${renderDealScoreColor(dealAnalysis.dealScore)}`}>
                       Score: {dealAnalysis.dealScore}/10
                    </div>
                 </div>
                 <p className="text-sm font-medium italic mb-2 text-[#6B5D52]">"{dealAnalysis.verdict}: {dealAnalysis.explanation}"</p>
                 <div className="flex justify-between text-xs text-[#9A8578] mb-2">
                    <span>Retail: ${dealAnalysis.estimatedRetailPrice}</span>
                    <span className="text-green-600 font-bold">{Math.round(dealAnalysis.savingsPercentage)}% Savings</span>
                 </div>

                 {/* Display grounding sources for Search Grounding compliance */}
                 {dealAnalysis.sources && dealAnalysis.sources.length > 0 && (
                   <div className="mt-2 pt-2 border-t border-[#F5EDE6]">
                      <p className="text-[10px] font-bold text-[#B8A395] mb-1 uppercase tracking-tight">Verified Price Sources:</p>
                      <div className="flex flex-wrap gap-2">
                         {dealAnalysis.sources.map((s, idx) => (
                           <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#2D9B8C] hover:underline flex items-center gap-0.5">
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
        <div onClick={() => setShowSafetyModal(true)} className={`my-6 rounded-xl border overflow-hidden cursor-pointer transition-colors ${isPipitV2 ? 'bg-[#F5EDE6]/50 border-[#E8DDD4]' : 'bg-[#F0FAF8]/50 border-brand-100 active:bg-[#F0FAF8]'}`}>
           <div className="p-3 flex items-start gap-3">
              <SafetyBadge isVerified={listing.isSafetyVerified} size="lg" />
              <div className="flex-1">
                <p className={`text-xs mt-1 leading-relaxed ${isPipitV2 ? 'text-[#6B5D52]' : 'text-brand-800'}`}>
                  {listing.isSafetyVerified 
                    ? "This item has passed our AI-powered CPSC recall database check." 
                    : "This item requires manual safety verification."}
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 self-center ${isPipitV2 ? 'text-[#2D9B8C]' : 'text-brand-300'}`} />
           </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`${isPipitV2 ? 'bg-white border border-[#E8DDD4]' : 'bg-[#F5EDE6]'} p-3 rounded-xl`}>
            <span className="text-xs text-[#9A8578] block mb-1">Condition</span>
            <span className={`font-medium ${isPipitV2 ? 'text-[#4A3F37]' : 'text-[#4A3F37]'}`}>{listing.condition}</span>
          </div>
          <div className={`${isPipitV2 ? 'bg-white border border-[#E8DDD4]' : 'bg-[#F5EDE6]'} p-3 rounded-xl`}>
            <span className="text-xs text-[#9A8578] block mb-1">Age Range</span>
            <span className={`font-medium ${isPipitV2 ? 'text-[#4A3F37]' : 'text-[#4A3F37]'}`}>{listing.ageRange}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className={`font-semibold mb-2 ${isPipitV2 ? 'text-[#4A3F37] font-serif text-lg' : 'text-[#4A3F37]'}`}>Description</h3>
          <p className={`leading-relaxed text-sm whitespace-pre-line ${isPipitV2 ? 'text-[#6B5D52]' : 'text-[#6B5D52]'}`}>{listing.description}</p>
        </div>

        {/* Seller Info */}
        <div className={`border-t pt-6 ${isPipitV2 ? 'border-[#E8DDD4]' : 'border-[#F5EDE6]'}`}>
           <h3 className={`font-semibold mb-4 ${isPipitV2 ? 'text-[#4A3F37] font-serif text-lg' : 'text-[#4A3F37]'}`}>Seller</h3>
           <Link to={`/user/${listing.userId}`} className={`flex items-center gap-4 p-3 rounded-2xl transition-colors ${isPipitV2 ? 'bg-white border border-[#E8DDD4]' : 'hover:bg-[#F5EDE6] -ml-2'}`}>
             <img 
               src={seller?.avatarUrl || 'https://via.placeholder.com/100'} 
               className="w-12 h-12 rounded-full object-cover" 
               alt="Seller" 
             />
             <div className="flex-1">
               <div className="flex items-center gap-1">
                 <span className={`font-medium ${isPipitV2 ? 'text-[#4A3F37]' : 'text-[#4A3F37]'}`}>{seller?.name || 'Unknown User'}</span>
                 {seller?.isVerifiedParent && <UserCheck className="w-3 h-3 text-blue-500" />}
               </div>
               <div className="flex items-center gap-2 mt-0.5">
                 {sellerRating > 0 && (
                   <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded">
                     <Star className="w-3 h-3 text-yellow-400 fill-current" />
                     <span className="text-xs font-medium text-[#4A3F37]">{sellerRating.toFixed(1)}</span>
                     <span className="text-[10px] text-[#B8A395]">({sellerReviews.length})</span>
                   </div>
                 )}
                 <span className="text-xs text-[#9A8578]">
                    {seller?.itemsSold || 0} sold
                 </span>
               </div>
             </div>
             <div className="text-xs text-[#B8A395] text-right">
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
            className="text-xs text-[#B8A395] flex items-center justify-center gap-1 mx-auto hover:text-red-500 transition-colors"
          >
            <Flag className="w-3 h-3" />
            Report this listing
          </button>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 border-t max-w-md mx-auto z-50 ${isPipitV2 ? 'bg-[#FFFCF9] border-[#E8DDD4]' : 'bg-white border-[#F5EDE6]'}`}>
        {isOwnListing ? (
          <div className="grid grid-cols-2 gap-3">
             {listing.isSold ? (
               <>
                 <button disabled className="bg-[#E8DDD4] text-[#B8A395] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <CheckCircle className="w-5 h-5" /> Sold
                </button>
                <button onClick={handleDelete} className="bg-red-50 text-red-600 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                  <Trash2 className="w-5 h-5" /> Delete
                </button>
               </>
             ) : (
               <>
                <button onClick={() => navigate(`/edit/${listing.id}`)} className="bg-white border-2 border-[#E8DDD4] text-[#4A3F37] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#F5EDE6] transition-colors">
                  <Pencil className="w-5 h-5" /> Edit
                </button>
                <button onClick={handleMarkSold} className={`font-semibold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${isPipitV2 ? 'bg-[#2D9B8C] text-white hover:bg-[#247A6F]' : 'bg-[#2D9B8C] text-white hover:bg-[#247A6F]'}`}>
                  <CheckCircle className="w-5 h-5" /> Mark Sold
                </button>
               </>
             )}
          </div>
        ) : (
          listing.isSold ? (
            <button disabled className="w-full bg-[#E8DDD4] text-[#B8A395] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
              This item has been sold
            </button>
          ) : myPendingOffer ? (
            // Show pending offer status
            <div className="space-y-2">
              <div className={`p-3 rounded-xl text-center ${myPendingOffer.status === OfferStatus.COUNTERED ? 'bg-yellow-50 border border-yellow-200' : 'bg-[#F5EDE6] border border-[#E8DDD4]'}`}>
                {myPendingOffer.status === OfferStatus.COUNTERED ? (
                  <>
                    <p className="text-sm font-medium text-yellow-800">Counter offer: ${myPendingOffer.counterAmount}</p>
                    <p className="text-xs text-yellow-600">Your offer: ${myPendingOffer.amount}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-[#4A3F37]">Offer pending: ${myPendingOffer.amount}</p>
                    <p className="text-xs text-[#6B5D52]">Waiting for seller response</p>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleMessageSeller}
                  className="font-semibold py-3 rounded-xl flex items-center justify-center gap-2 bg-white border border-[#2D9B8C] text-[#2D9B8C]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
                {myPendingOffer.status === OfferStatus.COUNTERED && (
                  <button
                    onClick={async () => {
                      // Accept counter offer - create transaction at counter price
                      const txId = await createTransaction(listing.id, myPendingOffer.id, myPendingOffer.counterAmount);
                      showToast('Counter offer accepted!', 'success');
                      navigate(`/transaction/${txId}`);
                    }}
                    className="font-semibold py-3 rounded-xl flex items-center justify-center gap-2 bg-[#2D9B8C] text-white"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept ${myPendingOffer.counterAmount}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleMessageSeller}
                  className={`font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors ${isPipitV2 ? 'bg-white border border-[#E8DDD4] text-[#4A3F37]' : 'bg-[#E8DDD4] text-[#4A3F37] hover:bg-gray-200'}`}
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </button>
                <button
                  onClick={handleMakeOffer}
                  className={`font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors ${isPipitV2 ? 'bg-white border border-[#2D9B8C] text-[#2D9B8C]' : 'bg-[#E8DDD4] text-[#4A3F37] hover:bg-gray-200'}`}
                >
                  <Tag className="w-5 h-5" />
                  Make Offer
                </button>
              </div>
              <button
                onClick={handleRequestToBuy}
                className={`w-full font-semibold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${isPipitV2 ? 'bg-[#2D9B8C] text-white hover:bg-[#247A6F]' : 'bg-[#2D9B8C] text-white hover:bg-[#247A6F]'}`}
              >
                <ShoppingBag className="w-5 h-5" />
                {activeTransaction ? 'View Request' : `Buy Now • $${listing.price}`}
              </button>
            </div>
          )
        )}
      </div>

      {/* Safety Info Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 relative">
              <button onClick={() => setShowSafetyModal(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-[#E8DDD4]"><X className="w-5 h-5 text-[#9A8578]" /></button>
              
              <div className="flex flex-col items-center text-center mb-6">
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isPipitV2 ? 'bg-white border border-[#E8DDD4]' : 'bg-brand-100'}`}>
                    <ShieldCheck className={`w-8 h-8 ${isPipitV2 ? 'text-[#2D9B8C]' : 'text-[#2D9B8C]'}`} />
                 </div>
                 <h3 className="text-xl font-bold text-[#4A3F37] mb-2">The Pipit Safety Promise</h3>
                 <p className="text-sm text-[#9A8578] leading-relaxed">
                    We use Google Gemini AI to analyze every listing against thousands of safety recalls.
                 </p>
              </div>

              <div className="space-y-4 mb-6">
                 <div className="flex gap-3 text-left">
                    <ScanLine className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPipitV2 ? 'text-[#2D9B8C]' : 'text-brand-500'}`} />
                    <div>
                       <h4 className="font-bold text-sm text-[#4A3F37]">Real-Time Check</h4>
                       <p className="text-xs text-[#9A8578]">We scan the title, description, and images for known recalled models.</p>
                    </div>
                 </div>
                 <div className="flex gap-3 text-left">
                    <ExternalLink className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPipitV2 ? 'text-[#2D9B8C]' : 'text-brand-500'}`} />
                    <div>
                       <h4 className="font-bold text-sm text-[#4A3F37]">CPSC Database</h4>
                       <p className="text-xs text-[#9A8578]">Cross-referenced with the official Consumer Product Safety Commission data.</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowSafetyModal(false)}
                className={`w-full py-3 text-white font-bold rounded-xl ${isPipitV2 ? 'bg-[#2D9B8C]' : 'bg-[#2D9B8C]'}`}
              >
                Got it
              </button>
           </div>
        </div>
      )}

      {/* Make Offer Modal */}
      {showOfferModal && listing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 relative">
            <button
              onClick={() => setShowOfferModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-[#E8DDD4]"
            >
              <X className="w-5 h-5 text-[#9A8578]" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#4A3F37] font-serif mb-1">Make an Offer</h3>
              <p className="text-sm text-[#6B5D52]">
                Asking price: <span className="font-semibold">${listing.price}</span>
              </p>
            </div>

            {/* Quick offer buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[0.9, 0.85, 0.8].map((percent) => {
                const suggestedPrice = Math.round(listing.price * percent);
                return (
                  <button
                    key={percent}
                    onClick={() => setOfferAmount(suggestedPrice.toString())}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      offerAmount === suggestedPrice.toString()
                        ? 'bg-[#2D9B8C] text-white'
                        : 'bg-[#F5EDE6] text-[#4A3F37] hover:bg-[#E8DDD4]'
                    }`}
                  >
                    ${suggestedPrice}
                  </button>
                );
              })}
            </div>

            {/* Custom amount input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#6B5D52] mb-1">
                Your offer
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A3F37] font-medium">
                  $
                </span>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder={Math.round(listing.price * 0.85).toString()}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#E8DDD4] text-[#4A3F37] text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]"
                />
              </div>
              {offerAmount && parseInt(offerAmount) < listing.price && (
                <p className="text-xs text-[#2D9B8C] mt-1">
                  {Math.round((1 - parseInt(offerAmount) / listing.price) * 100)}% off asking price
                </p>
              )}
            </div>

            {/* Optional message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#6B5D52] mb-1">
                Message (optional)
              </label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="I'm very interested in this item..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] text-[#4A3F37] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] resize-none"
              />
            </div>

            <button
              onClick={handleSubmitOffer}
              disabled={submittingOffer || !offerAmount}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-[#2D9B8C] hover:bg-[#247A6F] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submittingOffer ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Offer
                </>
              )}
            </button>

            <p className="text-[10px] text-[#B8A395] text-center mt-3">
              The seller has 24 hours to respond to your offer
            </p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default ListingDetail;
