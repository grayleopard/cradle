
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Send, Shield, MapPin, CheckCircle, Star, ShoppingBag, AlertTriangle, PackagePlus, Sparkles, CalendarCheck, Clock, CalendarPlus, X, DollarSign, Check, CheckCheck, ChevronRight, MessageCircle } from 'lucide-react';
import { Review, TransactionStatus, Listing, OfferStatus, Message } from '../types';
import { generateSmartReplies, extractMeetingDetails, MeetingDetails } from '../services/geminiService';

// Helper to group messages by date
const groupMessagesByDate = (messages: Message[]) => {
  const groups: { date: string; label: string; messages: Message[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  messages.forEach((msg) => {
    const msgDate = new Date(msg.timestamp);
    msgDate.setHours(0, 0, 0, 0);
    const dateKey = msgDate.toISOString().split('T')[0];

    let label: string;
    if (msgDate.getTime() === today.getTime()) {
      label = 'Today';
    } else if (msgDate.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const existingGroup = groups.find(g => g.date === dateKey);
    if (existingGroup) {
      existingGroup.messages.push(msg);
    } else {
      groups.push({ date: dateKey, label, messages: [msg] });
    }
  });

  return groups;
};

// Typing indicator component
const TypingIndicator = ({ name }: { name: string }) => (
  <div className="flex items-center gap-2 px-4 py-2">
    <div className="bg-[#F5EDE6] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-[#9A8578] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-[#9A8578] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-[#9A8578] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
    <span className="text-[11px] text-[#9A8578]">{name} is typing...</span>
  </div>
);

// Date divider component
const DateDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-[#E8DDD4]" />
    <span className="text-xs font-medium text-[#9A8578] px-2">{label}</span>
    <div className="flex-1 h-px bg-[#E8DDD4]" />
  </div>
);

// Quick reply chips for new conversations
const QuickReplySuggestions = ({ onSelect }: { onSelect: (text: string) => void }) => {
  const suggestions = [
    "Is this still available?",
    "What's the condition?",
    "When can you meet?"
  ];

  return (
    <div className="px-4 pb-3 flex flex-wrap gap-2">
      {suggestions.map((text, i) => (
        <button
          key={i}
          onClick={() => onSelect(text)}
          className="px-4 py-2 bg-[#F5EDE6] text-[#4A3F37] text-sm rounded-full hover:bg-[#E8DDD4] transition-colors"
        >
          {text}
        </button>
      ))}
    </div>
  );
};

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

  // Typing indicator state (simulated for now)
  const [isOtherTyping, setIsOtherTyping] = useState(false);

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

  // Group messages by date
  const messageGroups = groupMessagesByDate(messages);

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

  if (!conversation || !listing) return (
    <div className="flex flex-col h-[100dvh] bg-[#FFFCF9]">
      <div className="flex items-center gap-3 p-4 border-b border-[#E8DDD4]">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
        </button>
        <span className="font-serif text-[#4A3F37]">Messages</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-[#E8DDD4] mx-auto mb-3" />
          <p className="text-[#6B5D52]">Conversation not found</p>
        </div>
      </div>
    </div>
  );

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

  const handleQuickReply = (text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if message is read (for read receipts)
  const getMessageStatus = (msg: Message, index: number): 'sent' | 'delivered' | 'read' => {
    if (msg.senderId !== currentUser?.id) return 'sent';
    // For demo, mark last message as delivered, others as read
    if (index === messages.length - 1) return 'delivered';
    return 'read';
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#FFFCF9]">
      {/* Header */}
      <div className="border-b border-[#E8DDD4] bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3 p-3">
          <button onClick={() => navigate('/messages')} className="p-1.5 hover:bg-[#F5EDE6] rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[15px] text-[#4A3F37] truncate">{otherUser?.name || 'User'}</h2>
            <p className="text-xs text-[#9A8578]">
              {listing.isSold ? 'Item sold' : 'Active listing'}
            </p>
          </div>
          {isSeller && !listing.isSold && !activeTransaction && (
            <button onClick={handleMarkAsSold} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#2D9B8C]/10 text-[#2D9B8C] hover:bg-[#2D9B8C]/20 transition-colors flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Mark Sold
            </button>
          )}
        </div>

        {/* Listing Context Card */}
        <button
          onClick={() => navigate(`/listing/${listing.id}`)}
          className="mx-3 mb-3 p-3 bg-white border border-[#E8DDD4] rounded-xl shadow-sm flex items-center gap-3 hover:bg-[#FFFCF9] transition-colors"
        >
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-14 h-14 rounded-lg object-cover bg-[#F5EDE6]"
          />
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-semibold text-sm text-[#4A3F37] truncate">{listing.title}</h3>
            <p className="text-sm font-bold text-[#2D9B8C]">
              {listing.isSold ? <span className="text-[#E8725C]">SOLD</span> : `$${listing.price}`}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#E8DDD4]" />
        </button>

        {/* Meetup Scheduled Card */}
        {activeTransaction && isMeetupScheduled && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-[#4A3F37] text-white">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
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
            <button onClick={handleAddToCalendar} className="mt-3 w-full bg-white/20 hover:bg-white/30 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
              <CalendarPlus className="w-3 h-3" /> Add to Calendar
            </button>
          </div>
        )}

        {/* Pending Offer Quick Actions (for seller) */}
        {isSeller && pendingOffer && !activeTransaction && (
          <div className="mx-3 mb-3 p-3 rounded-xl border bg-gradient-to-r from-[#2D9B8C]/10 to-[#247A6F]/10 border-[#2D9B8C]/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#2D9B8C]" />
                <span className="text-sm font-bold text-[#4A3F37]">Offer: ${pendingOffer.amount}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#2D9B8C]/20 text-[#247A6F]">
                {listing.price > pendingOffer.amount ? `${Math.round((1 - pendingOffer.amount / listing.price) * 100)}% below` : 'At asking'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAcceptOffer} className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors">
                Accept
              </button>
              <button onClick={() => setShowCounterModal(true)} className="flex-1 py-2 rounded-lg text-xs font-bold bg-white border border-[#2D9B8C] text-[#2D9B8C] hover:bg-[#2D9B8C]/5 transition-colors">
                Counter
              </button>
              <button onClick={handleDeclineOffer} className="flex-1 py-2 rounded-lg text-xs font-bold bg-white border border-[#E8DDD4] text-[#6B5D52] hover:bg-[#F5EDE6] transition-colors">
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Transaction Link */}
        {activeTransaction && !isMeetupScheduled && (
          <button onClick={() => navigate(`/transaction/${activeTransaction.id}`)} className="mx-3 mb-3 p-2.5 rounded-xl bg-white border border-[#E8DDD4] flex justify-between items-center hover:bg-[#FFFCF9] transition-colors">
            <div className="flex items-center gap-2 text-[#4A3F37]">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-semibold">Transaction Open</span>
            </div>
            <span className="text-xs text-[#2D9B8C] font-medium">View →</span>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {/* AI Proposal Banner */}
          {detectedPlan && !isMeetupScheduled && (
            <div className="mx-auto max-w-sm border rounded-xl p-3 shadow-sm animate-in zoom-in duration-300 relative bg-white border-[#2D9B8C] text-[#4A3F37] mb-4">
              <button onClick={() => setDetectedPlan(null)} className="absolute top-2 right-2 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <Sparkles className="w-4 h-4" /> Proposed Plan
              </div>
              <p className="text-xs opacity-80 mb-3">
                It sounds like you've agreed to meet. Confirm this plan?
              </p>
              <div className="bg-[#F5EDE6] rounded-lg p-2 mb-3 text-xs font-medium space-y-1">
                <div>📍 {detectedPlan.location}</div>
                <div>⏰ {detectedPlan.dateTime}</div>
              </div>
              <button onClick={handleConfirmPlan} className="w-full py-2 rounded-lg text-xs font-bold bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors">
                Confirm Meetup
              </button>
            </div>
          )}

          {showRiskWarning && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex gap-3 animate-in fade-in mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="text-xs text-red-800">
                <span className="font-bold block mb-1">Safety Warning</span>
                Transactions outside Pipit are not protected. Avoid sharing phone numbers before meeting.
              </div>
            </div>
          )}

          {/* Empty State for New Thread */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#F5EDE6] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <h3 className="font-serif font-semibold text-[#4A3F37] mb-1">Say hi to {otherUser?.name}!</h3>
              <p className="text-sm text-[#6B5D52] mb-6">Ask about the item or suggest a meetup spot.</p>
            </div>
          )}

          {/* Messages grouped by date */}
          {messageGroups.map((group) => (
            <div key={group.date}>
              <DateDivider label={group.label} />
              {group.messages.map((msg, index) => {
                const isMe = msg.senderId === currentUser?.id;
                const status = getMessageStatus(msg, messages.indexOf(msg));

                return (
                  <div key={msg.id} className={`flex flex-col mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-3 text-[15px] leading-relaxed ${
                        isMe
                          ? 'bg-[#2D9B8C] text-white rounded-2xl rounded-br-md'
                          : 'bg-[#F5EDE6] text-[#4A3F37] rounded-2xl rounded-bl-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[11px] text-[#9A8578]">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                      {isMe && (
                        <span className={`${status === 'read' ? 'text-[#2D9B8C]' : 'text-[#9A8578]'}`}>
                          {status === 'sent' ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <CheckCheck className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing Indicator */}
          {isOtherTyping && otherUser && <TypingIndicator name={otherUser.name} />}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Quick Reply Suggestions for New Conversations */}
      {messages.length === 0 && !isSeller && (
        <QuickReplySuggestions onSelect={handleQuickReply} />
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-center mb-2 font-serif text-[#4A3F37]">Rate Experience</h3>
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)}><Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} /></button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share details..." className="w-full p-3 bg-[#F5EDE6] rounded-xl mb-4 text-sm border-0 focus:ring-2 focus:ring-[#2D9B8C]" rows={3} />
            <button onClick={handleSubmitReview} className="w-full py-3 bg-[#2D9B8C] text-white rounded-xl font-bold hover:bg-[#247A6F] transition-colors">Submit Review</button>
          </div>
        </div>
      )}

      {/* Bundle Modal */}
      {showBundleModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10 h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#4A3F37] font-serif">Create Bundle Offer</h3>
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
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedBundleItems.includes(item.id) ? 'border-[#2D9B8C] bg-[#2D9B8C]/5' : 'border-[#E8DDD4] hover:border-[#2D9B8C]/30'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedBundleItems.includes(item.id) ? 'bg-[#2D9B8C] border-[#2D9B8C]' : 'border-[#E8DDD4]'}`}>
                      {selectedBundleItems.includes(item.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <img src={item.images[0]} className="w-12 h-12 rounded-lg object-cover bg-[#E8DDD4]" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#4A3F37] line-clamp-1">{item.title}</div>
                      <div className="text-xs text-[#9A8578]">${item.price}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#F5EDE6] pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-[#6B5D52]">Total Items:</span>
                <span className="font-bold text-[#4A3F37]">{selectedBundleItems.length + 1}</span>
              </div>

              <div className="bg-[#F5EDE6] p-3 rounded-xl flex items-center gap-2 mb-4 border border-[#E8DDD4] focus-within:ring-2 focus-within:ring-[#2D9B8C] focus-within:border-[#2D9B8C]">
                <DollarSign className="w-5 h-5 text-[#B8A395]" />
                <input
                  type="number"
                  placeholder="Your Offer Price (Optional)"
                  value={bundleOfferPrice}
                  onChange={(e) => setBundleOfferPrice(e.target.value)}
                  className="bg-transparent w-full outline-none font-bold text-[#4A3F37] text-lg"
                />
              </div>

              <button
                onClick={handleSubmitBundle}
                disabled={selectedBundleItems.length === 0}
                className="w-full py-3 bg-[#2D9B8C] text-white font-bold rounded-xl disabled:opacity-50 hover:bg-[#247A6F] transition-colors"
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
          <div className="w-full max-w-sm rounded-2xl p-6 animate-in zoom-in-95 bg-[#FFFCF9]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#4A3F37] font-serif">Counter Offer</h3>
              <button onClick={() => setShowCounterModal(false)} className="p-1 hover:bg-[#E8DDD4] rounded-full"><X className="w-5 h-5 text-[#9A8578]" /></button>
            </div>
            <p className="text-sm mb-4 text-[#6B5D52]">
              Their offer: <strong className="text-[#4A3F37]">${pendingOffer.amount}</strong>
              <span className="mx-2">•</span>
              Asking: <strong className="text-[#4A3F37]">${listing.price}</strong>
            </p>
            <div className="p-3 rounded-xl flex items-center gap-2 mb-4 border bg-white border-[#E8DDD4] focus-within:ring-2 focus-within:ring-[#2D9B8C] focus-within:border-[#2D9B8C]">
              <DollarSign className="w-5 h-5 text-[#B8A395]" />
              <input
                type="number"
                placeholder="Your counter price"
                value={counterOfferAmount}
                onChange={(e) => setCounterOfferAmount(e.target.value)}
                className="bg-transparent w-full outline-none font-bold text-lg text-[#4A3F37]"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCounterModal(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-[#F5EDE6] text-[#6B5D52] hover:bg-[#E8DDD4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCounterOffer}
                disabled={!counterOfferAmount || parseFloat(counterOfferAmount) <= 0}
                className="flex-1 py-3 rounded-xl font-bold disabled:opacity-50 bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors"
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
            <button onClick={() => handleSuggestMeetup("Auburn Police Station (Safe Zone)")} className="w-full text-left flex items-center gap-2 p-2 hover:bg-[#F5EDE6] rounded-lg transition-colors">
              <MapPin className="w-4 h-4 text-[#2D9B8C]" />
              <span className="text-sm font-medium text-[#4A3F37]">Auburn Police Station</span>
            </button>
            <button onClick={() => handleSuggestMeetup("Auburn SuperMall (Outlet Collection)")} className="w-full text-left flex items-center gap-2 p-2 hover:bg-[#F5EDE6] rounded-lg transition-colors">
              <MapPin className="w-4 h-4 text-[#2D9B8C]" />
              <span className="text-sm font-medium text-[#4A3F37]">Auburn SuperMall</span>
            </button>
          </div>
        </div>
      )}

      {/* Smart Replies */}
      {smartReplies.length > 0 && (
        <div className="px-4 pb-2 overflow-x-auto no-scrollbar flex gap-2 animate-in slide-in-from-bottom-2">
          <div className="flex items-center p-1.5 rounded-full bg-[#E8DDD4] text-[#247A6F]"><Sparkles className="w-3 h-3" /></div>
          {smartReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => handleSend(null as any, reply)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs bg-white text-[#4A3F37] border border-[#E8DDD4] hover:bg-[#FFFCF9] transition-colors shadow-sm"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 pb-safe border-t border-[#E8DDD4] flex gap-2 items-center bg-white sticky bottom-0 z-20">
        <button type="button" onClick={() => setShowMeetupOptions(!showMeetupOptions)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showMeetupOptions ? 'bg-[#2D9B8C] text-white' : 'bg-white border border-[#E8DDD4] text-[#2D9B8C] hover:bg-[#F5EDE6]'}`}>
          <MapPin className="w-5 h-5" />
        </button>
        {!isSeller && (
          <button
            type="button"
            onClick={() => setShowBundleModal(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-[#E8DDD4] text-[#2D9B8C] hover:bg-[#F5EDE6] transition-colors"
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
          className="flex-1 rounded-full px-4 py-3 text-[15px] bg-[#FFFCF9] border border-[#E8DDD4] text-[#4A3F37] placeholder:text-[#B8A395] focus:outline-none focus:border-[#2D9B8C] focus:ring-2 focus:ring-[#2D9B8C]/15 transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-[#2D9B8C] text-white disabled:bg-[#E8DDD4] disabled:text-[#9A8578] hover:bg-[#247A6F] disabled:hover:bg-[#E8DDD4] transition-all hover:scale-105 disabled:hover:scale-100"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
