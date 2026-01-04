
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ComparisonResult, compareListings } from '../services/geminiService';
import { ChevronLeft, X, Sparkles, Loader2, Trophy, Scale, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Compare = () => {
  const navigate = useNavigate();
  const { compareIds, listings, clearCompare, toggleCompare } = useStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const selectedListings = listings.filter(l => compareIds.includes(l.id));

  useEffect(() => {
    if (selectedListings.length < 2) {
      // Don't auto fetch if not enough items
      setResult(null);
      return;
    }
    // Only fetch if we haven't already (simple caching for session)
    if (!result) {
      handleAnalyze();
    }
  }, [selectedListings.length]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const data = await compareListings(selectedListings);
      setResult(data);
    } catch (e) {
      showToast("Comparison failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (selectedListings.length === 0) {
    return (
       <div className="p-8 text-center min-h-full bg-white flex flex-col items-center justify-center">
         <Scale className="w-16 h-16 text-gray-200 mb-4" />
         <h2 className="text-xl font-bold text-gray-900 mb-2">Compare Queue Empty</h2>
         <p className="text-gray-500 mb-6">Select items from the home feed to compare them side-by-side.</p>
         <button onClick={() => navigate('/')} className="px-6 py-3 bg-[#2D9B8C] text-white rounded-xl font-bold">Go to Feed</button>
       </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 pb-20">
      <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="font-bold text-gray-900">Compare ({selectedListings.length})</h1>
        </div>
        <button onClick={clearCompare} className="text-sm text-red-600 font-medium">Clear All</button>
      </div>

      {/* Selected Items Strip */}
      <div className="p-4 grid grid-cols-3 gap-2">
        {selectedListings.map(item => (
          <div key={item.id} className="relative bg-white rounded-lg p-2 shadow-sm border border-gray-100">
             <button onClick={() => toggleCompare(item.id)} className="absolute -top-1 -right-1 bg-gray-200 rounded-full p-0.5 z-10">
               <X className="w-3 h-3 text-gray-600" />
             </button>
             <img src={item.images[0]} className="w-full h-20 object-cover rounded-md mb-2 bg-gray-100" />
             <div className="text-[10px] font-bold text-gray-900 line-clamp-1">{item.title}</div>
             <div className="text-xs text-[#2D9B8C] font-bold">${item.price}</div>
          </div>
        ))}
        
        {selectedListings.length < 2 && (
           <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-2 text-gray-400">
             <span className="text-xs text-center">Select 2+ items to enable AI comparison</span>
           </div>
        )}
      </div>

      {selectedListings.length >= 2 && !result && !loading && (
        <div className="p-4">
           <button onClick={handleAnalyze} className="w-full py-4 bg-[#2D9B8C] text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
             <Sparkles className="w-5 h-5" /> Analyze Differences
           </button>
        </div>
      )}

      {loading && (
        <div className="p-12 flex flex-col items-center justify-center text-gray-500">
           <Loader2 className="w-10 h-10 animate-spin text-[#2D9B8C] mb-4" />
           <p className="font-medium">Gemini is analyzing features...</p>
        </div>
      )}

      {result && (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-8">
           {/* Verdict Card */}
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg mb-6">
              <div className="flex items-start gap-3 mb-3">
                 <Trophy className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                 <div>
                   <h2 className="font-bold text-lg mb-1">AI Verdict</h2>
                   <p className="text-sm opacity-90 leading-relaxed">{result.verdict}</p>
                 </div>
              </div>
              
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
                {result.bestFor.map((tag, i) => (
                  <div key={i} className="bg-white/20 px-3 py-1 rounded-full text-xs whitespace-nowrap border border-white/10">
                    <span className="font-bold text-yellow-300 mr-1">#{i + 1}</span>
                    {tag}
                  </div>
                ))}
              </div>
           </div>

           {/* Comparison Table */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[1fr,1fr,1fr] bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 text-center divide-x divide-gray-200">
                 <div className="p-3">Feature</div>
                 <div className="p-3 text-gray-900 truncate px-1">{result.title1.split(' ').slice(0,2).join(' ')}</div>
                 <div className="p-3 text-gray-900 truncate px-1">{result.title2.split(' ').slice(0,2).join(' ')}</div>
              </div>

              {result.rows.map((row, idx) => (
                 <div key={idx} className="grid grid-cols-[1fr,1fr,1fr] text-xs divide-x divide-gray-100 border-b border-gray-100 last:border-0">
                    <div className="p-3 font-semibold text-gray-600 bg-gray-50/50 flex items-center">{row.feature}</div>
                    <div className={`p-3 text-center flex items-center justify-center ${row.winnerIndex === 0 ? 'bg-green-50 text-green-800 font-bold' : 'text-gray-800'}`}>
                       {row.item1Value}
                    </div>
                    <div className={`p-3 text-center flex items-center justify-center ${row.winnerIndex === 1 ? 'bg-green-50 text-green-800 font-bold' : 'text-gray-800'}`}>
                       {row.item2Value}
                    </div>
                 </div>
              ))}
           </div>
           
           <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 justify-center">
             <Info className="w-3 h-3" />
             Generated by AI based on listing descriptions & images.
           </div>
        </div>
      )}
    </div>
  );
};

export default Compare;
