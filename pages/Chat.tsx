
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Send, Shield, MapPin, CheckCircle, Star, ShoppingBag, AlertTriangle, PackagePlus, Sparkles, CalendarCheck, Clock, CalendarPlus, X, Plus, DollarSign } from 'lucide-react';
import { Review, TransactionStatus, Listing } from '../types';
import { generateSmartReplies, extractMeetingDetails, MeetingDetails } from '../services/geminiService';

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getConversationById, getMessagesByConversationId, getListingById, sendMessage, currentUser, markAsSold, addReview, getUserById, getActiveTransactionForListing, createTransaction, updateTransactionStatus, listings } = useStore();
  const { theme } = useTheme();
  const { showToast } = useToast();
  
  const [inputText, setInputText] = useState('');
  const [showMeetupOptions, setShowMeetupOptions] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  
  // Bundle State
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [sellerOtherListings, setSellerOtherListings] = useState<Listing[]>([]);
  const [selectedBundleItems, setSelectedBundleItems] = useState<string[]>([]);
  const [bundleOfferPrice, setBundleOfferPrice] = useState('');

  // Smart Features State
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [detectedPlan, setDetectedPlan] = useState<MeetingDetails | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversation = getConversationById(id || '');
  const listing = conversation ? getListingById(conversation.listingId) : undefined;
  const messages = id ? getMessagesByConversationId(id) : [];
  const activeTransaction = listing ? getActiveTransactionForListing(listing.id) : undefined;

  const isSeller = currentUser && listing && currentUser.id === listing.userId;
  const otherParticipantId = conversation?.participantIds.find(pid => pid !== currentUser?.id);
  const otherUser = otherParticipantId ? getUserById(otherParticipantId) : null;
  
  const isHeirloom = theme === 'heirloom';

  const isMeetupScheduled = activeTransaction?.status === TransactionStatus.MEETUP_AGREED;

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
    
    const riskKeywords = ['venmo', 'cashapp', 'zelle', 'paypal', 'phone number', 'call me', '@gmail', 'yahoo'];
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    
    const hasRisk = messages.some(m => {
       const lower = m.text.toLowerCase();
       return riskKeywords.some(kw => lower.includes(kw)) || phoneRegex.test(m.text);
    });
    
    setShowRiskWarning(hasRisk);
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
    // Extra scroll for mobile keyboard
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => scrollToBottom("auto"));
    }
  }, []);

  useEffect(() => {
    if (listing && showBundleModal) {
      const others = listings.filter(l => l.userId === listing.userId && l.id !== listing.id && !l.isSold);
      setSellerOtherListings(others);
    }
  }, [listing, showBundleModal, listings]);

  useEffect(() => {
    if (!messages.length || !currentUser || !listing || !otherUser) return;
    
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.senderId !== currentUser.id) {
        setRepliesLoading(true);
        generateSmartReplies(
            isSeller ? 'seller' : 'buyer',
            otherUser.name,
            listing.title,
            listing.price,
            lastMessage.text,
            messages
        ).then(replies => {
            setSmartReplies(replies);
            setRepliesLoading(false);
        });
    } else {
        setSmartReplies([]);
    }

    if (!isMeetupScheduled && messages.length > 2) {
       extractMeetingDetails(messages).then(details => {
          if (details && details.isAgreed && (details.dateTime || details.location)) {
             setDetectedPlan(details);
          }
       });
    }

  }, [messages.length, isMeetupScheduled]);

  if (!conversation || !listing) return <div className="p-4">Conversation not found</div>;

  const handleSend = (e: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || inputText;
    
    if (!textToSend.trim()) return;
    sendMessage(conversation.id, textToSend);
    setInputText('');
    setSmartReplies([]); 
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    // Delay slightly to wait for keyboard animation
    setTimeout(() => scrollToBottom("smooth"), 300);
  };

  const handleSuggestMeetup = (location: string) => {
    sendMessage(conversation.id, `I'd like to meet at the ${location} for the exchange.`);
    setShowMeetupOptions(false);
    setSmartReplies([]);
  };

  const handleToggleBundleItem = (itemId: string) => {
    setSelectedBundleItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmitBundle = () => {
    if (selectedBundleItems.length === 0) return;
    
    const bundleItems = sellerOtherListings.filter(l => selectedBundleItems.includes(l.id));
    const titles = bundleItems.map(l => l.title).join(', ');
    const totalOriginal = bundleItems.reduce((acc, l) => acc + l.price, 0) + listing.price;
    const offer = bundleOfferPrice ? `$${bundleOfferPrice}` : `$${Math.round(totalOriginal * 0.85)}`; 

    const message = `🛍️ BUNDLE OFFER: I'm interested in buying this item + ${titles} for a total of ${offer}. Does that work for you?`;
    
    sendMessage(conversation.id, message);
    setShowBundleModal(false);
    setSelectedBundleItems([]);
    setBundleOfferPrice('');
    showToast("Bundle offer sent!", "success");
  };

  const handleMarkAsSold = () => {
     if(window.confirm("Confirm you sold this item to this buyer?")) {
        markAsSold(listing.id);
        sendMessage(conversation.id, "✅ Item marked as SOLD. Thanks for the smooth transaction!");
        setShowReviewModal(true);
     }
  };

  const handleSubmitReview = () => {
    if (!otherUser || !currentUser) return;
    const review: Review = {
      id: `r_${Date.now()}`,
      targetUserId: otherUser.id,
      authorId: currentUser.id,
      authorName: currentUser.name,
      rating: reviewRating,
      comment: reviewComment || "Great transaction!",
      date: new Date().toISOString().split('T')[0]
    };
    addReview(review);
    showToast("Review submitted!", "success");
    setShowReviewModal(false);
  };

  const handleConfirmPlan = async () => {
    if (!detectedPlan) return;

    let txId = activeTransaction?.id;
    if (!txId) {
        txId = await createTransaction(listing.id);
    }

    updateTransactionStatus(txId, TransactionStatus.MEETUP_AGREED, {
        meetupLocation: detectedPlan.location,
        meetupTime: detectedPlan.dateTime
    });

    setDetectedPlan(null);
    showToast("Meetup confirmed! Added to transaction details.", "success");
  };

  const handleAddToCalendar = () => {
    const loc = activeTransaction?.meetupLocation || detectedPlan?.location || '';
    const time = activeTransaction?.meetupTime || detectedPlan?.dateTime || '';
    
    const text = `Cradle Meetup: ${listing.title}`;
    const details = `Meeting with ${otherUser?.name}. Location: ${loc}`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(loc)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`flex flex-col h-[100dvh] pb-[60px] ${isHeirloom ? 'bg-[#F9F6F0]' : 'bg-gray-50'}`}>
      <div className={`border-b p-3 sticky top-0 z-10 shadow-sm ${isHeirloom ? 'bg-[#F9F6F0] border-[#E3D5CA]' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:opacity-70 rounded-full">
            <ChevronLeft className={`w-5 h-5 ${isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-600'}`} />
          </button>
          <img src={listing.images[0]} className="w-10 h-10 rounded-lg object-cover border border-gray-200" alt="Item" />
          <div className="flex-1 min-w-0">
             <h2 className={`font-bold text-sm truncate ${isHeirloom ? 'text-[#2F3E2E] font-serif tracking-wide' : 'text-gray-900'}`}>{otherUser?.name || 'User'}</h2>
             <p className={`text-xs font-medium ${isHeirloom ? 'text-[#C68E68]' : 'text-brand-600'}`}>
               {listing.title} • {listing.isSold ? <span className="text-red-500 font-bold">SOLD</span> : `$${listing.price}`}
             </p>
          </div>
          {isSeller && !listing.isSold && !activeTransaction && (
            <button onClick={handleMarkAsSold} className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${isHeirloom ? 'bg-[#C68E68]/10 text-[#C68E68]' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}>
              <CheckCircle className="w-3 h-3" /> Mark Sold
            </button>
          )}
        </div>
        
        {/* Persistent "Scheduled" Card */}
        {activeTransaction && isMeetupScheduled && (
          <div className={`p-3 rounded-xl shadow-md animate-in slide-in-from-top-2 ${isHeirloom ? 'bg-[#2F3E2E] text-white' : 'bg-gradient-to-r from-brand-600 to-brand-700 text-white'}`}>
             <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                   <CalendarCheck className="w-4 h-4 opacity-80" /> 
                   Meetup Scheduled
                </div>
                <button onClick={() => navigate(`/transaction/${activeTransaction.id}`)} className="text-[10px] underline opacity-90 hover:opacity-100">
                   View Details
                </button>
             </div>
             <div className="flex flex-col gap-1 text-xs opacity-90">
                {activeTransaction.meetupTime && <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> {activeTransaction.meetupTime}</div>}
                {activeTransaction.meetupLocation && <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {activeTransaction.meetupLocation}</div>}
             </div>
             <button onClick={handleAddToCalendar} className="mt-3 w-full bg-white/20 hover:bg-white/30 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                <CalendarPlus className="w-3 h-3" /> Add to Calendar
             </button>
          </div>
        )}

        {/* Transaction Link */}
        {activeTransaction && !isMeetupScheduled && (
          <div onClick={() => navigate(`/transaction/${activeTransaction.id}`)} className={`p-2 rounded-lg flex justify-between items-center cursor-pointer transition-colors ${isHeirloom ? 'bg-white border border-[#E3D5CA] text-[#2F3E2E]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /><span className="text-xs font-bold">Transaction Open</span></div>
            <span className="text-xs underline">View</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        
        {/* AI Proposal Banner */}
        {detectedPlan && !isMeetupScheduled && (
           <div className={`mx-auto max-w-sm border rounded-xl p-3 shadow-sm animate-in zoom-in duration-300 relative ${isHeirloom ? 'bg-white border-[#C68E68] text-[#2F3E2E]' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
              <button onClick={() => setDetectedPlan(null)} className="absolute top-2 right-2 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                 <Sparkles className="w-4 h-4" /> Proposed Plan
              </div>
              <p className="text-xs opacity-80 mb-3">
                 It sounds like you've agreed to meet. Confirm this plan?
              </p>
              <div className="bg-black/5 rounded p-2 mb-3 text-xs font-medium space-y-1">
                 <div>📍 {detectedPlan.location}</div>
                 <div>⏰ {detectedPlan.dateTime}</div>
              </div>
              <button onClick={handleConfirmPlan} className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${isHeirloom ? 'bg-[#C68E68] text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                 Confirm Meetup
              </button>
           </div>
        )}

        {showRiskWarning && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex gap-3 animate-in fade-in">
             <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
             <div className="text-xs text-red-800">
               <span className="font-bold block mb-1">Safety Warning</span>
               Transactions outside Cradle are not protected. Avoid using Venmo/CashApp or sharing phone numbers before meeting.
             </div>
          </div>
        )}

        <div className={`border rounded-lg p-3 flex gap-3 text-xs mb-6 mx-auto max-w-sm ${isHeirloom ? 'bg-white border-[#E3D5CA] text-[#5C5C5C]' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
          <Shield className={`w-5 h-5 flex-shrink-0 ${isHeirloom ? 'text-[#C68E68]' : 'text-blue-500'}`} />
          <p>Keep conversations on Cradle until you meet. Suggested meetup: <strong>Auburn SuperMall</strong>.</p>
        </div>

        {messages.length === 0 && <div className="text-center text-gray-400 text-xs py-4">Start the conversation...</div>}

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm 
                  ${isMe 
                    ? (isHeirloom ? 'bg-[#C68E68] text-white rounded-br-none' : 'bg-brand-600 text-white rounded-br-none') 
                    : (isHeirloom ? 'bg-white border border-[#E3D5CA] text-[#2F3E2E] rounded-bl-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none')
                  }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-xl font-bold text-center mb-2">Rate Experience</h3>
              <div className="flex justify-center gap-3 mb-6">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <button key={star} onClick={() => setReviewRating(star)}><Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} /></button>
                 ))}
              </div>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share details..." className="w-full p-3 bg-gray-50 rounded-xl mb-4 text-sm" rows={3} />
              <button onClick={handleSubmitReview} className="w-full py-3 bg-black text-white rounded-xl font-bold">Submit Review</button>
           </div>
        </div>
      )}

      {/* Bundle Modal */}
      {showBundleModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10 h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900">Create Bundle Offer</h3>
                 <button onClick={() => setShowBundleModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 no-scrollbar">
                 <p className="text-xs text-gray-500 mb-2">Select items to add to the <strong>{listing.title}</strong>:</p>
                 
                 {sellerOtherListings.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                       <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                       <p className="text-sm">Seller has no other items.</p>
                    </div>
                 ) : (
                    sellerOtherListings.map(item => (
                       <div 
                         key={item.id} 
                         onClick={() => handleToggleBundleItem(item.id)}
                         className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedBundleItems.includes(item.id) ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-200'}`}
                       >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedBundleItems.includes(item.id) ? 'bg-brand-500 border-brand-500' : 'border-gray-300'}`}>
                             {selectedBundleItems.includes(item.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <img src={item.images[0]} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                          <div className="flex-1">
                             <div className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</div>
                             <div className="text-xs text-gray-500">${item.price}</div>
                          </div>
                       </div>
                    ))
                 )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">Total Items:</span>
                    <span className="font-bold text-gray-900">{selectedBundleItems.length + 1}</span>
                 </div>
                 
                 <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2 mb-4 border border-gray-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <input 
                      type="number" 
                      placeholder="Your Offer Price (Optional)" 
                      value={bundleOfferPrice}
                      onChange={(e) => setBundleOfferPrice(e.target.value)}
                      className="bg-transparent w-full outline-none font-bold text-gray-900 text-lg" 
                    />
                 </div>

                 <button 
                   onClick={handleSubmitBundle}
                   disabled={selectedBundleItems.length === 0}
                   className="w-full py-3 bg-black text-white font-bold rounded-xl disabled:opacity-50 hover:bg-gray-800 transition-colors"
                 >
                   Send Offer
                 </button>
              </div>
           </div>
        </div>
      )}

      {showMeetupOptions && (
        <div className="px-4 pb-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-2">
             <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Suggest Safe Meetup</div>
             <button onClick={() => handleSuggestMeetup("Auburn Police Station (Safe Zone)")} className="w-full text-left flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg"><MapPin className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-gray-800">Auburn Police Station</span></button>
             <button onClick={() => handleSuggestMeetup("Auburn SuperMall (Outlet Collection)")} className="w-full text-left flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg"><MapPin className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-gray-800">Auburn SuperMall</span></button>
          </div>
        </div>
      )}

      {/* Smart Replies */}
      {smartReplies.length > 0 && (
         <div className="px-4 pb-2 overflow-x-auto no-scrollbar flex gap-2 animate-in slide-in-from-bottom-2">
            <div className={`flex items-center p-1.5 rounded-full ${isHeirloom ? 'bg-[#E3D5CA] text-[#B07D5B]' : 'bg-purple-50 text-purple-600'}`}><Sparkles className="w-3 h-3" /></div>
            {smartReplies.map((reply, i) => (
               <button 
                  key={i} 
                  onClick={() => handleSend(null as any, reply)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs transition-colors shadow-sm ${isHeirloom ? 'bg-white text-[#2F3E2E] border border-[#E3D5CA] hover:bg-[#F9F6F0]' : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'}`}
               >
                  {reply}
               </button>
            ))}
         </div>
      )}

      <form onSubmit={handleSend} className={`p-3 border-t flex gap-2 items-center bg-white border-gray-100 sticky bottom-0 z-20`}>
        <button type="button" onClick={() => setShowMeetupOptions(!showMeetupOptions)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showMeetupOptions ? (isHeirloom ? 'bg-[#C68E68] text-white' : 'bg-brand-100 text-brand-600') : (isHeirloom ? 'bg-white border border-[#E3D5CA] text-[#C68E68]' : 'bg-gray-100 text-gray-500')}`}><MapPin className="w-5 h-5" /></button>
        {!isSeller && (
            <button 
              type="button" 
              onClick={() => setShowBundleModal(true)} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isHeirloom ? 'bg-white border border-[#E3D5CA] text-[#C68E68]' : 'bg-gray-100 text-gray-500 hover:bg-brand-100 hover:text-brand-600'}`} 
              title="Request Bundle"
            >
              <PackagePlus className="w-5 h-5" />
            </button>
        )}
        <input 
          ref={inputRef}
          type="text" 
          value={inputText} 
          onFocus={handleInputFocus}
          onChange={(e) => setInputText(e.target.value)} 
          placeholder="Type a message..." 
          className={`flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-all ${isHeirloom ? 'bg-white border border-[#E3D5CA] text-[#2F3E2E] placeholder:text-[#B07D5B]/50 focus:ring-1 focus:ring-[#C68E68]' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400'}`} 
        />
        <button type="submit" disabled={!inputText.trim()} className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 ${isHeirloom ? 'bg-[#C68E68] text-white' : 'bg-brand-600 text-white'}`}><Send className="w-4 h-4 ml-0.5" /></button>
      </form>
    </div>
  );
};

export default Chat;
