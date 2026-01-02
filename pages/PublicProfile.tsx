
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, UserCheck, MapPin, Calendar, Star, Crown, UserPlus, Check, Sparkles, Loader2, Share2 } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { summarizeUserReputation } from '../services/geminiService';
import { useToast } from '../context/ToastContext';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserById, listings, getReviewsByUserId, currentUser, followUser, unfollowUser } = useStore();
  const { showToast } = useToast();
  
  const [reputationSummary, setReputationSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

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
    if (!currentUser) return navigate('/welcome');
    if (isFollowing) {
      unfollowUser(user.id);
    } else {
      followUser(user.id);
    }
  };

  const handleShare = async () => {
    const shareData = {
        title: `${user.name}'s Shop on Cradle`,
        text: `Check out items from ${user.name} on Cradle - the safest marketplace for parents.`,
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
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
            <h1 className="font-bold text-gray-900">Seller Profile</h1>
        </div>
        <button onClick={handleShare} className="p-2 hover:bg-gray-50 rounded-full">
            <Share2 className="w-5 h-5 text-gray-800" />
        </button>
      </div>

      <div className="p-6 bg-white mb-4">
        <div className="flex flex-col items-center text-center">
           <div className="relative mb-4">
              <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg bg-gray-100" />
              {user.isVerifiedParent && (
                <div className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full border-4 border-white flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
              )}
           </div>
           
           <div className="flex items-center gap-2 mb-1">
             <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
             {user.isPremium && <Crown className="w-4 h-4 text-yellow-500 fill-current" />}
           </div>
           
           <p className="text-sm text-gray-500 mb-4">{user.bio || "No bio yet."}</p>
           
           {/* Follow Button */}
           {!isMe && (
             <button 
               onClick={handleFollowToggle}
               className={`mb-4 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${isFollowing ? 'bg-gray-100 text-gray-800' : 'bg-black text-white'}`}
             >
               {isFollowing ? <><Check className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
             </button>
           )}
           
           {/* Rating */}
           <div className="flex items-center gap-1 mb-4 bg-yellow-50 px-3 py-1 rounded-full">
             <Star className="w-4 h-4 text-yellow-400 fill-current" />
             <span className="font-bold text-gray-900">{ratingValue.toFixed(1)}</span>
             <span className="text-xs text-gray-500">({reviewCount} reviews)</span>
           </div>

           <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                {user.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                Joined {user.joinDate}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="block text-xl font-bold text-gray-900">{userListings.length}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Active</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="block text-xl font-bold text-gray-900">{soldCount}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Sold</span>
              </div>
           </div>
        </div>
      </div>

      <div className="px-4 pb-10">
        
        {/* AI Reputation Summary */}
        {(loadingSummary || reputationSummary) && (
           <div className="mb-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-4 rounded-xl relative overflow-hidden">
                 <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-sm">
                    <Sparkles className="w-4 h-4" /> Seller Vibe Check
                 </div>
                 {loadingSummary ? (
                    <div className="flex items-center gap-2 text-xs text-indigo-400">
                       <Loader2 className="w-3 h-3 animate-spin" /> Analyzing reviews...
                    </div>
                 ) : (
                    <p className="text-sm text-indigo-900 leading-relaxed italic">
                      "{reputationSummary}"
                    </p>
                 )}
                 <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Sparkles className="w-16 h-16" />
                 </div>
              </div>
           </div>
        )}

        <h3 className="font-bold text-gray-900 mb-4 ml-1">Active Listings</h3>
        
        {userListings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {userListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 mb-6 bg-white rounded-xl">
             <p className="text-sm">No active listings.</p>
          </div>
        )}

        {/* Reviews Section */}
        <h3 className="font-bold text-gray-900 mb-4 ml-1">Recent Reviews</h3>
        <div className="space-y-3">
          {reviews.length > 0 ? reviews.map(review => (
            <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                   <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                     {review.authorName.charAt(0)}
                   </div>
                   <span className="font-medium text-sm">{review.authorName}</span>
                 </div>
                 <div className="flex text-yellow-400">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                   ))}
                 </div>
               </div>
               <p className="text-sm text-gray-600 leading-relaxed">"{review.comment}"</p>
               <span className="text-[10px] text-gray-400 mt-2 block">{review.date}</span>
            </div>
          )) : (
             <div className="text-center py-6 text-gray-400 bg-white rounded-xl">
                <p className="text-sm">No reviews yet.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
