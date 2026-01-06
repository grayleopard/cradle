import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { generateListingMetadata, ListingMetadata } from '../services/geminiService';
import { uploadToCloudinary, validateBeforeUpload } from '../services/cloudinaryService';
import { processImage } from '../utils/fileHelpers';
import { generateUUID } from '../utils/uuid';
import { Category, Condition, AgeRange, Listing } from '../types';
import {
  ChevronLeft,
  Upload,
  Camera,
  Sparkles,
  Loader2,
  CheckCircle,
  X,
  AlertCircle,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Rocket
} from 'lucide-react';

interface BulkItem {
  id: string;
  imageFile: File;
  previewUrl: string;
  status: 'pending' | 'analyzing' | 'ready' | 'uploading' | 'done' | 'error';
  metadata?: ListingMetadata;
  customTitle?: string;
  customPrice?: string;
  customCategory?: Category;
  customCondition?: Condition;
  cloudinaryUrl?: string;
  error?: string;
  expanded?: boolean;
}

const BulkListing = () => {
  const navigate = useNavigate();
  const { currentUser, addListing } = useStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<BulkItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);

  if (!currentUser) {
    navigate('/');
    return null;
  }

  // Handle file selection
  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files).slice(0, 10 - items.length); // Max 10 items
    const newItems: BulkItem[] = [];

    for (const file of files) {
      const validation = await validateBeforeUpload(file);
      if (!validation.isValid) {
        showToast(validation.error || 'Invalid file', 'error');
        continue;
      }

      const processed = await processImage(file);
      newItems.push({
        id: generateUUID(),
        imageFile: file,
        previewUrl: processed.previewUrl,
        status: 'pending'
      });
    }

    setItems(prev => [...prev, ...newItems]);
  };

  // Analyze all pending items with AI
  const analyzeAll = async () => {
    const pendingItems = items.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;

    setIsAnalyzing(true);

    for (const item of pendingItems) {
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'analyzing' } : i
      ));

      try {
        // Convert to base64 for AI
        const processed = await processImage(item.imageFile);

        const metadata = await generateListingMetadata(
          processed.base64!,
          processed.mimeType || 'image/jpeg'
        );

        if (metadata) {
          setItems(prev => prev.map(i =>
            i.id === item.id ? {
              ...i,
              status: 'ready',
              metadata,
              customTitle: metadata.title,
              customPrice: metadata.suggestedPrice.toString(),
              customCategory: metadata.category as Category,
              customCondition: metadata.condition as Condition
            } : i
          ));
        } else {
          throw new Error('AI analysis failed');
        }
      } catch (error) {
        console.error('Analysis error:', error);
        setItems(prev => prev.map(i =>
          i.id === item.id ? {
            ...i,
            status: 'error',
            error: 'Could not analyze this image'
          } : i
        ));
      }
    }

    setIsAnalyzing(false);
  };

  // Update individual item
  const updateItem = (id: string, updates: Partial<BulkItem>) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Remove item
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Toggle expand
  const toggleExpand = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, expanded: !item.expanded } : item
    ));
  };

  // Publish all ready items
  const publishAll = async () => {
    const readyItems = items.filter(item => item.status === 'ready');
    if (readyItems.length === 0) {
      showToast('No items ready to publish', 'error');
      return;
    }

    setIsPublishing(true);
    setPublishedCount(0);

    for (const item of readyItems) {
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'uploading' } : i
      ));

      try {
        // Upload image to Cloudinary
        const processed = await processImage(item.imageFile);
        const cloudinaryUrl = await uploadToCloudinary(processed.blob);

        // Create listing
        const newListing: Listing = {
          id: generateUUID(),
          userId: currentUser.id,
          title: item.customTitle || item.metadata?.title || 'Untitled',
          description: item.metadata?.description || '',
          price: Number(item.customPrice) || item.metadata?.suggestedPrice || 0,
          category: item.customCategory || (item.metadata?.category as Category) || Category.GEAR,
          condition: item.customCondition || (item.metadata?.condition as Condition) || Condition.GOOD,
          ageRange: (item.metadata?.ageRange as AgeRange) || AgeRange.ZERO_TO_SIX_MO,
          images: [cloudinaryUrl],
          locationZip: currentUser.location || '98001',
          isSafetyVerified: false,
          distanceMiles: 0.1,
          createdAt: new Date().toISOString()
        };

        addListing(newListing);

        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'done', cloudinaryUrl } : i
        ));
        setPublishedCount(prev => prev + 1);

      } catch (error) {
        console.error('Publish error:', error);
        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'error', error: 'Failed to publish' } : i
        ));
      }
    }

    setIsPublishing(false);
    showToast(`${readyItems.length} listings published!`, 'success');
  };

  // Counts
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const readyCount = items.filter(i => i.status === 'ready').length;
  const doneCount = items.filter(i => i.status === 'done').length;
  const errorCount = items.filter(i => i.status === 'error').length;

  return (
    <div className="min-h-full pb-32 bg-[#FFFCF9]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8DDD4] sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#F5EDE6] rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold font-serif text-xl text-[#4A3F37]">Bulk Listing ⚡</h1>
            <p className="text-xs text-[#B8A395]">Create multiple listings at once</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Upload Section */}
        {items.length < 10 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E8DDD4] rounded-2xl p-6 text-center cursor-pointer hover:border-[#2D9B8C] hover:bg-[#F0FAF8]/50 transition-colors"
          >
            <div className="w-12 h-12 bg-[#F5EDE6] rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-[#2D9B8C]" />
            </div>
            <h3 className="font-medium text-[#4A3F37] mb-1">Upload Photos</h3>
            <p className="text-sm text-[#B8A395]">Select up to {10 - items.length} photos</p>
            <p className="text-xs text-[#B8A395] mt-2">AI will auto-fill details for each item</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Stats Bar */}
        {items.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <div className="flex-shrink-0 bg-[#F5EDE6] rounded-lg px-3 py-2">
              <span className="text-xs text-[#6B5D52]">{items.length} Total</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex-shrink-0 bg-yellow-50 rounded-lg px-3 py-2">
                <span className="text-xs text-yellow-700">{pendingCount} Pending</span>
              </div>
            )}
            {readyCount > 0 && (
              <div className="flex-shrink-0 bg-[#F0FAF8] rounded-lg px-3 py-2">
                <span className="text-xs text-[#2D9B8C]">{readyCount} Ready</span>
              </div>
            )}
            {doneCount > 0 && (
              <div className="flex-shrink-0 bg-green-50 rounded-lg px-3 py-2">
                <span className="text-xs text-green-700">{doneCount} Published</span>
              </div>
            )}
            {errorCount > 0 && (
              <div className="flex-shrink-0 bg-red-50 rounded-lg px-3 py-2">
                <span className="text-xs text-red-600">{errorCount} Failed</span>
              </div>
            )}
          </div>
        )}

        {/* Analyze Button */}
        {pendingCount > 0 && (
          <button
            onClick={analyzeAll}
            disabled={isAnalyzing}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing {pendingCount} items...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Auto-Fill All ({pendingCount})</>
            )}
          </button>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                item.status === 'done'
                  ? 'border-green-200 bg-green-50/30'
                  : item.status === 'error'
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-[#E8DDD4]'
              }`}
            >
              {/* Item Header */}
              <div className="p-3 flex items-center gap-3">
                {/* Image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={item.previewUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  {item.status === 'analyzing' && (
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  {item.status === 'done' && (
                    <div className="absolute inset-0 bg-green-500/40 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {item.status === 'pending' && (
                    <p className="text-sm text-[#B8A395]">Waiting for analysis...</p>
                  )}
                  {item.status === 'analyzing' && (
                    <p className="text-sm text-purple-600 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Analyzing...
                    </p>
                  )}
                  {(item.status === 'ready' || item.status === 'uploading' || item.status === 'done') && (
                    <>
                      <p className="font-medium text-sm text-[#4A3F37] line-clamp-1">
                        {item.customTitle || item.metadata?.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-[#2D9B8C]">
                          ${item.customPrice || item.metadata?.suggestedPrice}
                        </span>
                        <span className="text-[10px] text-[#B8A395]">
                          {item.customCondition || item.metadata?.condition}
                        </span>
                      </div>
                    </>
                  )}
                  {item.status === 'error' && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {item.error}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {item.status === 'ready' && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-2 hover:bg-[#F5EDE6] rounded-lg transition-colors"
                    >
                      {item.expanded ? (
                        <ChevronUp className="w-4 h-4 text-[#6B5D52]" />
                      ) : (
                        <Pencil className="w-4 h-4 text-[#6B5D52]" />
                      )}
                    </button>
                  )}
                  {item.status !== 'done' && item.status !== 'uploading' && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Edit Form */}
              {item.expanded && item.status === 'ready' && (
                <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[#E8DDD4] mt-2 animate-in slide-in-from-top">
                  <div>
                    <label className="text-xs text-[#6B5D52] mb-1 block">Title</label>
                    <input
                      type="text"
                      value={item.customTitle || ''}
                      onChange={(e) => updateItem(item.id, { customTitle: e.target.value })}
                      className="w-full p-2 text-sm bg-[#F5EDE6] rounded-lg border-none focus:ring-2 focus:ring-[#2D9B8C]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#6B5D52] mb-1 block">Price</label>
                      <input
                        type="number"
                        value={item.customPrice || ''}
                        onChange={(e) => updateItem(item.id, { customPrice: e.target.value })}
                        className="w-full p-2 text-sm bg-[#F5EDE6] rounded-lg border-none focus:ring-2 focus:ring-[#2D9B8C]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#6B5D52] mb-1 block">Condition</label>
                      <select
                        value={item.customCondition || ''}
                        onChange={(e) => updateItem(item.id, { customCondition: e.target.value as Condition })}
                        className="w-full p-2 text-sm bg-[#F5EDE6] rounded-lg border-none focus:ring-2 focus:ring-[#2D9B8C]"
                      >
                        {Object.values(Condition).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#6B5D52] mb-1 block">Category</label>
                    <select
                      value={item.customCategory || ''}
                      onChange={(e) => updateItem(item.id, { customCategory: e.target.value as Category })}
                      className="w-full p-2 text-sm bg-[#F5EDE6] rounded-lg border-none focus:ring-2 focus:ring-[#2D9B8C]"
                    >
                      {Object.values(Category).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-8">
            <Camera className="w-12 h-12 text-[#E8DDD4] mx-auto mb-3" />
            <p className="text-[#B8A395] text-sm">Add photos to get started</p>
          </div>
        )}
      </div>

      {/* Publish Footer */}
      {readyCount > 0 && !isPublishing && doneCount < items.length && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8DDD4] p-4 safe-area-pb">
          <button
            onClick={publishAll}
            className="w-full py-4 bg-[#2D9B8C] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#247A6F] transition-colors shadow-lg"
          >
            <Rocket className="w-5 h-5" /> Publish {readyCount} Listing{readyCount > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Publishing Progress */}
      {isPublishing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8DDD4] p-4 safe-area-pb">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-[#2D9B8C] animate-spin" />
            <span className="text-[#4A3F37] font-medium">
              Publishing... {publishedCount}/{readyCount}
            </span>
          </div>
        </div>
      )}

      {/* All Done */}
      {doneCount === items.length && items.length > 0 && !isPublishing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8DDD4] p-4 safe-area-pb">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 font-medium mb-3">
              <CheckCircle className="w-5 h-5" /> All listings published!
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-3 bg-[#F5EDE6] text-[#4A3F37] font-medium rounded-xl hover:bg-[#E8DDD4] transition-colors"
            >
              View My Listings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkListing;
