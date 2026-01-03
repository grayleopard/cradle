
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, UserCheck, MapPin, Calendar, Star, Crown, UserPlus, Check, Sparkles, Loader2, Share2, Baby, Tag } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { summarizeUserReputation } from '../services/geminiService';
import { useToast } from '../context/ToastContext';
import AuthModal from '../components/AuthModal';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserById, listings, getReviewsByUserId, currentUser, followUser, unfollowUser } = useStore();
  const { showToast } = useToast();

  const [reputationSummary, setReputationSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingFollow, setPendingFollow] = useState(false);

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
        <h3 className="font-bold font-serif text-[#4A3F37] mb-4 ml-1">Recent Reviews</h3>
        <div className="space-y-3">
          {reviews.length > 0 ? reviews.map(review => (
            <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#E8DDD4]">
               <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                   <div className="bg-[#F5EDE6] w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#247A6F]">
                     {review.authorName.charAt(0)}
                   </div>
                   <span className="font-medium text-sm text-[#4A3F37]">{review.authorName}</span>
                 </div>
                 <div className="flex text-yellow-400">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                   ))}
                 </div>
               </div>
               <p className="text-sm text-[#6B5D52] leading-relaxed">"{review.comment}"</p>
               <span className="text-[10px] text-[#2D9B8C] mt-2 block">{review.date}</span>
            </div>
          )) : (
             <div className="text-center py-6 text-[#6B5D52] bg-white rounded-xl border border-[#E8DDD4]">
                <p className="text-sm">No reviews yet.</p>
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
