
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkProductSafety } from '../services/geminiService';
import { processImage } from '../utils/fileHelpers';
import { ChevronLeft, Camera, Loader2, ShieldCheck, AlertTriangle, Upload, ScanLine, ExternalLink, Globe } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { SafetyCheckResult } from '../types';

const SafetyCheck = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<{ base64: string; previewUrl: string; mimeType: string } | null>(null);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<SafetyCheckResult | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const processed = await processImage(e.target.files[0]);
        // We only need the base64/preview for this specific check page, not the blob
        setImage({
            base64: processed.base64,
            previewUrl: processed.previewUrl,
            mimeType: processed.mimeType
        });
        setResult(null); 
      } catch (err) {
        showToast('Failed to process image', 'error');
      }
    }
  };

  const handleCheck = async () => {
    if (!description && !image) {
      showToast('Please provide a description or photo', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await checkProductSafety(
        "Unknown Item", 
        description,
        image?.base64,
        image?.mimeType
      );
      setResult(response);
    } catch (err) {
      showToast('Safety check failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-white flex flex-col">
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="font-bold text-gray-900">Recall Checker</h1>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {!result ? (
          <div className="max-w-md mx-auto animate-in fade-in duration-500">
            <div className="bg-[#F0FAF8] rounded-2xl p-6 text-center mb-8">
               <ScanLine className="w-12 h-12 text-[#2D9B8C] mx-auto mb-3" />
               <h2 className="text-xl font-bold text-gray-900 mb-2">Is your gear safe?</h2>
               <p className="text-sm text-gray-600">
                 Upload a photo or describe an item. We use Google Search to check the latest CPSC recall database.
               </p>
            </div>

            <div className="space-y-6">
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${image ? 'border-[#2D9B8C] bg-[#F0FAF8]/30' : 'border-gray-200 hover:bg-gray-50'}`}
               >
                 {image ? (
                   <div className="relative w-full h-48">
                     <img src={image.previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 hover:opacity-100 transition-opacity text-white font-medium">
                       Change Photo
                     </div>
                   </div>
                 ) : (
                   <>
                     <Camera className="w-8 h-8 text-gray-400 mb-2" />
                     <span className="text-sm font-medium text-gray-600">Take Photo / Upload</span>
                   </>
                 )}
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleImageSelect} 
                   accept="image/*" 
                   className="hidden" 
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Item Name / Description
                 </label>
                 <textarea
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="e.g. Fisher Price Rock 'n Play Sleeper"
                   className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] h-24"
                 />
               </div>

               <button
                 onClick={handleCheck}
                 disabled={loading || (!image && !description)}
                 className="w-full py-4 bg-[#2D9B8C] text-white font-bold rounded-xl shadow-lg hover:bg-[#247A6F] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
               >
                 {loading ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" />
                     Searching Recalls...
                   </>
                 ) : (
                   'Check Safety'
                 )}
               </button>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-300">
             <div className={`p-6 rounded-2xl mb-6 text-center ${result.isSafe ? 'bg-green-50' : 'bg-red-50'}`}>
                {result.isSafe ? (
                  <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                )}
                
                <h2 className={`text-2xl font-bold mb-2 ${result.isSafe ? 'text-green-800' : 'text-red-800'}`}>
                  {result.isSafe ? 'No Recalls Found' : 'Safety Warning'}
                </h2>
                <p className={`text-sm ${result.isSafe ? 'text-green-700' : 'text-red-700'}`}>
                  {result.reason}
                </p>
             </div>

             {/* Grounding Sources */}
             {result.sources && result.sources.length > 0 && (
               <div className="bg-white border border-gray-200 p-4 rounded-xl mb-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" /> Verified Sources
                  </h3>
                  <div className="space-y-2">
                    {result.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <span className="text-xs text-gray-600 truncate flex-1 pr-2">{source.title}</span>
                        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                      </a>
                    ))}
                  </div>
               </div>
             )}

             <div className="bg-gray-50 p-4 rounded-xl mb-6">
               <h3 className="text-sm font-bold text-gray-900 mb-2">Analyzed Details:</h3>
               <p className="text-sm text-gray-600 italic">"{description || 'Image Analysis'}"</p>
             </div>

             <button 
               onClick={() => { setResult(null); setImage(null); setDescription(''); }}
               className="w-full py-4 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-all"
             >
               Check Another Item
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafetyCheck;
