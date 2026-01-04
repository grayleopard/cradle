
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Send, Shield, MapPin, CheckCircle, Star, ShoppingBag, AlertTriangle, PackagePlus, Sparkles, CalendarCheck, Clock, CalendarPlus, X, Plus, DollarSign } from 'lucide-react';
import { Review, TransactionStatus, Listing, OfferStatus } from '../types';
import { generateSmartReplies, extractMeetingDetails, MeetingDetails } from '../services/geminiService';

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getConversationById, getMessagesByConversationId, getListingById, sendMessage, markMessagesAsRead, currentUser, markAsSold, addReview, getUserById, getActiveTransactionForListing, createTransaction, updateTransactionStatus, listings, getOffersForListing, respondToOffer } = useStore();
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

  // Offer Quick Actions State
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterOfferAmount, setCounterOfferAmount] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversation = getConversationById(id || '');
  const listing = conversation ? getListingById(conversation.listingId) : undefined;
  const messages = id ? getMessagesByConversationId(id) : [];
  const activeTransaction = listing ? getActiveTransactionForListing(listing.id) : undefined;

  // Get pending offer for this listing (for seller quick actions)
  const pendingOffer = listing
    ? getOffersForListing(listing.id).find(o => o.status === OfferStatus.PENDING)
    : undefined;

  const isSeller = currentUser && listing && currentUser.id === listing.userId;
  const otherParticipantId = conversation?.participantIds.find(pid => pid !== currentUser?.id);
  const otherUser = otherParticipantId ? getUserById(otherParticipantId) : null;
  
  const isPipitV2 = theme === 'pipit-v2';

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

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (id) {
      markMessagesAsRead(id);
    }
  }, [id, markMessagesAsRead]);

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

    const text = `Pipit Meetup: ${listing.title}`;
    const details = `Meeting with ${otherUser?.name}. Location: ${loc}`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(loc)}`;
    window.open(url, '_blank');
  };

  // Offer Quick Action Handlers
  const handleAcceptOffer = async () => {
    if (!pendingOffer) return;
    await respondToOffer(pendingOffer.id, 'accept');
    sendMessage(conversation.id, `✅ I've accepted your offer of $${pendingOffer.amount}! Let's arrange a meetup.`);
    showToast("Offer accepted!", "success");
  };

  const handleDeclineOffer = async () => {
    if (!pendingOffer) return;
    await respondToOffer(pendingOffer.id, 'decline');
    sendMessage(conversation.id, `Sorry, I can't accept your offer of $${pendingOffer.amount} at this time.`);
    showToast("Offer declined", "info");
  };

  const handleCounterOffer = async () => {
    if (!pendingOffer || !counterOfferAmount) return;
    const amount = parseFloat(counterOfferAmount);
    if (isNaN(amount) || amount <= 0) return;
    await respondToOffer(pendingOffer.id, 'counter', amount);
    sendMessage(conversation.id, `💰 I've sent a counter-offer of $${amount}. Let me know if that works!`);
    setShowCounterModal(false);
    setCounterOfferAmount('');
    showToast("Counter-offer sent!", "success");
  };

  return (
    <div className={`flex flex-col h-[100dvh] ${isPipitV2 ? 'bg-[#FFFCF9]' : 'bg-[#F5EDE6]'}`}>
      <div className={`border-b p-3 sticky top-0 z-10 shadow-sm ${isPipitV2 ? 'bg-[#FFFCF9] border-[#E8DDD4]' : 'bg-white border-[#F5EDE6]'}`}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:opacity-70 rounded-full">
            <ChevronLeft className={`w-5 h-5 ${isPipitV2 ? 'text-[#4A3F37]' : 'text-[#6B5D52]'}`} />
          </button>
          <img src={listing.images[0]} className="w-10 h-10 rounded-lg object-cover border border-[#E8DDD4]" alt="Item" />
          <div className="flex-1 min-w-0">
             <h2 className={`font-bold text-sm truncate ${isPipitV2 ? 'text-[#4A3F37] font-serif tracking-wide' : 'text-gray-900'}`}>{otherUser?.name || 'User'}</h2>
             <p className={`text-xs font-medium ${isPipitV2 ? 'text-[#2D9B8C]' : 'text-[#2D9B8C]'}`}>
               {listing.title} • {listing.isSold ? <span className="text-red-500 font-bold">SOLD</span> : `$${listing.price}`}
             </p>
          </div>
          {isSeller && !listing.isSold && !activeTransaction && (
            <button onClick={handleMarkAsSold} className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${isPipitV2 ? 'bg-[#2D9B8C]/10 text-[#2D9B8C]' : 'bg-[#F0FAF8] text-[#247A6F] hover:bg-[#F0FAF8]'}`}>
              <CheckCircle className="w-3 h-3" /> Mark Sold
            </button>
          )}
        </div>
        
        {/* Persistent "Scheduled" Card */}
        {activeTransaction && isMeetupScheduled && (
          <div className={`p-3 rounded-xl shadow-md animate-in slide-in-from-top-2 ${isPipitV2 ? 'bg-[#4A3F37] text-white' : 'bg-gradient-to-r from-[#2D9B8C] to-[#247A6F] text-white'}`}>
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

        {/* Pending Offer Quick Actions (for seller) */}
        {isSeller && pendingOffer && !activeTransaction && (
          <div className={`mt-2 p-3 rounded-xl border animate-in slide-in-from-top-2 ${isPipitV2 ? 'bg-gradient-to-r from-[#2D9B8C]/10 to-[#247A6F]/10 border-[#2D9B8C]/30' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${isPipitV2 ? 'text-[#2D9B8C]' : 'text-green-600'}`} />
                <span className={`text-sm font-bold ${isPipitV2 ? 'text-[#4A3F37]' : 'text-gray-900'}`}>
                  Offer: ${pendingOffer.amount}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isPipitV2 ? 'bg-[#2D9B8C]/20 text-[#247A6F]' : 'bg-green-100 text-green-700'}`}>
                {listing.price > pendingOffer.amount ? `${Math.round((1 - pendingOffer.amount / listing.price) * 100)}% below` : 'At asking'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptOffer}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${isPipitV2 ? 'bg-[#2D9B8C] text-white hover:bg-[#247A6F]' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                Accept
              </button>
              <button
                onClick={() => setShowCounterModal(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${isPipitV2 ? 'bg-white border border-[#2D9B8C] text-[#2D9B8C] hover:bg-[#2D9B8C]/5' : 'bg-white border border-green-600 text-green-600 hover:bg-green-50'}`}
              >
                Counter
              </button>
              <button
                onClick={handleDeclineOffer}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${isPipitV2 ? 'bg-white border border-[#E8DDD4] text-[#6B5D52] hover:bg-[#F5EDE6]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Transaction Link */}
        {activeTransaction && !isMeetupScheduled && (
          <div onClick={() => navigate(`/transaction/${activeTransaction.id}`)} className={`p-2 rounded-lg flex justify-between items-center cursor-pointer transition-colors ${isPipitV2 ? 'bg-white border border-[#E8DDD4] text-[#4A3F37]' : 'bg-[#E8DDD4] text-[#4A3F37] hover:bg-gray-200'}`}>
            <div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /><span className="text-xs font-bold">Transaction Open</span></div>
            <span className="text-xs underline">View</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        
        {/* AI Proposal Banner */}
        {detectedPlan && !isMeetupScheduled && (
           <div className={`mx-auto max-w-sm border rounded-xl p-3 shadow-sm animate-in zoom-in duration-300 relative ${isPipitV2 ? 'bg-white border-[#2D9B8C] text-[#4A3F37]' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
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
              <button onClick={handleConfirmPlan} className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${isPipitV2 ? 'bg-[#2D9B8C] text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                 Confirm Meetup
              </button>
           </div>
        )}

        {showRiskWarning && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex gap-3 animate-in fade-in">
             <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
             <div className="text-xs text-red-800">
               <span className="font-bold block mb-1">Safety Warning</span>
               Transactions outside Pipit are not protected. Avoid using Venmo/CashApp or sharing phone numbers before meeting.
             </div>
          </div>
        )}

        <div className={`border rounded-lg p-3 flex gap-3 text-xs mb-6 mx-auto max-w-sm ${isPipitV2 ? 'bg-white border-[#E8DDD4] text-[#6B5D52]' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
          <Shield className={`w-5 h-5 flex-shrink-0 ${isPipitV2 ? 'text-[#2D9B8C]' : 'text-blue-500'}`} />
          <p>Keep conversations on Pipit until you meet. Suggested meetup: <strong>Auburn SuperMall</strong>.</p>
        </div>

        {messages.length === 0 && <div className="text-center text-[#B8A395] text-xs py-4">Start the conversation...</div>}

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm 
                  ${isMe 
                    ? (isPipitV2 ? 'bg-[#2D9B8C] text-white rounded-br-none' : 'bg-[#2D9B8C] text-white rounded-br-none') 
                    : (isPipitV2 ? 'bg-white border border-[#E8DDD4] text-[#4A3F37] rounded-bl-none' : 'bg-white border border-[#F5EDE6] text-gray-800 rounded-bl-none')
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
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share details..." className="w-full p-3 bg-[#F5EDE6] rounded-xl mb-4 text-sm" rows={3} />
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
                 <button onClick={() => setShowBundleModal(false)} className="p-1 hover:bg-[#E8DDD4] rounded-full"><X className="w-5 h-5 text-[#9A8578]" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 no-scrollbar">
                 <p className="text-xs text-[#9A8578] mb-2">Select items to add to the <strong>{listing.title}</strong>:</p>
                 
                 {sellerOtherListings.length === 0 ? (
                    <div className="text-center py-10 text-[#B8A395]">
                       <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                       <p className="text-sm">Seller has no other items.</p>
                    </div>
                 ) : (
                    sellerOtherListings.map(item => (
                       <div 
                         key={item.id} 
                         onClick={() => handleToggleBundleItem(item.id)}
                         className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedBundleItems.includes(item.id) ? 'border-[#2D9B8C] bg-[#F0FAF8]' : 'border-[#E8DDD4] hover:border-[#2D9B8C]/30'}`}
                       >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedBundleItems.includes(item.id) ? 'bg-[#F0FAF8]0 border-[#2D9B8C]' : 'border-gray-300'}`}>
                             {selectedBundleItems.includes(item.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <img src={item.images[0]} className="w-12 h-12 rounded-lg object-cover bg-[#E8DDD4]" />
                          <div className="flex-1">
                             <div className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</div>
                             <div className="text-xs text-[#9A8578]">${item.price}</div>
                          </div>
                       </div>
                    ))
                 )}
              </div>

              <div className="border-t border-[#F5EDE6] pt-4">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-[#6B5D52]">Total Items:</span>
                    <span className="font-bold text-gray-900">{selectedBundleItems.length + 1}</span>
                 </div>
                 
                 <div className="bg-[#F5EDE6] p-3 rounded-xl flex items-center gap-2 mb-4 border border-[#E8DDD4] focus-within:ring-2 focus-within:ring-[#2D9B8C] focus-within:border-[#2D9B8C]">
                    <DollarSign className="w-5 h-5 text-[#B8A395]" />
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

      {/* Counter Offer Modal */}
      {showCounterModal && pendingOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 animate-in zoom-in-95 ${isPipitV2 ? 'bg-[#FFFCF9]' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isPipitV2 ? 'text-[#4A3F37] font-serif' : 'text-gray-900'}`}>Counter Offer</h3>
              <button onClick={() => setShowCounterModal(false)} className="p-1 hover:bg-[#E8DDD4] rounded-full"><X className="w-5 h-5 text-[#9A8578]" /></button>
            </div>
            <p className={`text-sm mb-4 ${isPipitV2 ? 'text-[#6B5D52]' : 'text-gray-600'}`}>
              Their offer: <strong className={isPipitV2 ? 'text-[#4A3F37]' : 'text-gray-900'}>${pendingOffer.amount}</strong>
              <span className="mx-2">•</span>
              Asking: <strong className={isPipitV2 ? 'text-[#4A3F37]' : 'text-gray-900'}>${listing.price}</strong>
            </p>
            <div className={`p-3 rounded-xl flex items-center gap-2 mb-4 border focus-within:ring-2 focus-within:ring-[#2D9B8C] focus-within:border-[#2D9B8C] ${isPipitV2 ? 'bg-white border-[#E8DDD4]' : 'bg-[#F5EDE6] border-[#E8DDD4]'}`}>
              <DollarSign className="w-5 h-5 text-[#B8A395]" />
              <input
                type="number"
                placeholder="Your counter price"
                value={counterOfferAmount}
                onChange={(e) => setCounterOfferAmount(e.target.value)}
                className={`bg-transparent w-full outline-none font-bold text-lg ${isPipitV2 ? 'text-[#4A3F37]' : 'text-gray-900'}`}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCounterModal(false)}
                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isPipitV2 ? 'bg-[#F5EDE6] text-[#6B5D52]' : 'bg-gray-100 text-gray-600'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCounterOffer}
                disabled={!counterOfferAmount || parseFloat(counterOfferAmount) <= 0}
                className={`flex-1 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors ${isPipitV2 ? 'bg-[#2D9B8C] text-white hover:bg-[#247A6F]' : 'bg-black text-white hover:bg-gray-800'}`}
              >
                Send Counter
              </button>
            </div>
          </div>
        </div>
      )}

      {showMeetupOptions && (
        <div className="px-4 pb-2">
          <div className="bg-white border border-[#E8DDD4] rounded-xl shadow-lg p-3 space-y-2">
             <div className="text-xs font-semibold text-[#9A8578] uppercase tracking-wide px-1">Suggest Safe Meetup</div>
             <button onClick={() => handleSuggestMeetup("Auburn Police Station (Safe Zone)")} className="w-full text-left flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg"><MapPin className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-gray-800">Auburn Police Station</span></button>
             <button onClick={() => handleSuggestMeetup("Auburn SuperMall (Outlet Collection)")} className="w-full text-left flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg"><MapPin className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-gray-800">Auburn SuperMall</span></button>
          </div>
        </div>
      )}

      {/* Smart Replies */}
      {smartReplies.length > 0 && (
         <div className="px-4 pb-2 overflow-x-auto no-scrollbar flex gap-2 animate-in slide-in-from-bottom-2">
            <div className={`flex items-center p-1.5 rounded-full ${isPipitV2 ? 'bg-[#E8DDD4] text-[#247A6F]' : 'bg-purple-50 text-purple-600'}`}><Sparkles className="w-3 h-3" /></div>
            {smartReplies.map((reply, i) => (
               <button 
                  key={i} 
                  onClick={() => handleSend(null as any, reply)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs transition-colors shadow-sm ${isPipitV2 ? 'bg-white text-[#4A3F37] border border-[#E8DDD4] hover:bg-[#FFFCF9]' : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'}`}
               >
                  {reply}
               </button>
            ))}
         </div>
      )}

      <form onSubmit={handleSend} className={`p-3 pb-safe border-t flex gap-2 items-center bg-white border-[#F5EDE6] sticky bottom-0 z-20`}>
        <button type="button" onClick={() => setShowMeetupOptions(!showMeetupOptions)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showMeetupOptions ? (isPipitV2 ? 'bg-[#2D9B8C] text-white' : 'bg-[#F0FAF8] text-[#2D9B8C]') : (isPipitV2 ? 'bg-white border border-[#E8DDD4] text-[#2D9B8C]' : 'bg-[#E8DDD4] text-[#9A8578]')}`}><MapPin className="w-5 h-5" /></button>
        {!isSeller && (
            <button 
              type="button" 
              onClick={() => setShowBundleModal(true)} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPipitV2 ? 'bg-white border border-[#E8DDD4] text-[#2D9B8C]' : 'bg-[#E8DDD4] text-[#9A8578] hover:bg-[#F0FAF8] hover:text-[#2D9B8C]'}`} 
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
          className={`flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-all ${isPipitV2 ? 'bg-white border border-[#E8DDD4] text-[#4A3F37] placeholder:text-[#247A6F]/50 focus:ring-1 focus:ring-[#2D9B8C]' : 'bg-[#F5EDE6] border border-[#E8DDD4] text-gray-900 placeholder:text-[#B8A395]'}`} 
        />
        <button type="submit" disabled={!inputText.trim()} className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 ${isPipitV2 ? 'bg-[#2D9B8C] text-white' : 'bg-[#2D9B8C] text-white'}`}><Send className="w-4 h-4 ml-0.5" /></button>
      </form>
    </div>
  );
};

export default Chat;
