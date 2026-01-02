
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { TransactionStatus, Review } from '../types';
import { ChevronLeft, Lock, ShieldCheck, CheckCircle, MapPin, Clock, CreditCard, Camera, AlertTriangle, UserCheck, Sparkles, ExternalLink, X, RotateCcw, Loader2, FileText, Star, Download, XCircle } from 'lucide-react';
import SafetyBadge from '../components/SafetyBadge';
import { generateInspectionChecklist } from '../services/geminiService';
import { processImage } from '../utils/fileHelpers';
import { uploadToCloudinary } from '../services/cloudinaryService';

const Transaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTransactionById, getListingById, getUserById, currentUser, updateTransactionStatus, addReview } = useStore();
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

  // Animation State
  const [showConfetti, setShowConfetti] = useState(false);

  const transaction = getTransactionById(id || '');
  if (!transaction) return <div className="p-4">Transaction not found</div>;

  const listing = getListingById(transaction.listingId);
  if (!listing) return <div className="p-4">Listing not found</div>;

  const isBuyer = currentUser?.id === transaction.buyerId;
  const otherUser = getUserById(isBuyer ? transaction.sellerId : transaction.buyerId);

  // Trigger confetti when completed
  useEffect(() => {
    if (transaction.status === TransactionStatus.COMPLETED) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [transaction.status]);

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

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentModal(false);
    setLoading(true);
    
    // Simulate Stripe processing
    setTimeout(() => {
      setLoading(false);
      updateTransactionStatus(transaction.id, TransactionStatus.PAYMENT_HELD);
      showToast("Payment secured in escrow!");
    }, 2000);
  };

  const handleConfirmMeetup = () => {
    updateTransactionStatus(transaction.id, TransactionStatus.MEETUP_AGREED, {
      meetupLocation: "Auburn Police Station (Safe Zone)",
      meetupTime: "Tomorrow at 2:00 PM"
    });
    showToast("Meetup confirmed!");
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
      
      // 2. Update Transaction
      updateTransactionStatus(transaction.id, TransactionStatus.COMPLETED, {
        inspectionChecklist: {
          matchesDescription: true, // simplified for storage
          conditionAcceptable: true,
          noUndisclosedDamage: true
        },
        inspectionPhotoUrl: remotePhotoUrl
      });
      showToast("Transaction Complete! Funds released.");
    } catch (e) {
      console.error(e);
      showToast("Failed to upload proof photo. Try again.", "error");
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const handleRejectTransaction = () => {
    if (!rejectReason) return;
    // For MVP, we treat rejection during inspection as a Cancellation (refund buyer)
    updateTransactionStatus(transaction.id, TransactionStatus.CANCELLED);
    setShowRejectModal(false);
    showToast("Transaction cancelled. Payment will be refunded.");
  };

  const handleSubmitReview = () => {
    if(!currentUser || !otherUser) return;
    
    const newReview: Review = {
        id: `rev_${Date.now()}`,
        targetUserId: otherUser.id,
        authorId: currentUser.id,
        authorName: currentUser.name,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0]
    };
    
    addReview(newReview);
    setReviewSubmitted(true);
    showToast("Review submitted successfully!", "success");
  };

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
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
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
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 text-sm">Transaction #{transaction.id.slice(-6)}</h1>
          <p className="text-xs text-gray-500">with {otherUser?.name}</p>
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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
          <img src={listing.images[0]} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
          <div className="flex-1">
             <h3 className="font-bold text-gray-900 line-clamp-1">{listing.title}</h3>
             <p className="text-sm text-gray-500 mb-2">${listing.price}</p>
             <SafetyBadge isVerified={listing.isSafetyVerified} size="sm" />
          </div>
        </div>

        {/* Steps Timeline */}
        <div className={`space-y-6 relative pl-4 border-l-2 border-gray-200 ml-4 my-6 ${transaction.status === TransactionStatus.CANCELLED ? 'opacity-50 grayscale' : ''}`}>
          
          {/* Step 1: Request */}
          <div className="relative">
            <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 ${transaction.status !== TransactionStatus.CANCELLED ? 'bg-green-500 border-green-500' : 'bg-gray-400 border-gray-400'}`}></div>
            <h4 className="font-bold text-sm text-gray-900">Request Initiated</h4>
            <p className="text-xs text-gray-500">Buyer requested to purchase.</p>
            {transaction.status === TransactionStatus.INITIATED && !isBuyer && (
              <div className="mt-3 flex gap-2">
                <button onClick={handleAcceptRequest} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold">Accept Request</button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold">Decline</button>
              </div>
            )}
            {transaction.status === TransactionStatus.INITIATED && isBuyer && (
               <div className="mt-2 bg-yellow-50 p-2 rounded text-xs text-yellow-800">Waiting for seller to accept...</div>
            )}
          </div>

          {/* Step 2: Payment */}
          <div className={`relative ${[TransactionStatus.INITIATED].includes(transaction.status) ? 'opacity-40' : ''}`}>
             <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 ${[TransactionStatus.ACCEPTED, TransactionStatus.INITIATED].includes(transaction.status) ? 'bg-white border-gray-300' : 'bg-green-500 border-green-500'}`}></div>
             <h4 className="font-bold text-sm text-gray-900">Secure Payment</h4>
             {transaction.status === TransactionStatus.ACCEPTED && isBuyer && (
               <div className="mt-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                 <div className="flex justify-between mb-2 text-sm">
                   <span className="text-gray-600">Item Price</span>
                   <span>${transaction.amount}</span>
                 </div>
                 <div className="flex justify-between mb-2 text-sm">
                   <span className="text-gray-600">Platform Fee (8%)</span>
                   <span>${transaction.platformFee}</span>
                 </div>
                 <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900">
                   <span>Total</span>
                   <span>${transaction.total}</span>
                 </div>
                 <div className="bg-green-50 p-2 rounded mt-3 flex items-start gap-2 text-xs text-green-800 mb-3">
                   <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                   Funds are held in escrow until you inspect the item in person.
                 </div>
                 <button onClick={() => setShowPaymentModal(true)} disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                   {loading ? "Processing..." : <><CreditCard className="w-4 h-4" /> Pay Securely</>}
                 </button>
               </div>
             )}
          </div>

          {/* Step 3: Meetup */}
          <div className={`relative ${[TransactionStatus.INITIATED, TransactionStatus.ACCEPTED].includes(transaction.status) ? 'opacity-40' : ''}`}>
             <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 ${[TransactionStatus.INITIATED, TransactionStatus.ACCEPTED, TransactionStatus.PAYMENT_HELD].includes(transaction.status) ? 'bg-white border-gray-300' : 'bg-green-500 border-green-500'}`}></div>
             <h4 className="font-bold text-sm text-gray-900">Meetup & Inspection</h4>
             
             {transaction.status === TransactionStatus.PAYMENT_HELD && (
               <div className="mt-3">
                 <p className="text-xs text-gray-500 mb-3">Coordinate a time and place in chat, then confirm here.</p>
                 <button onClick={handleConfirmMeetup} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                   <Clock className="w-3 h-3" /> Confirm Meeting Details
                 </button>
               </div>
             )}

             {transaction.status === TransactionStatus.MEETUP_AGREED && (
                <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                   <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-1">
                     <MapPin className="w-4 h-4" /> Auburn Police Station
                   </div>
                   <div className="text-xs text-blue-700 mb-3">Tomorrow at 2:00 PM</div>
                   <div className="bg-white p-2 rounded mb-3 text-xs text-gray-600 border border-blue-100 flex gap-2 items-start">
                      <Sparkles className="w-3 h-3 text-brand-500 flex-shrink-0 mt-0.5" />
                      We will generate a custom safety checklist for this item when you arrive.
                   </div>
                   <button onClick={handleArrived} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">
                     I Have Arrived
                   </button>
                </div>
             )}

             {/* INSPECTION UI */}
             {transaction.status === TransactionStatus.INSPECTION_PENDING && (
                <div className="mt-4 bg-white border-2 border-brand-500 rounded-xl p-4 shadow-lg animate-in zoom-in-95">
                   <div className="flex items-center gap-2 mb-4 text-brand-700 font-bold border-b border-brand-100 pb-2">
                     <ShieldCheck className="w-5 h-5" /> Smart Inspection
                   </div>
                   
                   {!isBuyer ? (
                      <div className="text-sm text-gray-500 text-center py-4">
                        Waiting for buyer to inspect item...
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <div className="bg-brand-50 rounded-lg p-3 text-xs text-brand-800 border border-brand-100">
                            <strong>AI Generated Checklist:</strong> We've created specific checks for this <em>{listing.category}</em>.
                         </div>

                         {checklistLoading ? (
                            <div className="py-6 text-center text-gray-500 flex flex-col items-center">
                               <Sparkles className="w-6 h-6 animate-pulse text-brand-500 mb-2" />
                               <span className="text-xs">Generating safety checks...</span>
                            </div>
                         ) : (
                            <div className="space-y-3">
                               {customChecklistItems.map((item, idx) => (
                                 <label key={idx} className="flex items-start gap-3 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100 transition-colors">
                                   <input 
                                     type="checkbox" 
                                     checked={!!checkedItems[idx]} 
                                     onChange={() => handleCheckItem(idx)} 
                                     className="mt-1 w-5 h-5 text-brand-600 rounded" 
                                   />
                                   <span className="text-sm text-gray-700">{item}</span>
                                 </label>
                               ))}
                            </div>
                         )}

                         <div 
                           onClick={() => !photoPreview && fileInputRef.current?.click()}
                           className={`h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${photoPreview ? 'border-brand-500' : 'border-gray-300 text-gray-400 hover:bg-gray-50'}`}
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
                                  <div className="absolute bottom-0 left-0 right-0 bg-brand-600/90 text-white text-[10px] text-center py-1">
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
             <h4 className="font-bold text-sm text-gray-900">Transaction Complete</h4>
             
             {transaction.status === TransactionStatus.COMPLETED && (
                <div className="mt-4 animate-in slide-in-from-bottom-4 duration-500">
                   {/* Receipt Card */}
                   <div className="bg-white border border-gray-200 rounded-xl p-0 overflow-hidden shadow-sm mb-6">
                      <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle className="w-4 h-4 text-green-600" /></div>
                            <span className="font-bold text-gray-800 text-sm">Receipt</span>
                         </div>
                         <span className="text-[10px] text-gray-400 font-mono">#{transaction.id.slice(-8)}</span>
                      </div>
                      <div className="p-4 space-y-3">
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Item</span>
                            <span className="font-medium text-gray-900">{listing.title}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Payment Method</span>
                            <span className="font-medium text-gray-900">Visa ending 4242</span>
                         </div>
                         <div className="border-t border-dashed border-gray-200 my-2 pt-2">
                            <div className="flex justify-between text-sm font-bold">
                               <span>Total Paid</span>
                               <span>${transaction.total}</span>
                            </div>
                         </div>
                      </div>
                      <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                         <button className="text-xs font-bold text-gray-500 flex items-center justify-center gap-1 hover:text-gray-800">
                            <Download className="w-3 h-3" /> Download PDF
                         </button>
                      </div>
                   </div>

                   {/* Review Section */}
                   {isBuyer && !reviewSubmitted ? (
                      <div className="bg-white border border-yellow-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                         <div className="relative z-10">
                            <h3 className="font-bold text-gray-900 text-sm mb-1">Rate your experience</h3>
                            <p className="text-xs text-gray-500 mb-3">How was your meetup with {otherUser?.name}?</p>
                            
                            <div className="flex justify-center gap-2 mb-3">
                               {[1, 2, 3, 4, 5].map((star) => (
                                  <button key={star} onClick={() => setRating(star)} className="focus:outline-none transform hover:scale-110 transition-transform">
                                     <Star className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                  </button>
                               ))}
                            </div>
                            
                            {rating > 0 && (
                               <div className="animate-in fade-in slide-in-from-bottom-2">
                                  <textarea 
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Write a quick review..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    rows={2}
                                  />
                                  <button 
                                    onClick={handleSubmitReview}
                                    className="w-full py-2 bg-black text-white rounded-lg text-sm font-bold"
                                  >
                                    Submit Review
                                  </button>
                               </div>
                            )}
                         </div>
                      </div>
                   ) : isBuyer ? (
                      <div className="text-center p-4 bg-green-50 rounded-xl text-green-800 text-sm font-medium">
                         <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                         Thanks for your review!
                      </div>
                   ) : null}
                   
                   <button onClick={() => navigate('/')} className="w-full mt-4 py-3 text-gray-500 text-sm font-medium hover:text-gray-800">
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
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900">Add Payment Method</h3>
                 <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              
              <form onSubmit={handleProcessPayment} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Number</label>
                    <div className="relative">
                       <CreditCard className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                       <input autoFocus required type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono" />
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <div className="flex-1">
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry</label>
                       <input required type="text" placeholder="MM/YY" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-center" />
                    </div>
                    <div className="flex-1">
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVC</label>
                       <input required type="text" placeholder="123" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-center" />
                    </div>
                 </div>
                 
                 <div className="bg-brand-50 p-3 rounded-lg text-xs text-brand-800 flex items-start gap-2">
                    <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <p>Your payment of <strong>${transaction.total}</strong> will be held in escrow until you inspect and accept the item.</p>
                 </div>

                 <button className="w-full py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-colors">
                    Pay Now
                 </button>
              </form>
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
                 <button onClick={() => setShowRejectModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              
              <div className="space-y-4">
                 <p className="text-sm text-gray-600">Why are you declining this item? Your payment will be refunded.</p>
                 <div className="space-y-2">
                    {["Item has damage not disclosed", "Item doesn't match description", "Changed my mind", "Safety concern"].map((reason) => (
                       <button
                         key={reason}
                         onClick={() => setRejectReason(reason)}
                         className={`w-full text-left p-3 rounded-xl border text-sm font-medium transition-colors ${rejectReason === reason ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
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
    </div>
  );
};

export default Transaction;
