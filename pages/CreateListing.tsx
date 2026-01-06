
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { checkProductSafety, generateListingMetadata, optimizeListingDescription, analyzeDeal, validateListingImages, ImageValidationResponse } from '../services/geminiService';
import { uploadToCloudinary, validateBeforeUpload } from '../services/cloudinaryService';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Condition, Category, AgeRange, Listing, SafetyCheckResult, DealAnalysis, DeliveryMethod, SHIPPING_ESTIMATES } from '../types';
import { processImage } from '../utils/fileHelpers';
import { generateUUID } from '../utils/uuid';
import { Loader2, CheckCircle2, AlertTriangle, Camera, X, ChevronLeft, Calendar, Sparkles, Wand2, DollarSign, Package, Truck, MapPin } from 'lucide-react';
import ImageValidationFeedback from '../components/ImageValidationFeedback';
import PricingSuggestionWidget from '../components/PricingSuggestion';

interface ImageState {
  id: string;
  previewUrl: string;
  base64?: string; // For AI check
  mimeType?: string; // For AI check
  remoteUrl?: string; // Final Cloudinary URL
  status: 'uploading' | 'done' | 'error';
}

interface FormState {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  category: Category;
  condition: Condition;
  ageRange: AgeRange;
  isSmokeFree: boolean;
  isPetFree: boolean;
  dealAnalysis?: DealAnalysis; // Store result from creation flow
  bundleEligible: boolean;
  bundleDiscount: number;
  deliveryMethod: DeliveryMethod;
  shippingPrice: string;
}

const CreateListing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addListing, updateListing, getListingById, currentUser } = useStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [images, setImages] = useState<ImageState[]>([]);
  const [manufactureDate, setManufactureDate] = useState('');

  // Seller Assistant States
  const [optimizingDesc, setOptimizingDesc] = useState(false);
  const [checkingPrice, setCheckingPrice] = useState(false);

  // Image Validation States
  const [imageValidation, setImageValidation] = useState<ImageValidationResponse | null>(null);
  const [isValidatingImages, setIsValidatingImages] = useState(false);

  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: Category.GEAR,
    condition: Condition.GOOD,
    ageRange: AgeRange.ZERO_TO_SIX_MO,
    isSmokeFree: false,
    isPetFree: false,
    bundleEligible: false,
    bundleDiscount: 10,
    deliveryMethod: DeliveryMethod.LOCAL_PICKUP,
    shippingPrice: ''
  });
  
  const [safetyResult, setSafetyResult] = useState<{
    status: 'idle' | 'checking' | 'safe' | 'warning';
    data?: SafetyCheckResult;
  }>({ status: 'idle' });

  useEffect(() => {
    if (id) {
      const listing = getListingById(id);
      if (listing) {
        setFormData({
          title: listing.title,
          description: listing.description,
          price: listing.price.toString(),
          originalPrice: listing.originalPrice ? listing.originalPrice.toString() : '',
          category: listing.category,
          condition: listing.condition,
          ageRange: listing.ageRange,
          isSmokeFree: listing.isSmokeFree || false,
          isPetFree: listing.isPetFree || false,
          dealAnalysis: listing.dealAnalysis,
          bundleEligible: listing.bundleEligible || false,
          bundleDiscount: listing.bundleDiscount || 10,
          deliveryMethod: listing.deliveryMethod || DeliveryMethod.LOCAL_PICKUP,
          shippingPrice: listing.shippingPrice?.toString() || ''
        });
        setManufactureDate(listing.manufactureDate || '');
        // Map existing images to "done" state
        const existingImages = listing.images.map(url => ({
          id: Math.random().toString(36).substr(2, 9),
          previewUrl: url,
          remoteUrl: url,
          status: 'done' as const
        }));
        setImages(existingImages);
        setSafetyResult({ status: listing.isSafetyVerified ? 'safe' : 'warning', data: listing.safetyCheckResult });
      }
    }
  }, [id, getListingById]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const remainingSlots = 6 - images.length;
      // Explicitly cast to File[] to avoid TS error about 'unknown' type
      const filesToProcess = Array.from(e.target.files).slice(0, remainingSlots) as File[];
      if (filesToProcess.length === 0) return;

      // Reset validation when new images are added
      setImageValidation(null);

      // Pre-upload validation for each file
      const validFiles: File[] = [];
      for (const file of filesToProcess) {
        const preValidation = await validateBeforeUpload(file);
        if (!preValidation.isValid) {
          showToast(preValidation.error || 'Invalid image', 'error');
          continue;
        }
        if (preValidation.warning) {
          showToast(preValidation.warning, 'info');
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // 1. Create placeholders for valid files only
      const newPlaceholders: ImageState[] = validFiles.map(() => ({
        id: Math.random().toString(36).substr(2, 9),
        previewUrl: '',
        status: 'uploading'
      }));

      setImages(prev => [...prev, ...newPlaceholders]);
      if (safetyResult.status === 'safe') setSafetyResult({ status: 'idle' });

      // Track completed uploads for AI validation
      let completedUploads = 0;
      const processedImages: { base64: string; mimeType: string }[] = [];

      // 2. Process and Upload
      validFiles.forEach(async (file, index) => {
        try {
          // Process locally (resize/compress)
          const processed = await processImage(file);
          const placeholderId = newPlaceholders[index].id;

          // Store for AI validation
          processedImages[index] = { base64: processed.base64, mimeType: processed.mimeType };

          // Update preview immediately
          setImages(prev => prev.map(img =>
            img.id === placeholderId
              ? { ...img, previewUrl: processed.previewUrl, base64: processed.base64, mimeType: processed.mimeType }
              : img
          ));

          // Upload to Cloudinary
          const remoteUrl = await uploadToCloudinary(processed.blob);

          // Update with remote URL and status done
          setImages(prev => prev.map(img =>
            img.id === placeholderId
              ? { ...img, remoteUrl, status: 'done' }
              : img
          ));

          // Track completion
          completedUploads++;

          // Run AI validation when all uploads complete
          if (completedUploads === validFiles.length) {
            runImageValidation(processedImages);
          }

        } catch (err) {
          console.error(err);
          showToast("Failed to upload image", "error");
          // Remove failed image
          setImages(prev => prev.filter(img => img.id !== newPlaceholders[index].id));
          completedUploads++; // Still count as complete to not block validation
        }
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run AI validation on images
  const runImageValidation = async (imagesToValidate: { base64: string; mimeType: string }[]) => {
    if (imagesToValidate.length === 0) return;

    setIsValidatingImages(true);
    try {
      const result = await validateListingImages(imagesToValidate, formData.category);
      setImageValidation(result);

      // Show toast for rejected images
      if (result?.overallStatus === 'rejected') {
        showToast('Some photos need to be replaced', 'error');
      }
    } catch (error) {
      console.error('Image validation failed:', error);
    } finally {
      setIsValidatingImages(false);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setSafetyResult({ status: 'idle' });
    setImageValidation(null); // Reset validation when image is removed
  };

  const handleAutofill = async () => {
    const primaryImage = images[0];
    if (!primaryImage || !primaryImage.base64) {
      showToast("Please upload a photo first", "error");
      return;
    }

    setAutofillLoading(true);
    try {
      const metadata = await generateListingMetadata(primaryImage.base64, primaryImage.mimeType);
      if (metadata) {
        setFormData(prev => ({
          ...prev,
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          condition: metadata.condition,
          ageRange: metadata.ageRange,
          price: metadata.suggestedPrice.toString()
        }));
        showToast("Auto-filled from image!", "success");
      } else {
        showToast("Could not generate details. Try again.", "error");
      }
    } catch (e) {
      showToast("AI Auto-fill failed", "error");
    } finally {
      setAutofillLoading(false);
    }
  };

  const handleOptimizeDescription = async () => {
    if (!formData.description || formData.description.length < 5) {
      showToast("Write a quick draft first!", "info");
      return;
    }
    setOptimizingDesc(true);
    const improved = await optimizeListingDescription(formData.description, formData.title, formData.category);
    setOptimizingDesc(false);
    if (improved) {
      setFormData(prev => ({ ...prev, description: improved }));
      showToast("Description improved!", "success");
    } else {
      showToast("Could not improve description.", "error");
    }
  };

  // Run full Deal Analysis when price is set
  const handlePriceBlur = async () => {
    if (!formData.price || !formData.title) return;

    setCheckingPrice(true);
    try {
      const analysis = await analyzeDeal(
        formData.title,
        Number(formData.price),
        formData.condition,
        formData.originalPrice ? Number(formData.originalPrice) : undefined
      );

      // Only store successful analysis results, not errors
      if (analysis && !('error' in analysis)) {
        setFormData(prev => ({ ...prev, dealAnalysis: analysis }));
      }
    } catch (e) {
      console.error("Deal analysis failed on creation", e);
    } finally {
      setCheckingPrice(false);
    }
  };

  const handleSafetyCheck = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setSafetyResult({ status: 'checking' });
    setLoading(true);

    try {
      // Use the base64 of the first image (either newly uploaded or we skip if it's an existing remote URL without base64)
      const primaryImage = images[0];
      
      const result = await checkProductSafety(
        formData.title, 
        formData.description, 
        primaryImage?.base64, 
        primaryImage?.mimeType
      );
      
      setSafetyResult({
        status: result.isSafe ? 'safe' : 'warning',
        data: result
      });
      if (result.isSafe) setTimeout(() => setStep(2), 1500);
    } catch (error) {
      setSafetyResult({ status: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Check if uploads are done
    const pendingUploads = images.some(img => img.status === 'uploading');
    if (pendingUploads) {
      showToast("Please wait for images to finish uploading", "info");
      return;
    }

    // Car Seat Expiration Logic
    if (formData.category === Category.CAR_SEATS) {
        if (!manufactureDate) {
            showToast("Manufacture date required for car seats", "error");
            return;
        }
        const mDate = new Date(manufactureDate);
        const today = new Date();
        const expirationYear = mDate.getFullYear() + 6; 
        const expirationDate = new Date(mDate);
        expirationDate.setFullYear(expirationYear);

        if (today > expirationDate) {
            alert("SAFETY ALERT: This car seat is likely expired. You cannot list it.");
            return;
        }
    }
    
    // Extract final URLs
    const finalImageUrls = images
      .map(img => img.remoteUrl)
      .filter((url): url is string => !!url);

    if (finalImageUrls.length === 0) {
      finalImageUrls.push('https://via.placeholder.com/400?text=No+Image');
    }

    const offersShipping = formData.deliveryMethod === DeliveryMethod.SHIPPING || formData.deliveryMethod === DeliveryMethod.BOTH;

    const commonData = {
      userId: currentUser.id,
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      dealAnalysis: formData.dealAnalysis, // Save AI Analysis
      category: formData.category,
      condition: formData.condition,
      ageRange: formData.ageRange,
      isSmokeFree: formData.isSmokeFree,
      isPetFree: formData.isPetFree,
      images: finalImageUrls,
      locationZip: currentUser.location || '98001',
      isSafetyVerified: safetyResult.status === 'safe',
      safetyCheckResult: safetyResult.data,
      manufactureDate: manufactureDate || undefined,
      bundleEligible: formData.bundleEligible,
      bundleDiscount: formData.bundleEligible ? formData.bundleDiscount : undefined,
      deliveryMethod: formData.deliveryMethod,
      shippingPrice: offersShipping && formData.shippingPrice ? Number(formData.shippingPrice) : undefined,
      offersShipping
    };

    if (id) {
      const existing = getListingById(id);
      if (existing) {
        updateListing({ ...existing, ...commonData, updatedAt: new Date().toISOString() } as Listing);
        showToast('Listing updated successfully', 'success');
      }
    } else {
      addListing({ ...commonData, id: generateUUID(), distanceMiles: 0.1, createdAt: 'Just now' } as Listing);
      showToast('Listing published successfully!', 'success');
    }
    navigate('/');
  };

  return (
    <div className="p-4 lg:p-8 min-h-full bg-white pb-20">
      <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        {step === 2 && <button onClick={() => setStep(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6 text-gray-600" /></button>}
        <h1 className="text-2xl font-bold text-gray-900 lg:hidden">{id ? 'Edit Listing' : 'Sell Item'}</h1>
      </div>

      {step === 1 && (
        <form className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="block text-sm font-medium text-gray-700">Photos</label>
              <span className="text-xs text-gray-400">{images.length}/6</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div key={img.id} className="aspect-square bg-gray-100 rounded-xl relative overflow-hidden group border border-gray-200">
                  {img.status === 'uploading' ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <Loader2 className="w-6 h-6 animate-spin text-[#2D9B8C]" />
                    </div>
                  ) : (
                    <img src={img.previewUrl} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  )}
                  
                  <button type="button" onClick={() => removeImage(img.id)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                  {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">Main</div>}
                </div>
              ))}
              
              {images.length < 6 && (
                <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-xs">Add Photo</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple className="hidden" />
            </div>
            
            {/* AI Auto-fill Button */}
            {images.length > 0 && (
              <button 
                type="button" 
                onClick={handleAutofill}
                disabled={autofillLoading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                {autofillLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Photo...</>
                ) : (
                  <><Sparkles className="w-4 h-4 text-yellow-300" /> Auto-Fill Details</>
                )}
              </button>
            )}
            
            <p className="text-[10px] text-gray-400">Photos are automatically optimized for mobile.</p>

            {/* Image Validation Feedback */}
            <ImageValidationFeedback
              validation={imageValidation}
              isValidating={isValidatingImages}
              onDismiss={() => setImageValidation(null)}
            />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-400">*</span></label>
                <span className={`text-xs ${formData.title.length > 60 ? 'text-red-500' : formData.title.length > 40 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {formData.title.length}/60
                </span>
              </div>
              <input
                required
                type="text"
                maxLength={60}
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. UPPAbaby Vista V2"
                className={`w-full p-3 bg-gray-50 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] transition-all ${
                  formData.title.length > 0 && formData.title.length < 5
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-gray-200'
                }`}
              />
              {formData.title.length > 0 && formData.title.length < 5 && (
                <p className="text-xs text-amber-600 mt-1">Title should be at least 5 characters</p>
              )}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-medium text-gray-700">Description <span className="text-red-400">*</span></label>
                 <div className="flex items-center gap-3">
                   <span className={`text-xs ${formData.description.length > 500 ? 'text-red-500' : formData.description.length > 400 ? 'text-amber-500' : 'text-gray-400'}`}>
                     {formData.description.length}/500
                   </span>
                   <button
                     type="button"
                     onClick={handleOptimizeDescription}
                     disabled={optimizingDesc}
                     className="text-xs text-purple-600 font-bold flex items-center gap-1 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                   >
                     {optimizingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                     {optimizingDesc ? "Polishing..." : "Polish"}
                   </button>
                 </div>
              </div>
              <textarea
                required
                maxLength={500}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Include condition, age, and any defects..."
                className={`w-full p-3 bg-gray-50 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] h-32 transition-all resize-none ${
                  formData.description.length > 0 && formData.description.length < 20
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-gray-200'
                }`}
              />
              {formData.description.length > 0 && formData.description.length < 20 && (
                <p className="text-xs text-amber-600 mt-1">Add more detail to help buyers (at least 20 characters)</p>
              )}
            </div>
          </div>

          <div className="bg-[#F0FAF8] rounded-xl p-4 border border-[#2D9B8C]/20">
             <h3 className="text-sm font-semibold text-[#4A3F37] mb-2">Safety Verification Required</h3>
             <p className="text-xs text-[#2D9B8C] mb-4">We use a smart check to analyze your photos against the CPSC recall database.</p>
             {safetyResult.status === 'idle' && (
               <button
                 onClick={handleSafetyCheck}
                 disabled={!formData.title || !formData.description || images.length === 0 || imageValidation?.overallStatus === 'rejected' || isValidatingImages}
                 className="w-full py-3 bg-[#2D9B8C] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {imageValidation?.overallStatus === 'rejected' ? 'Fix Photos First' : 'Verify Safety'}
               </button>
             )}
             {safetyResult.status === 'checking' && <div className="w-full py-3 bg-[#F0FAF8] text-[#247A6F] rounded-xl font-medium flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Item...</div>}
             {safetyResult.status === 'safe' && <button type="button" onClick={() => setStep(2)} className="w-full py-3 bg-green-100 text-green-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-200"><CheckCircle2 className="w-5 h-5" /> Verified Safe - Continue</button>}
             {safetyResult.status === 'warning' && (
                <div className="space-y-3">
                   {/* Check if there are actual recalls - these BLOCK listing */}
                   {safetyResult.data?.potentialRecalls && safetyResult.data.potentialRecalls.length > 0 ? (
                     <>
                       <div className="w-full py-3 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                         <AlertTriangle className="w-5 h-5" /> 🚫 Recalled Item - Cannot List
                       </div>
                       <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                         <p className="text-sm text-red-800 font-medium mb-2">This item has been recalled:</p>
                         <ul className="text-xs text-red-700 list-disc pl-4 space-y-1">
                           {safetyResult.data.potentialRecalls.map((recall, idx) => (
                             <li key={idx}>{recall}</li>
                           ))}
                         </ul>
                       </div>
                       <p className="text-xs text-red-600 bg-white p-2 rounded border border-red-100">
                         {safetyResult.data?.reason}
                       </p>
                       <p className="text-xs text-gray-500 text-center">
                         For safety reasons, recalled items cannot be sold on Pipit.
                         <a href="https://www.cpsc.gov/Recalls" target="_blank" rel="noopener noreferrer" className="text-[#2D9B8C] underline ml-1">
                           Learn more at CPSC.gov
                         </a>
                       </p>
                       <button
                         type="button"
                         onClick={() => navigate('/')}
                         className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                       >
                         Return Home
                       </button>
                     </>
                   ) : (
                     /* Non-recall safety warnings can still proceed with flag */
                     <>
                       <div className="w-full py-3 bg-amber-100 text-amber-700 rounded-xl font-medium flex items-center justify-center gap-2">
                         <AlertTriangle className="w-5 h-5" /> Safety Concern Detected
                       </div>
                       <p className="text-xs text-amber-700 bg-white p-2 rounded border border-amber-100">
                         {safetyResult.data?.reason || "Check failed."}
                       </p>
                       <button type="button" onClick={() => setStep(2)} className="text-xs text-gray-500 underline w-full text-center">
                         Continue anyway (Flag for review)
                       </button>
                     </>
                   )}
                </div>
             )}
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  required
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  onBlur={handlePriceBlur}
                  placeholder="0"
                  className={`w-full pl-7 pr-3 py-3 bg-gray-50 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] transition-all ${
                    formData.price && (Number(formData.price) < 1 || Number(formData.price) > 10000)
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-gray-200'
                  }`}
                />
                {checkingPrice && <div className="absolute right-3 top-3.5"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>}
              </div>
              {formData.price && Number(formData.price) < 1 && (
                <p className="text-xs text-red-500 mt-1">Price must be at least $1</p>
              )}
              
              {/* Full Deal Analysis Badge */}
              {!checkingPrice && formData.dealAnalysis && (
                 <div className={`mt-2 text-[10px] px-2 py-1.5 rounded-md inline-flex flex-col gap-0.5 font-bold animate-in fade-in ${
                   formData.dealAnalysis.dealScore >= 7 ? 'bg-green-100 text-green-700' :
                   formData.dealAnalysis.dealScore >= 5 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                 }`}>
                   <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {formData.dealAnalysis.verdict}
                   </div>
                   <span className="opacity-80 font-normal">Score: {formData.dealAnalysis.dealScore}/10</span>
                 </div>
              )}
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Original Price <span className="text-gray-400 font-normal">(optional)</span>
               </label>
               <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                 <input
                   type="number"
                   min="0"
                   value={formData.originalPrice}
                   onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                   placeholder="Retail price"
                   className="w-full pl-7 pr-3 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]"
                 />
               </div>
               {formData.originalPrice && formData.price && Number(formData.originalPrice) <= Number(formData.price) && (
                 <p className="text-xs text-amber-600 mt-1">Should be higher than your price</p>
               )}
            </div>
          </div>

          {/* AI Pricing Suggestion */}
          {formData.title.length >= 5 && (
            <PricingSuggestionWidget
              title={formData.title}
              category={formData.category}
              condition={formData.condition}
              originalPrice={formData.originalPrice ? Number(formData.originalPrice) : undefined}
              currentPrice={formData.price}
              onPriceSelect={(price) => setFormData({ ...formData, price: price.toString() })}
            />
          )}

          {/* Seller Fee Disclosure */}
          {formData.price && Number(formData.price) > 0 && (
            <div className="bg-[#F0FAF8] border border-[#2D9B8C]/20 rounded-xl p-3 text-sm">
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-[#2D9B8C] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#4A3F37] font-medium">When your item sells for ${formData.price}:</p>
                  <p className="text-[#6B5D52] text-xs mt-1">
                    You'll receive ~${(Number(formData.price) - (Number(formData.price) * 1.055 * 0.029 + 0.30)).toFixed(2)} after payment processing (~3%).
                    <span className="block mt-0.5 text-[#2D9B8C]">Pipit's fee is paid by the buyer, not you.</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
             <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]">
               {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>

          {/* Special Logic for Car Seats */}
          {formData.category === Category.CAR_SEATS && (
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-in fade-in">
                <div className="flex items-center gap-2 mb-2 text-orange-800 font-bold text-sm">
                   <Calendar className="w-4 h-4" /> Manufacture Date Required
                </div>
                <p className="text-xs text-orange-700 mb-3">Car seats expire after 6-10 years. We verify expiration to keep kids safe.</p>
                <input 
                  type="date" 
                  required
                  value={manufactureDate}
                  onChange={(e) => setManufactureDate(e.target.value)}
                  className="w-full p-3 bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
               <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as Condition})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]">
                 {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
               <select value={formData.ageRange} onChange={e => setFormData({...formData, ageRange: e.target.value as AgeRange})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]">
                 {Object.values(AgeRange).map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
          </div>

          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="font-medium text-gray-700 text-sm">Household Details</h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.isSmokeFree} onChange={e => setFormData({...formData, isSmokeFree: e.target.checked})} className="w-5 h-5 text-[#2D9B8C] rounded" />
              <span className="text-sm text-gray-700">Smoke-free home</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.isPetFree} onChange={e => setFormData({...formData, isPetFree: e.target.checked})} className="w-5 h-5 text-[#2D9B8C] rounded" />
              <span className="text-sm text-gray-700">Pet-free home</span>
            </label>
          </div>

          {/* Delivery Options Section */}
          <div className="space-y-4 bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-100">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#2D9B8C]" />
              <h4 className="font-medium text-gray-700 text-sm">Delivery Options</h4>
            </div>
            <p className="text-xs text-gray-500">Choose how buyers can receive this item.</p>

            <div className="space-y-2">
              {/* Local Pickup Only */}
              <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 hover:bg-white/50"
                style={{
                  borderColor: formData.deliveryMethod === DeliveryMethod.LOCAL_PICKUP ? '#2D9B8C' : 'transparent',
                  backgroundColor: formData.deliveryMethod === DeliveryMethod.LOCAL_PICKUP ? 'white' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={formData.deliveryMethod === DeliveryMethod.LOCAL_PICKUP}
                  onChange={() => setFormData({...formData, deliveryMethod: DeliveryMethod.LOCAL_PICKUP, shippingPrice: ''})}
                  className="mt-1 w-4 h-4 text-[#2D9B8C] accent-[#2D9B8C]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2D9B8C]" />
                    <span className="text-sm font-medium text-gray-700">Local Pickup Only</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Meet buyers in person near your location</p>
                </div>
              </label>

              {/* Shipping Only */}
              <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 hover:bg-white/50"
                style={{
                  borderColor: formData.deliveryMethod === DeliveryMethod.SHIPPING ? '#2D9B8C' : 'transparent',
                  backgroundColor: formData.deliveryMethod === DeliveryMethod.SHIPPING ? 'white' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={formData.deliveryMethod === DeliveryMethod.SHIPPING}
                  onChange={() => setFormData({...formData, deliveryMethod: DeliveryMethod.SHIPPING})}
                  className="mt-1 w-4 h-4 text-[#2D9B8C] accent-[#2D9B8C]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#2D9B8C]" />
                    <span className="text-sm font-medium text-gray-700">Ship Nationwide</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Ship to buyers anywhere in the US</p>
                </div>
              </label>

              {/* Both Options */}
              <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 hover:bg-white/50"
                style={{
                  borderColor: formData.deliveryMethod === DeliveryMethod.BOTH ? '#2D9B8C' : 'transparent',
                  backgroundColor: formData.deliveryMethod === DeliveryMethod.BOTH ? 'white' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={formData.deliveryMethod === DeliveryMethod.BOTH}
                  onChange={() => setFormData({...formData, deliveryMethod: DeliveryMethod.BOTH})}
                  className="mt-1 w-4 h-4 text-[#2D9B8C] accent-[#2D9B8C]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Both Options</span>
                    <span className="text-[10px] bg-[#2D9B8C] text-white px-1.5 py-0.5 rounded-full font-bold">Recommended</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Local pickup or ship - buyer's choice</p>
                </div>
              </label>
            </div>

            {/* Shipping Price Input */}
            {(formData.deliveryMethod === DeliveryMethod.SHIPPING || formData.deliveryMethod === DeliveryMethod.BOTH) && (
              <div className="pt-3 border-t border-teal-100 animate-in fade-in">
                <label className="block text-xs font-medium text-gray-600 mb-2">Shipping Cost</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={formData.shippingPrice}
                      onChange={e => setFormData({...formData, shippingPrice: e.target.value})}
                      placeholder={SHIPPING_ESTIMATES[formData.category]?.minCost?.toString() || '10'}
                      className="w-full pl-7 pr-3 py-2.5 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, shippingPrice: '0'})}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      formData.shippingPrice === '0'
                        ? 'bg-[#2D9B8C] text-white'
                        : 'bg-white text-[#2D9B8C] border border-[#2D9B8C] hover:bg-[#F0FAF8]'
                    }`}
                  >
                    Free Shipping
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  💡 Estimated shipping for {formData.category}: ${SHIPPING_ESTIMATES[formData.category]?.minCost || 10}-${SHIPPING_ESTIMATES[formData.category]?.maxCost || 30} ({SHIPPING_ESTIMATES[formData.category]?.estimatedDays || '3-7 days'})
                </p>
              </div>
            )}
          </div>

          {/* Bundle Deals Section */}
          <div className="space-y-3 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-700 text-sm">Bundle Deals</h4>
            </div>
            <p className="text-xs text-gray-500">Let buyers save when they purchase multiple items from you.</p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.bundleEligible}
                onChange={e => setFormData({...formData, bundleEligible: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded accent-purple-600"
              />
              <span className="text-sm text-gray-700">Enable bundle discount</span>
            </label>

            {formData.bundleEligible && (
              <div className="space-y-2 pt-2 animate-in fade-in">
                <label className="block text-xs font-medium text-gray-600">Discount when bundled (%)</label>
                <div className="flex items-center gap-3">
                  {[5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setFormData({...formData, bundleDiscount: pct})}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.bundleDiscount === pct
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Buyers will see a "{formData.bundleDiscount}% bundle" badge on this listing.
                </p>
              </div>
            )}
          </div>

          <button type="submit" className="w-full py-4 bg-[#2D9B8C] text-white text-lg font-semibold rounded-xl hover:bg-[#247A6F] shadow-lg transition-all transform hover:-translate-y-0.5">
             {id ? 'Update Listing' : 'Publish Listing'}
           </button>
        </form>
      )}
      </div>
    </div>
  );
};

export default CreateListing;
