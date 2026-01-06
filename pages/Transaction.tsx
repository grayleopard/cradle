
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { TransactionStatus, Review, ExchangeType, SafeMeetupLocation } from '../types';
import { ChevronLeft, Lock, ShieldCheck, CheckCircle, MapPin, Clock, CreditCard, Camera, AlertTriangle, UserCheck, Sparkles, ExternalLink, X, RotateCcw, Loader2, FileText, Star, Download, XCircle, UserPlus, Users, Baby, Banknote, CalendarClock } from 'lucide-react';
import SafetyBadge from '../components/SafetyBadge';
import StripePaymentForm from '../components/StripePaymentForm';
import StripeOnboarding from '../components/StripeOnboarding';
import SchedulePicker from '../components/SchedulePicker';
import { generateInspectionChecklist } from '../services/geminiService';
import { capturePayment, cancelPayment, transferToSeller } from '../services/stripeService';
import { processImage } from '../utils/fileHelpers';
import { uploadToCloudinary } from '../services/cloudinaryService';

const Transaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTransactionById, getListingById, getUserById, currentUser, updateTransactionStatus, addReview, followUser } = useStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Inspection State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [customChecklistItems, setCustomChecklistItems] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);

  // Review State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewPhotoPreview, setReviewPhotoPreview] = useState<string | null>(null);
  const [reviewPhotoBlob, setReviewPhotoBlob] = useState<Blob | null>(null);
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState(false);
  const reviewPhotoInputRef = useRef<HTMLInputElement>(null);

  // Follow Connection State
  const [hasFollowed, setHasFollowed] = useState(false);

  // Animation State
  const [showConfetti, setShowConfetti] = useState(false);

  // Seller Payout State
  const [transferring, setTransferring] = useState(false);
  const [payoutComplete, setPayoutComplete] = useState(false);

  // Smart Scheduling State
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const transaction = getTransactionById(id || '');
  if (!transaction) return <div className="p-4">Transaction not found</div>;

  const listing = getListingById(transaction.listingId);
  if (!listing) return <div className="p-4">Listing not found</div>;

  const isBuyer = currentUser?.id === transaction.buyerId;
  const otherUser = getUserById(isBuyer ? transaction.sellerId : transaction.buyerId);
  const seller = getUserById(transaction.sellerId);
  const sellerStripeAccountId = seller?.stripeAccountId;

  // Check if already following the other user
  const isAlreadyFollowing = currentUser?.followingIds?.includes(otherUser?.id || '') || false;

  // Check if users share similar parenting profiles
  const hasKidAgeMatch = currentUser?.kidAges && otherUser?.kidAges &&
    currentUser.kidAges.some(age =>
      otherUser.kidAges?.some(otherAge => Math.abs(age - otherAge) <= 2)
    );
  const shareNeighborhood = currentUser?.neighborhood && otherUser?.neighborhood &&
    currentUser.neighborhood.toLowerCase() === otherUser.neighborhood.toLowerCase();

  // Trigger confetti when completed
  useEffect(() => {
    if (transaction.status === TransactionStatus.COMPLETED) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [transaction.status]);

  // Auto-release funds after 24 hours if no dispute
  useEffect(() => {
    const checkAutoRelease = async () => {
      // Only auto-release if in INSPECTION_PENDING status
      if (transaction.status !== TransactionStatus.INSPECTION_PENDING) return;

      // Calculate time since inspection started (use meetup time or payment captured time)
      const inspectionStartTime = transaction.meetupTime
        ? new Date(transaction.meetupTime).getTime()
        : transaction.paidAt
          ? new Date(transaction.paidAt).getTime()
          : null;

      if (!inspectionStartTime) return;

      const hoursSinceStart = (Date.now() - inspectionStartTime) / (1000 * 60 * 60);

      // Auto-complete after 24 hours
      if (hoursSinceStart >= 24) {
        console.log('[Auto-Release] 24 hours passed, auto-completing transaction');
        showToast('Transaction auto-completed after 24 hours', 'success');
        updateTransactionStatus(transaction.id, TransactionStatus.COMPLETED, {
          completedAt: new Date().toISOString(),
          autoReleased: true
        });
      }
    };

    checkAutoRelease();
  }, [transaction.id, transaction.status, transaction.meetupTime]);

  // Fetch smart checklist when entering inspection mode
  useEffect(() => {
    if (transaction.status === TransactionStatus.INSPECTION_PENDING && isBuyer && customChecklistItems.length === 0) {
      const fetchChecklist = async () => {
        setChecklistLoading(true);
        try {
          const items = await generateInspectionChecklist(listing.title, listing.category);
          setCustomChecklistItems(items);
          setCheckedItems(new Array(items.length).fill(false));
        } catch (e) {
          // Fallback handled in service, but just in case
          setCustomChecklistItems(["Item matches description", "Condition acceptable", "No damage"]);
          setCheckedItems([false, false, false]);
        } finally {
          setChecklistLoading(false);
        }
      };
      fetchChecklist();
    }
  }, [transaction.status, isBuyer, listing]);

  // --- Actions ---

  const handleAcceptRequest = () => {
    updateTransactionStatus(transaction.id, TransactionStatus.ACCEPTED);
    showToast("Request accepted! Waiting for buyer payment.");
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setShowPaymentModal(false);
    updateTransactionStatus(transaction.id, TransactionStatus.PAYMENT_HELD, {
      stripePaymentIntentId: paymentIntentId
    });
    showToast("Payment secured in escrow!");
  };

  const handleConfirmMeetup = () => {
    // Show smart scheduling picker instead of hardcoded meetup
    setShowSchedulePicker(true);
  };

  const handleScheduleConfirmed = (schedule: {
    exchangeType: ExchangeType;
    date?: string;
    timeSlot?: string;
    location?: SafeMeetupLocation;
    porchAddress?: string;
  }) => {
    setShowSchedulePicker(false);

    if (schedule.exchangeType === ExchangeType.PORCH_PICKUP) {
      updateTransactionStatus(transaction.id, TransactionStatus.SCHEDULED, {
        exchangeType: ExchangeType.PORCH_PICKUP,
        meetupLocation: schedule.porchAddress || 'Seller porch',
        meetupTime: 'Porch pickup - pick up within 24h'
      });
      showToast("Porch pickup scheduled! 🏠");
    } else if (schedule.exchangeType === ExchangeType.IN_PERSON && schedule.location) {
      updateTransactionStatus(transaction.id, TransactionStatus.SCHEDULED, {
        exchangeType: ExchangeType.IN_PERSON,
        scheduledDate: schedule.date,
        scheduledTimeSlot: schedule.timeSlot,
        scheduledLocationId: schedule.location.id,
        scheduledLocationName: schedule.location.name,
        scheduledLocationAddress: `${schedule.location.address}, ${schedule.location.city}`,
        meetupLocation: schedule.location.name,
        meetupTime: schedule.timeSlot
      });
      showToast("Meetup scheduled! 📅");
    }
  };

  const handleArrived = () => {
    updateTransactionStatus(transaction.id, TransactionStatus.INSPECTION_PENDING);
    showToast("Smart Inspection Checklist unlocked.");
  };

  const handleCheckItem = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const processed = await processImage(e.target.files[0]);
        setPhotoPreview(processed.previewUrl);
        setPhotoBlob(processed.blob);
        showToast("Photo captured. Ready for upload.");
      } catch (err) {
        showToast("Failed to capture photo", "error");
      }
    }
  };

  const handleCompleteInspection = async () => {
    if (!photoPreview || !photoBlob) {
      showToast("Please take a verification photo first.", "error");
      return;
    }
    if (!checkedItems.every(Boolean)) {
      if(!window.confirm("You haven't completed all safety checks. Proceed anyway?")) return;
    }

    setLoading(true);
    setUploadingPhoto(true);

    try {
      // 1. Upload photo to Cloudinary
      const remotePhotoUrl = await uploadToCloudinary(photoBlob);

      // 2. Capture the Stripe payment (release funds to seller)
      if (transaction.stripePaymentIntentId) {
        await capturePayment(transaction.stripePaymentIntentId);
      }

      // 3. Update Transaction
      updateTransactionStatus(transaction.id, TransactionStatus.COMPLETED, {
        inspectionChecklist: {
          matchesDescription: true,
          conditionAcceptable: true,
          noUndisclosedDamage: true
        },
        inspectionPhotoUrl: remotePhotoUrl
      });
      showToast("Transaction Complete! Funds released to seller.");
    } catch (e) {
      console.error(e);
      showToast("Failed to complete transaction. Try again.", "error");
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const handleRejectTransaction = async () => {
    if (!rejectReason) return;

    setLoading(true);
    try {
      // Cancel the Stripe payment (refund buyer)
      if (transaction.stripePaymentIntentId) {
        await cancelPayment(transaction.stripePaymentIntentId);
      }

      updateTransactionStatus(transaction.id, TransactionStatus.CANCELLED);
      setShowRejectModal(false);
      showToast("Transaction cancelled. Payment will be refunded.");
    } catch (e) {
      console.error(e);
      showToast("Failed to cancel transaction. Please contact support.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const processed = await processImage(e.target.files[0]);
        setReviewPhotoPreview(processed.previewUrl);
        setReviewPhotoBlob(processed.blob);
      } catch (err) {
        showToast("Failed to process photo", "error");
      }
    }
  };

  const handleSubmitReview = async () => {
    if(!currentUser || !otherUser) return;

    setUploadingReviewPhoto(true);

    try {
      // Upload review photo if provided
      let photoUrl: string | undefined;
      if (reviewPhotoBlob) {
        photoUrl = await uploadToCloudinary(reviewPhotoBlob);
      }

      const newReview: Review = {
        id: `rev_${Date.now()}`,
        targetUserId: otherUser.id,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
        photoUrl,
        transactionId: transaction.id,
        itemTitle: listing.title
      };

      addReview(newReview);
      setReviewSubmitted(true);
      showToast("Review submitted successfully!", "success");
    } catch (error) {
      console.error('Failed to submit review:', error);
      showToast("Failed to submit review", "error");
    } finally {
      setUploadingReviewPhoto(false);
    }
  };

  const handleFollowUser = () => {
    if (!otherUser) return;
    followUser(otherUser.id);
    setHasFollowed(true);
    showToast(`You're now following ${otherUser.name}!`, "success");
  };

  // Handle payout to seller after they complete Stripe onboarding
  const handleSellerPayout = async () => {
    if (!currentUser?.stripeAccountId || !transaction.stripePaymentIntentId) return;

    setTransferring(true);
    try {
      await transferToSeller(
        currentUser.stripeAccountId,
        transaction.stripePaymentIntentId,
        transaction.id
      );
      setPayoutComplete(true);
      showToast('🎉 Money is on its way!', 'success');
    } catch (error: any) {
      console.error('Transfer failed:', error);
      showToast(error.message || 'Failed to transfer funds', 'error');
    } finally {
      setTransferring(false);
    }
  };

  // Calculate seller payout breakdown
  // Seller pays: Stripe processing (~2.9% + $0.30) from their payout
  // Note: The total charged was itemPrice * 1.055, so Stripe fee is based on that
  const itemPrice = transaction.amount; // The listing price
  const buyerTotal = itemPrice * 1.055; // What buyer paid (item + 5.5% platform fee)
  const stripeProcessingFee = (buyerTotal * 0.029) + 0.30;
  const instantPayoutFee = itemPrice * 0.01; // 1% for instant payouts
  const sellerPayoutStandard = itemPrice - stripeProcessingFee;
  const sellerPayoutInstant = sellerPayoutStandard - instantPayoutFee;
  const sellerEarnings = sellerPayoutStandard; // Default to standard

  // Check if seller needs to be paid (completed transaction, seller not onboarded or not yet paid)
  const sellerNeedsPayout = !isBuyer &&
    transaction.status === TransactionStatus.COMPLETED &&
    transaction.stripePaymentIntentId &&
    !payoutComplete;

  // --- Render Helpers ---

  const renderStatusBadge = () => {
    switch (transaction.status) {
      case TransactionStatus.INITIATED: return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">Pending Approval</span>;
      case TransactionStatus.ACCEPTED: return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">Awaiting Payment</span>;
      case TransactionStatus.PAYMENT_HELD: return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Funds Secured</span>;
      case TransactionStatus.INSPECTION_PENDING: return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">Inspection In Progress</span>;
      case TransactionStatus.COMPLETED: return <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold">Completed</span>;
      case TransactionStatus.CANCELLED: return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">Cancelled</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE6] flex flex-col relative overflow-hidden">
      {/* CSS Confetti Overlay */}
      {showConfetti && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
           {[...Array(50)].map((_, i) => (
             <div 
                key={i} 
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                   left: `${Math.random() * 100}%`,
                   top: `-10px`,
                   backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'][Math.floor(Math.random() * 4)],
                   animationDelay: `${Math.random() * 2}s`,
                   animationDuration: `${2 + Math.random() * 3}s`
                }}
             />
           ))}
           <style>{`
             @keyframes confetti {
               0% { transform: translateY(0) rotate(0deg); opacity: 1; }
               100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
             }
             .animate-confetti {
               animation-name: confetti;
               animation-timing-function: linear;
               animation-fill-mode: forwards;
             }
           `}</style>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 border-b border-[#E8DDD4] flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F5EDE6] rounded-full">
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-[#4A3F37] text-sm">Transaction #{transaction.id.slice(-6)}</h1>
          <p className="text-xs text-[#9A8578]">with {otherUser?.name}</p>
        </div>
        {renderStatusBadge()}
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
        
        {/* Cancelled Banner */}
        {transaction.status === TransactionStatus.CANCELLED && (
           <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                 <h3 className="font-bold text-red-900 text-sm">Transaction Cancelled</h3>
                 <p className="text-xs text-red-700 mt-1">This transaction was cancelled. Any held funds will be refunded to the buyer's original payment method within 3-5 business days.</p>
              </div>
           </div>
        )}

        {/* Item Card */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#F5EDE6] flex gap-4">
          <img src={listing.images[0]} className="w-20 h-20 rounded-lg object-cover bg-[#E8DDD4]" />
          <div className="flex-1">
             <h3 className="font-bold text-[#4A3F37] line-clamp-1">{listing.title}</h3>
             <p className="text-sm text-[#9A8578] mb-2">${listing.price}</p>
             <SafetyBadge isVerified={listing.isSafetyVerified} size="sm" />
          </div>
        </div>

        {/* Steps Timeline */}
        <div className={`space-y-6 relative pl-4 border-l-2 border-[#E8DDD4] ml-4 my-6 ${transaction.status === TransactionStatus.CANCELLED ? 'opacity-50 grayscale' : ''}`}>
          
          {/* Step 1: Request */}
          <div className="relative">
            <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 ${transaction.status !== TransactionStatus.CANCELLED ? 'bg-green-500 border-green-500' : 'bg-gray-400 border-gray-400'}`}></div>
            <h4 className="font-bold text-sm text-[#4A3F37]">Request Initiated</h4>
            <p className="text-xs text-[#9A8578]">Buyer requested to purchase.</p>
            {transaction.status === TransactionStatus.INITIATED && !isBuyer && (
              <div className="mt-3 flex gap-2">
                <button onClick={handleAcceptRequest} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold">Accept Request</button>
                <button className="flex-1 bg-[#E8DDD4] text-[#4A3F37] py-2 rounded-lg text-sm font-bold">Decline</button>
              </div>
            )}
            {transaction.status === TransactionStatus.INITIATED && isBuyer && (
               <div className="mt-2 bg-yellow-50 p-2 rounded text-xs text-yellow-800">Waiting for seller to accept...</div>
            )}
          </div>

          {/* Step 2: Payment */}
          <div className={`relative ${[TransactionStatus.INITIATED].includes(transaction.status) ? 'opacity-40' : ''}`}>
             <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 ${[TransactionStatus.ACCEPTED, TransactionStatus.INITIATED].includes(transaction.status) ? 'bg-white border-gray-300' : 'bg-green-500 border-green-500'}`}></div>
             <h4 className="font-bold text-sm text-[#4A3F37]">Secure Payment</h4>
             {transaction.status === TransactionStatus.ACCEPTED && isBuyer && (
               <div className="mt-3 bg-white border border-[#E8DDD4] p-4 rounded-xl shadow-sm">
                 <div className="flex justify-between mb-2 text-sm">
                   <span className="text-[#6B5D52]">Item Price</span>
                   <span>${transaction.amount}</span>
                 </div>
                 <div className="flex justify-between mb-2 text-sm">
                   <span className="text-[#6B5D52]">Platform Fee (8%)</span>
                   <span>${transaction.platformFee}</span>
                 </div>
                 <div className="border-t pt-2 mt-2 flex justify-between font-bold text-[#4A3F37]">
                   <span>Total</span>
                   <span>${transaction.total}</span>
                 </div>
                 <div className="bg-green-50 p-2 rounded mt-3 flex items-start gap-2 text-xs text-green-800 mb-3">
                   <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                   Funds are held in escrow until you inspect the item in person.
                 </div>
                 <button onClick={() => setShowPaymentModal(true)} disabled={loading} className="w-full bg-[#2D9B8C] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                   {loading ? "Processing..." : <><CreditCard className="w-4 h-4" /> Pay Securely</>}
                 </button>
               </div>
             )}
          </div>

          {/* Step 3: Meetup */}
          <div className={`relative ${[TransactionStatus.INITIATED, TransactionStatus.ACCEPTED].includes(transaction.status) ? 'opacity-40' : ''}`}>
             <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 ${[TransactionStatus.INITIATED, TransactionStatus.ACCEPTED, TransactionStatus.PAYMENT_HELD].includes(transaction.status) ? 'bg-white border-gray-300' : 'bg-green-500 border-green-500'}`}></div>
             <h4 className="font-bold text-sm text-[#4A3F37]">Schedule Exchange</h4>

             {transaction.status === TransactionStatus.PAYMENT_HELD && (
               <div className="mt-3">
                 <p className="text-xs text-[#9A8578] mb-3">Choose when and where to meet</p>
                 <button
                   onClick={handleConfirmMeetup}
                   className="bg-[#2D9B8C] text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 w-full justify-center hover:bg-[#247A6F] transition-colors"
                 >
                   <CalendarClock className="w-4 h-4" /> Schedule Exchange 📅
                 </button>
               </div>
             )}

             {/* Smart Scheduled Meetup */}
             {(transaction.status === TransactionStatus.SCHEDULED || transaction.status === TransactionStatus.MEETUP_AGREED) && (
                <div className="mt-3 bg-gradient-to-br from-[#E8F5F3] to-[#D4EDE9] p-4 rounded-xl border border-[#2D9B8C]/20">
                   <div className="flex items-center gap-2 text-sm font-medium text-[#247A6F] mb-2">
                     {transaction.exchangeType === ExchangeType.PORCH_PICKUP ? (
                       <span className="text-lg">🏠</span>
                     ) : (
                       <MapPin className="w-4 h-4" />
                     )}
                     {transaction.scheduledLocationName || transaction.meetupLocation}
                   </div>
                   <div className="text-xs text-[#4A3F37] mb-3">
                     {transaction.scheduledTimeSlot || transaction.meetupTime}
                   </div>
                   {transaction.scheduledLocationAddress && (
                     <div className="text-xs text-[#6B5D52] mb-3">
                       📍 {transaction.scheduledLocationAddress}
                     </div>
                   )}
                   <div className="bg-white p-2 rounded-lg mb-3 text-xs text-[#6B5D52] border border-[#2D9B8C]/10 flex gap-2 items-start">
                      <Sparkles className="w-3 h-3 text-[#2D9B8C] flex-shrink-0 mt-0.5" />
                      {transaction.exchangeType === ExchangeType.PORCH_PICKUP
                        ? "Pick up from the porch and take a photo to confirm receipt."
                        : "We'll generate a custom safety checklist for this item when you arrive."}
                   </div>
                   <button
                     onClick={handleArrived}
                     className="w-full bg-[#2D9B8C] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#247A6F] transition-colors"
                   >
                     {transaction.exchangeType === ExchangeType.PORCH_PICKUP ? "I've Picked Up the Item" : "I Have Arrived"}
                   </button>
                </div>
             )}

             {/* INSPECTION UI */}
             {transaction.status === TransactionStatus.INSPECTION_PENDING && (
                <div className="mt-4 bg-white border-2 border-[#2D9B8C] rounded-xl p-4 shadow-lg animate-in zoom-in-95">
                   <div className="flex items-center gap-2 mb-4 text-[#247A6F] font-bold border-b border-[#E8DDD4] pb-2">
                     <ShieldCheck className="w-5 h-5" /> Smart Inspection
                   </div>
                   
                   {!isBuyer ? (
                      <div className="text-sm text-[#9A8578] text-center py-4">
                        Waiting for buyer to inspect item...
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <div className="bg-[#F0FAF8] rounded-lg p-3 text-xs text-[#247A6F] border border-[#E8DDD4]">
                            <strong>AI Generated Checklist:</strong> We've created specific checks for this <em>{listing.category}</em>.
                         </div>

                         {checklistLoading ? (
                            <div className="py-6 text-center text-[#9A8578] flex flex-col items-center">
                               <Sparkles className="w-6 h-6 animate-pulse text-[#2D9B8C] mb-2" />
                               <span className="text-xs">Generating safety checks...</span>
                            </div>
                         ) : (
                            <div className="space-y-3">
                               {customChecklistItems.map((item, idx) => (
                                 <label key={idx} className="flex items-start gap-3 cursor-pointer bg-[#F5EDE6] p-2 rounded hover:bg-[#E8DDD4] transition-colors">
                                   <input 
                                     type="checkbox" 
                                     checked={!!checkedItems[idx]} 
                                     onChange={() => handleCheckItem(idx)} 
                                     className="mt-1 w-5 h-5 text-[#2D9B8C] rounded" 
                                   />
                                   <span className="text-sm text-[#4A3F37]">{item}</span>
                                 </label>
                               ))}
                            </div>
                         )}

                         <div 
                           onClick={() => !photoPreview && fileInputRef.current?.click()}
                           className={`h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${photoPreview ? 'border-[#2D9B8C]' : 'border-gray-300 text-[#B8A395] hover:bg-[#F5EDE6]'}`}
                         >
                            {photoPreview ? (
                                <>
                                  <img src={photoPreview} className="w-full h-full object-cover" />
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setPhotoPreview(null); setPhotoBlob(null); }}
                                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-500"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-[#2D9B8C]/90 text-white text-[10px] text-center py-1">
                                    Verification Photo Attached
                                  </div>
                                </>
                            ) : (
                                <>
                                  <Camera className="w-8 h-8 mb-2" />
                                  <span className="text-xs font-bold">Take Verification Photo</span>
                                  <span className="text-[10px] mt-1">Tap to open camera</span>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handlePhotoCapture} 
                                accept="image/*" 
                                capture="environment"
                                className="hidden" 
                            />
                         </div>

                         <div className="flex gap-2 pt-2">
                            <button 
                              onClick={handleCompleteInspection}
                              disabled={checklistLoading || loading}
                              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept Item"}
                            </button>
                            <button 
                              onClick={() => setShowRejectModal(true)}
                              className="px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             )}
          </div>

          {/* Step 4: Complete (Digital Receipt) */}
          <div className={`relative ${transaction.status !== TransactionStatus.COMPLETED ? 'opacity-40' : ''}`}>
             <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 ${transaction.status === TransactionStatus.COMPLETED ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}></div>
             <h4 className="font-bold text-sm text-[#4A3F37]">Transaction Complete</h4>
             
             {transaction.status === TransactionStatus.COMPLETED && (
                <div className="mt-4 animate-in slide-in-from-bottom-4 duration-500">

                   {/* Seller Get Paid Section */}
                   {sellerNeedsPayout && (
                     <div className="mb-6">
                       {!currentUser?.stripeOnboarded ? (
                         <StripeOnboarding
                           pendingEarnings={sellerPayoutStandard}
                           transactionId={transaction.id}
                           onComplete={handleSellerPayout}
                         />
                       ) : (
                         <div className="bg-[#F0FAF8] border border-[#2D9B8C]/20 rounded-2xl p-5">
                           <h3 className="font-serif text-lg font-bold text-[#4A3F37] mb-4">
                             🎉 Your item sold!
                           </h3>

                           {/* Payout Breakdown */}
                           <div className="bg-white rounded-xl p-4 mb-4 border border-[#E8DDD4]">
                             <div className="space-y-2 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-[#6B5D52]">Item sold for</span>
                                 <span className="font-medium text-[#4A3F37]">${itemPrice.toFixed(2)}</span>
                               </div>
                               <div className="flex justify-between text-[#9A8578]">
                                 <span>Payment processing</span>
                                 <span>-${stripeProcessingFee.toFixed(2)}</span>
                               </div>
                               <div className="border-t border-dashed border-[#E8DDD4] pt-2 mt-2">
                                 <div className="flex justify-between font-bold text-[#4A3F37]">
                                   <span>You receive (standard)</span>
                                   <span className="text-[#2D9B8C]">${sellerPayoutStandard.toFixed(2)}</span>
                                 </div>
                               </div>
                               <div className="flex justify-between text-xs text-[#B8A395]">
                                 <span>Or with instant payout (-1%)</span>
                                 <span>${sellerPayoutInstant.toFixed(2)}</span>
                               </div>
                             </div>
                           </div>

                           <p className="text-xs text-[#6B5D52] mb-4">
                             Standard payout arrives in 2-3 business days. Instant payout (1% fee) arrives in minutes.
                           </p>

                           <button
                             onClick={handleSellerPayout}
                             disabled={transferring}
                             className="w-full bg-[#2D9B8C] text-white px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#247A6F] transition-colors disabled:opacity-50 shadow-warm-md"
                           >
                             {transferring ? (
                               <Loader2 className="w-5 h-5 animate-spin" />
                             ) : (
                               <Banknote className="w-5 h-5" />
                             )}
                             {transferring ? 'Transferring...' : 'Get Paid Now'}
                           </button>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Payout Complete */}
                   {!isBuyer && payoutComplete && (
                     <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                       <CheckCircle className="w-6 h-6 text-green-600" />
                       <div>
                         <h3 className="font-bold text-green-900 text-sm">Money Transferred!</h3>
                         <p className="text-xs text-green-700">
                           ${sellerEarnings.toFixed(2)} has been sent to your account.
                         </p>
                       </div>
                     </div>
                   )}

                   {/* Receipt Card */}
                   <div className="bg-white border border-[#E8DDD4] rounded-xl p-0 overflow-hidden shadow-sm mb-6">
                      <div className="bg-[#F5EDE6] p-4 border-b border-[#F5EDE6] flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle className="w-4 h-4 text-green-600" /></div>
                            <span className="font-bold text-gray-800 text-sm">Receipt</span>
                         </div>
                         <span className="text-[10px] text-[#B8A395] font-mono">#{transaction.id.slice(-8)}</span>
                      </div>
                      <div className="p-4 space-y-3">
                         <div className="flex justify-between text-sm">
                            <span className="text-[#9A8578]">Item</span>
                            <span className="font-medium text-[#4A3F37]">{listing.title}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-[#9A8578]">Date</span>
                            <span className="font-medium text-[#4A3F37]">{new Date().toLocaleDateString()}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-[#9A8578]">Payment Method</span>
                            <span className="font-medium text-[#4A3F37]">Visa ending 4242</span>
                         </div>
                         <div className="border-t border-dashed border-[#E8DDD4] my-2 pt-2">
                            <div className="flex justify-between text-sm font-bold">
                               <span>Total Paid</span>
                               <span>${transaction.total}</span>
                            </div>
                         </div>
                      </div>
                      <div className="bg-[#F5EDE6] p-3 text-center border-t border-[#F5EDE6]">
                         <button className="text-xs font-bold text-[#9A8578] flex items-center justify-center gap-1 hover:text-gray-800">
                            <Download className="w-3 h-3" /> Download PDF
                         </button>
                      </div>
                   </div>

                   {/* Review Section - Both buyer and seller can review */}
                   {!reviewSubmitted ? (
                      <div className="bg-white border border-yellow-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                         <div className="relative z-10">
                            <h3 className="font-bold text-[#4A3F37] text-sm mb-1">Rate your experience</h3>
                            <p className="text-xs text-[#9A8578] mb-3">
                              {isBuyer
                                ? `How was your experience with ${otherUser?.name}?`
                                : `How was ${otherUser?.name} as a buyer?`}
                            </p>

                            <div className="flex justify-center gap-2 mb-3">
                               {[1, 2, 3, 4, 5].map((star) => (
                                  <button key={star} onClick={() => setRating(star)} className="focus:outline-none transform hover:scale-110 transition-transform">
                                     <Star className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                  </button>
                               ))}
                            </div>

                            {rating > 0 && (
                               <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3">
                                  <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={isBuyer ? "How was the item and meetup experience?" : "How was the buyer to work with?"}
                                    className="w-full p-3 bg-[#F5EDE6] border border-[#E8DDD4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    rows={2}
                                  />

                                  {/* Photo Review Section */}
                                  <div className="border border-dashed border-[#E8DDD4] rounded-lg p-3">
                                    {reviewPhotoPreview ? (
                                      <div className="relative">
                                        <img
                                          src={reviewPhotoPreview}
                                          alt="Review photo"
                                          className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                          onClick={() => { setReviewPhotoPreview(null); setReviewPhotoBlob(null); }}
                                          className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-500"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => reviewPhotoInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-[#6B5D52] hover:text-[#4A3F37] transition-colors"
                                      >
                                        <Camera className="w-4 h-4" />
                                        <span className="text-sm">Add a photo (optional)</span>
                                      </button>
                                    )}
                                    <input
                                      type="file"
                                      ref={reviewPhotoInputRef}
                                      onChange={handleReviewPhotoCapture}
                                      accept="image/*"
                                      className="hidden"
                                    />
                                  </div>

                                  <button
                                    onClick={handleSubmitReview}
                                    disabled={uploadingReviewPhoto}
                                    className="w-full py-2 bg-black text-white rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                    {uploadingReviewPhoto ? (
                                      <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                    ) : (
                                      'Submit Review'
                                    )}
                                  </button>
                               </div>
                            )}
                         </div>
                      </div>
                   ) : (
                      <div className="text-center p-4 bg-green-50 rounded-xl text-green-800 text-sm font-medium">
                         <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                         Thanks for your review!
                      </div>
                   )}

                   {/* Post-Transaction Follow Prompt */}
                   {!isAlreadyFollowing && !hasFollowed && otherUser && (
                     <div className="mt-6 bg-gradient-to-br from-[#F5EDE6] to-[#E8DDD4]/50 border border-[#E8DDD4] rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4">
                       <div className="flex items-start gap-4">
                         <div className="relative flex-shrink-0">
                           <img
                             src={otherUser.avatarUrl}
                             alt={otherUser.name}
                             className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                           />
                           {otherUser.isVerifiedParent && (
                             <div className="absolute -bottom-1 -right-1 bg-[#2D9B8C] p-1 rounded-full border-2 border-white">
                               <UserCheck className="w-2.5 h-2.5 text-white" />
                             </div>
                           )}
                         </div>
                         <div className="flex-1">
                           <h4 className="font-bold text-[#4A3F37] text-sm mb-1">Stay connected with {otherUser.name}?</h4>
                           <p className="text-xs text-[#6B5D52] mb-3">
                             {shareNeighborhood && hasKidAgeMatch ? (
                               <>You both live in <strong>{otherUser.neighborhood}</strong> and have kids of similar ages!</>
                             ) : shareNeighborhood ? (
                               <>You're both in <strong>{otherUser.neighborhood}</strong>!</>
                             ) : hasKidAgeMatch ? (
                               <>You have kids of similar ages!</>
                             ) : (
                               <>Follow to see their future listings in your feed.</>
                             )}
                           </p>

                           {/* Kid ages display if they have them */}
                           {otherUser.kidAges && otherUser.kidAges.length > 0 && (
                             <div className="flex items-center gap-2 text-xs text-[#247A6F] mb-3">
                               <Baby className="w-3.5 h-3.5" />
                               <span>
                                 Kids: {otherUser.kidAges.map(age => age === 0 ? '<1' : `${age}`).join(', ')} years
                               </span>
                             </div>
                           )}

                           <button
                             onClick={handleFollowUser}
                             className="w-full sm:w-auto px-6 py-2.5 bg-[#4A3F37] text-white rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#1F2E1F] transition-colors"
                           >
                             <UserPlus className="w-4 h-4" /> Follow {otherUser.name.split(' ')[0]}
                           </button>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Already Following or Just Followed */}
                   {(isAlreadyFollowing || hasFollowed) && otherUser && (
                     <div className="mt-6 bg-[#F5EDE6] border border-[#E8DDD4] rounded-xl p-4 text-center">
                       <div className="flex items-center justify-center gap-2 text-[#4A3F37]">
                         <Users className="w-5 h-5 text-[#2D9B8C]" />
                         <span className="font-medium text-sm">
                           {hasFollowed ? `You're now following ${otherUser.name}!` : `You're already following ${otherUser.name}`}
                         </span>
                       </div>
                     </div>
                   )}

                   <button onClick={() => navigate('/')} className="w-full mt-4 py-3 text-[#9A8578] text-sm font-medium hover:text-gray-800">
                      Return Home
                   </button>
                </div>
             )}
          </div>

        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-[#4A3F37]">Secure Payment</h3>
                 <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-[#E8DDD4] rounded-full"><X className="w-5 h-5 text-[#9A8578]" /></button>
              </div>

              <StripePaymentForm
                amount={transaction.amount}
                platformFee={transaction.platformFee}
                total={transaction.total}
                sellerAccountId={sellerStripeAccountId}
                transactionId={transaction.id}
                listingTitle={listing.title}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentModal(false)}
              />
           </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> Decline Item
                 </h3>
                 <button onClick={() => setShowRejectModal(false)} className="p-1 hover:bg-[#E8DDD4] rounded-full"><X className="w-5 h-5 text-[#9A8578]" /></button>
              </div>

              <div className="space-y-4">
                 <p className="text-sm text-[#6B5D52]">Why are you declining this item? Your payment will be refunded.</p>
                 <div className="space-y-2">
                    {["Item has damage not disclosed", "Item doesn't match description", "Changed my mind", "Safety concern"].map((reason) => (
                       <button
                         key={reason}
                         onClick={() => setRejectReason(reason)}
                         className={`w-full text-left p-3 rounded-xl border text-sm font-medium transition-colors ${rejectReason === reason ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-[#E8DDD4] text-[#4A3F37] hover:bg-[#F5EDE6]'}`}
                       >
                         {reason}
                       </button>
                    ))}
                 </div>

                 <button
                   onClick={handleRejectTransaction}
                   disabled={!rejectReason}
                   className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                 >
                    Confirm Cancellation
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Schedule Picker Modal */}
      {showSchedulePicker && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
            <SchedulePicker
              buyerId={transaction.buyerId}
              sellerId={transaction.sellerId}
              buyerZip={currentUser?.location || '98002'}
              sellerZip={seller?.location || listing.locationZip}
              sellerPorchEnabled={seller?.porchPickupEnabled}
              onScheduleConfirmed={handleScheduleConfirmed}
              onCancel={() => setShowSchedulePicker(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Transaction;
