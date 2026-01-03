
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { checkProductSafety, generateListingMetadata, optimizeListingDescription, analyzeDeal } from '../services/geminiService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Condition, Category, AgeRange, Listing, SafetyCheckResult, DealAnalysis } from '../types';
import { processImage } from '../utils/fileHelpers';
import { generateUUID } from '../utils/uuid';
import { Loader2, CheckCircle2, AlertTriangle, Camera, X, ChevronLeft, Calendar, Sparkles, Wand2, DollarSign } from 'lucide-react';

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

  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: Category.GEAR,
    condition: Condition.GOOD,
    ageRange: AgeRange.ZERO_TO_SIX_MO,
    isSmokeFree: false,
    isPetFree: false
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
          dealAnalysis: listing.dealAnalysis
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

      // 1. Create placeholders
      const newPlaceholders: ImageState[] = filesToProcess.map(() => ({
        id: Math.random().toString(36).substr(2, 9),
        previewUrl: '', 
        status: 'uploading'
      }));
      
      setImages(prev => [...prev, ...newPlaceholders]);
      if (safetyResult.status === 'safe') setSafetyResult({ status: 'idle' });

      // 2. Process and Upload
      filesToProcess.forEach(async (file, index) => {
        try {
          // Process locally (resize/compress)
          const processed = await processImage(file);
          const placeholderId = newPlaceholders[index].id;

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

        } catch (err) {
          console.error(err);
          showToast("Failed to upload image", "error");
          // Remove failed image
          setImages(prev => prev.filter(img => img.id !== newPlaceholders[index].id));
        }
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setSafetyResult({ status: 'idle' });
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
      manufactureDate: manufactureDate || undefined
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
                      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
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
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. UPPAbaby Vista V2" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-medium text-gray-700">Description</label>
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
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Include condition, age, and any defects..." className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 h-32 transition-all" />
            </div>
          </div>

          <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
             <h3 className="text-sm font-semibold text-brand-800 mb-2">Safety Verification Required</h3>
             <p className="text-xs text-brand-600 mb-4">We use a smart check to analyze your photos against the CPSC recall database.</p>
             {safetyResult.status === 'idle' && (
               <button onClick={handleSafetyCheck} disabled={!formData.title || !formData.description || images.length === 0} className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">Verify Safety</button>
             )}
             {safetyResult.status === 'checking' && <div className="w-full py-3 bg-brand-100 text-brand-700 rounded-xl font-medium flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Item...</div>}
             {safetyResult.status === 'safe' && <button type="button" onClick={() => setStep(2)} className="w-full py-3 bg-green-100 text-green-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-200"><CheckCircle2 className="w-5 h-5" /> Verified Safe - Continue</button>}
             {safetyResult.status === 'warning' && (
                <div className="space-y-3">
                   <div className="w-full py-3 bg-red-100 text-red-700 rounded-xl font-medium flex items-center justify-center gap-2"><AlertTriangle className="w-5 h-5" /> Safety Issue Detected</div>
                   <p className="text-xs text-red-600 bg-white p-2 rounded border border-red-100">{safetyResult.data?.reason || "Check failed."}</p>
                   <button type="button" onClick={() => setStep(2)} className="text-xs text-gray-500 underline w-full text-center">Continue anyway (Flag for review)</button>
                </div>
             )}
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <div className="relative">
                <input 
                  required 
                  type="number" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                  onBlur={handlePriceBlur}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                />
                {checkingPrice && <div className="absolute right-3 top-3.5"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>}
              </div>
              
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
               <label className="block text-sm font-medium text-gray-700 mb-1">Original Price ($)</label>
               <input type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} placeholder="Optional" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
             <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500">
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
               <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as Condition})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500">
                 {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
               <select value={formData.ageRange} onChange={e => setFormData({...formData, ageRange: e.target.value as AgeRange})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500">
                 {Object.values(AgeRange).map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
          </div>

          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="font-medium text-gray-700 text-sm">Household Details</h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.isSmokeFree} onChange={e => setFormData({...formData, isSmokeFree: e.target.checked})} className="w-5 h-5 text-brand-600 rounded" />
              <span className="text-sm text-gray-700">Smoke-free home</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.isPetFree} onChange={e => setFormData({...formData, isPetFree: e.target.checked})} className="w-5 h-5 text-brand-600 rounded" />
              <span className="text-sm text-gray-700">Pet-free home</span>
            </label>
          </div>

          <button type="submit" className="w-full py-4 bg-brand-600 text-white text-lg font-semibold rounded-xl hover:bg-brand-700 shadow-lg transition-all transform hover:-translate-y-0.5">
             {id ? 'Update Listing' : 'Publish Listing'}
           </button>
        </form>
      )}
      </div>
    </div>
  );
};

export default CreateListing;
