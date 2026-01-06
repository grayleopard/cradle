
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, UserCheck, MapPin, Calendar, Star, Crown, UserPlus, Check, Sparkles, Loader2, Share2, Baby, Tag, Filter, Image, MessageSquare, Send } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { summarizeUserReputation } from '../services/geminiService';
import { useToast } from '../context/ToastContext';
import AuthModal from '../components/AuthModal';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserById, listings, getReviewsByUserId, currentUser, followUser, unfollowUser, respondToReview } = useStore();
  const { showToast } = useToast();

  const [reputationSummary, setReputationSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingFollow, setPendingFollow] = useState(false);

  // Review filtering state
  const [reviewFilter, setReviewFilter] = useState<'all' | 'with_photos' | number>('all');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const user = getUserById(id || '');
  const userListings = listings.filter(l => l.userId === id && !l.isSold);
  const soldCount = listings.filter(l => l.userId === id && l.isSold).length + (user?.itemsSold || 0);
  const reviews = getReviewsByUserId(id || '');

  // Calculate Rating
  const ratingValue = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : (user?.rating || 0);
  const reviewCount = reviews.length || (user?.reviewCount || 0);

  const isFollowing = currentUser?.followingIds?.includes(user?.id || '');
  const isMe = currentUser?.id === user?.id;
  const isMyProfile = currentUser?.id === id;

  // Filtered reviews based on filter selection
  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'all') return reviews;
    if (reviewFilter === 'with_photos') return reviews.filter(r => r.photoUrl);
    return reviews.filter(r => r.rating === reviewFilter);
  }, [reviews, reviewFilter]);

  // Count reviews with photos
  const photoReviewCount = reviews.filter(r => r.photoUrl).length;

  // Star breakdown for filtering
  const starBreakdown = useMemo(() => {
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });
    return breakdown;
  }, [reviews]);

  const handleRespondToReview = (reviewId: string) => {
    if (!responseText.trim()) return;
    respondToReview(reviewId, responseText);
    setRespondingTo(null);
    setResponseText('');
    showToast('Response added!', 'success');
  };

  useEffect(() => {
    if (user && reviews.length > 0 && !reputationSummary) {
      setLoadingSummary(true);
      summarizeUserReputation(reviews, user.name, user.isVerifiedParent, soldCount)
        .then(summary => {
          setReputationSummary(summary);
          setLoadingSummary(false);
        });
    }
  }, [user, reviews.length]);

  if (!user) return <div className="p-4">User not found</div>;

  const handleFollowToggle = () => {
    if (!currentUser) {
      setPendingFollow(true);
      setShowAuthModal(true);
      return;
    }
    if (isFollowing) {
      unfollowUser(user.id);
    } else {
      followUser(user.id);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingFollow && user) {
      followUser(user.id);
      setPendingFollow(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
        title: `${user.name}'s Shop on Pipit`,
        text: `Check out items from ${user.name} on Pipit - the safest marketplace for parents.`,
        url: window.location.href,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error(err);
        }
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Profile link copied!', 'success');
    }
  };

  return (
    <div className="min-h-full bg-[#FFFCF9]">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-[#E8DDD4] flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#FFFCF9] rounded-full">
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
            </button>
            <h1 className="font-bold font-serif text-[#4A3F37]">Seller Profile</h1>
        </div>
        <button onClick={handleShare} className="p-2 hover:bg-[#FFFCF9] rounded-full">
            <Share2 className="w-5 h-5 text-[#4A3F37]" />
        </button>
      </div>

      <div className="p-6 bg-white mb-4 border-b border-[#E8DDD4]">
        <div className="flex flex-col items-center text-center">
           <div className="relative mb-4">
              <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg bg-gray-100" />
              {user.isVerifiedParent && (
                <div className="absolute bottom-0 right-0 bg-[#2D9B8C] p-2 rounded-full border-4 border-white flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
              )}
           </div>

           <div className="flex items-center gap-2 mb-1">
             <h2 className="text-xl font-bold font-serif text-[#4A3F37]">{user.name}</h2>
             {user.isPremium && <Crown className="w-4 h-4 text-yellow-500 fill-current" />}
           </div>

           <p className="text-sm text-[#6B5D52] mb-4">{user.bio || "No bio yet."}</p>

           {/* Follow Button */}
           {!isMe && (
             <button
               onClick={handleFollowToggle}
               className={`mb-4 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${isFollowing ? 'bg-[#FFFCF9] text-[#4A3F37] border border-[#E8DDD4]' : 'bg-[#4A3F37] text-white'}`}
             >
               {isFollowing ? <><Check className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
             </button>
           )}

           {/* Rating */}
           <div className="flex items-center gap-1 mb-4 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
             <Star className="w-4 h-4 text-yellow-400 fill-current" />
             <span className="font-bold text-[#4A3F37]">{ratingValue.toFixed(1)}</span>
             <span className="text-xs text-gray-500">({reviewCount} reviews)</span>
           </div>

           <div className="flex items-center gap-4 text-sm text-[#6B5D52] mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#2D9B8C]" />
                {user.neighborhood || user.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[#2D9B8C]" />
                Joined {user.joinDate}
              </div>
           </div>

           {/* Kid Ages */}
           {user.kidAges && user.kidAges.length > 0 && (
             <div className="flex items-center gap-2 mb-4">
               <Baby className="w-4 h-4 text-[#2D9B8C]" />
               <span className="text-sm text-[#6B5D52]">
                 Kids: {user.kidAges.map(age => age === 0 ? '<1' : `${age}`).join(', ')} years
               </span>
             </div>
           )}

           {/* Parenting Tags */}
           {user.parentingTags && user.parentingTags.length > 0 && (
             <div className="flex flex-wrap justify-center gap-2 mb-6">
               {user.parentingTags.map((tag, index) => (
                 <span
                   key={index}
                   className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5EDE6] text-[#247A6F] rounded-full text-xs font-medium"
                 >
                   <Tag className="w-3 h-3" /> {tag}
                 </span>
               ))}
             </div>
           )}

           <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="bg-[#FFFCF9] rounded-xl p-3 border border-[#E8DDD4]">
                <span className="block text-xl font-bold text-[#4A3F37]">{userListings.length}</span>
                <span className="text-xs text-[#6B5D52] uppercase tracking-wide">Active</span>
              </div>
              <div className="bg-[#FFFCF9] rounded-xl p-3 border border-[#E8DDD4]">
                <span className="block text-xl font-bold text-[#4A3F37]">{soldCount}</span>
                <span className="text-xs text-[#6B5D52] uppercase tracking-wide">Sold</span>
              </div>
           </div>
        </div>
      </div>

      <div className="px-4 pb-10">
        
        {/* AI Reputation Summary */}
        {(loadingSummary || reputationSummary) && (
           <div className="mb-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-gradient-to-r from-[#F5EDE6] to-[#E8DDD4]/50 border border-[#E8DDD4] p-4 rounded-xl relative overflow-hidden">
                 <div className="flex items-center gap-2 mb-2 text-[#247A6F] font-bold text-sm">
                    <Sparkles className="w-4 h-4" /> Seller Vibe Check
                 </div>
                 {loadingSummary ? (
                    <div className="flex items-center gap-2 text-xs text-[#2D9B8C]">
                       <Loader2 className="w-3 h-3 animate-spin" /> Analyzing reviews...
                    </div>
                 ) : (
                    <p className="text-sm text-[#4A3F37] leading-relaxed italic">
                      "{reputationSummary}"
                    </p>
                 )}
                 <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Sparkles className="w-16 h-16" />
                 </div>
              </div>
           </div>
        )}

        <h3 className="font-bold font-serif text-[#4A3F37] mb-4 ml-1">Active Listings</h3>
        
        {userListings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {userListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[#6B5D52] mb-6 bg-white rounded-xl border border-[#E8DDD4]">
             <p className="text-sm">No active listings.</p>
          </div>
        )}

        {/* Reviews Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-serif text-[#4A3F37] ml-1">Reviews ({reviews.length})</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#B8A395]" />
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value === 'all' || e.target.value === 'with_photos' ? e.target.value : Number(e.target.value))}
                className="text-xs bg-transparent text-[#6B5D52] border-none focus:outline-none cursor-pointer"
              >
                <option value="all">All reviews</option>
                {photoReviewCount > 0 && <option value="with_photos">With photos ({photoReviewCount})</option>}
                {[5, 4, 3, 2, 1].filter(star => starBreakdown[star] > 0).map(star => (
                  <option key={star} value={star}>{star} star{star !== 1 ? 's' : ''} ({starBreakdown[star]})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Star breakdown bar */}
        {reviews.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-[#E8DDD4] mb-4">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => (
                <button
                  key={star}
                  onClick={() => setReviewFilter(reviewFilter === star ? 'all' : star)}
                  className={`w-full flex items-center gap-2 hover:bg-[#F5EDE6] rounded-lg p-1 transition-colors ${reviewFilter === star ? 'bg-[#F5EDE6]' : ''}`}
                >
                  <span className="text-xs text-[#6B5D52] w-4">{star}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-[#F5EDE6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${reviews.length ? (starBreakdown[star] / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#B8A395] w-8 text-right">{starBreakdown[star]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredReviews.length > 0 ? filteredReviews.map(review => (
            <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#E8DDD4]">
               {/* Review header */}
               <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                   {review.authorAvatarUrl ? (
                     <img src={review.authorAvatarUrl} alt={review.authorName} className="w-8 h-8 rounded-full object-cover" />
                   ) : (
                     <div className="bg-[#F5EDE6] w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#247A6F]">
                       {review.authorName.charAt(0)}
                     </div>
                   )}
                   <div>
                     <span className="font-medium text-sm text-[#4A3F37]">{review.authorName}</span>
                     {review.itemTitle && (
                       <p className="text-[10px] text-[#B8A395]">Purchased: {review.itemTitle}</p>
                     )}
                   </div>
                 </div>
                 <div className="flex text-yellow-400">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                   ))}
                 </div>
               </div>

               {/* Review comment */}
               <p className="text-sm text-[#6B5D52] leading-relaxed">"{review.comment}"</p>

               {/* Review photo */}
               {review.photoUrl && (
                 <div className="mt-3">
                   <img
                     src={review.photoUrl}
                     alt="Review photo"
                     className="w-full max-w-xs h-40 object-cover rounded-lg border border-[#E8DDD4]"
                   />
                 </div>
               )}

               <span className="text-[10px] text-[#2D9B8C] mt-2 block">{review.date}</span>

               {/* Seller Response */}
               {review.sellerResponse && (
                 <div className="mt-3 bg-[#F5EDE6] rounded-lg p-3 border-l-2 border-[#2D9B8C]">
                   <div className="flex items-center gap-1 mb-1">
                     <MessageSquare className="w-3 h-3 text-[#2D9B8C]" />
                     <span className="text-xs font-bold text-[#247A6F]">Seller's response</span>
                   </div>
                   <p className="text-xs text-[#6B5D52]">{review.sellerResponse}</p>
                   {review.sellerResponseDate && (
                     <span className="text-[10px] text-[#B8A395] mt-1 block">{review.sellerResponseDate}</span>
                   )}
                 </div>
               )}

               {/* Respond button for seller (only on their own profile) */}
               {isMyProfile && !review.sellerResponse && (
                 respondingTo === review.id ? (
                   <div className="mt-3 space-y-2">
                     <textarea
                       value={responseText}
                       onChange={(e) => setResponseText(e.target.value)}
                       placeholder="Write your response..."
                       className="w-full p-2 text-sm bg-[#F5EDE6] border border-[#E8DDD4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]"
                       rows={2}
                     />
                     <div className="flex gap-2">
                       <button
                         onClick={() => handleRespondToReview(review.id)}
                         className="flex-1 py-1.5 bg-[#2D9B8C] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                       >
                         <Send className="w-3 h-3" /> Post Response
                       </button>
                       <button
                         onClick={() => { setRespondingTo(null); setResponseText(''); }}
                         className="px-4 py-1.5 bg-[#E8DDD4] text-[#6B5D52] text-xs font-bold rounded-lg"
                       >
                         Cancel
                       </button>
                     </div>
                   </div>
                 ) : (
                   <button
                     onClick={() => setRespondingTo(review.id)}
                     className="mt-2 text-xs text-[#2D9B8C] font-medium hover:underline flex items-center gap-1"
                   >
                     <MessageSquare className="w-3 h-3" /> Respond to review
                   </button>
                 )
               )}
            </div>
          )) : (
             <div className="text-center py-6 text-[#6B5D52] bg-white rounded-xl border border-[#E8DDD4]">
                <p className="text-sm">
                  {reviewFilter === 'all' ? 'No reviews yet.' : 'No reviews match this filter.'}
                </p>
                {reviewFilter !== 'all' && (
                  <button
                    onClick={() => setReviewFilter('all')}
                    className="mt-2 text-xs text-[#2D9B8C] font-medium hover:underline"
                  >
                    Show all reviews
                  </button>
                )}
             </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingFollow(false); }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default PublicProfile;
