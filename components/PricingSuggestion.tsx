import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, DollarSign, ChevronDown, ChevronUp, Loader2, Info, AlertCircle } from 'lucide-react';
import { getPricingSuggestion, PricingSuggestion } from '../services/geminiService';
import { useStore } from '../context/StoreContext';

interface PricingSuggestionProps {
  title: string;
  brand?: string;
  category: string;
  condition: string;
  originalPrice?: number;
  currentPrice: string;
  onPriceSelect: (price: number) => void;
}

const PricingSuggestionWidget: React.FC<PricingSuggestionProps> = ({
  title,
  brand,
  category,
  condition,
  originalPrice,
  currentPrice,
  onPriceSelect
}) => {
  const { listings } = useStore();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  // Find similar listings in the marketplace
  const getSimilarListings = () => {
    if (!title || title.length < 3) return [];

    const titleLower = title.toLowerCase();
    const words = titleLower.split(/\s+/).filter(w => w.length > 2);

    return listings
      .filter(l => !l.isSold && l.category === category)
      .filter(l => {
        const listingTitle = l.title.toLowerCase();
        // Match if brand matches or any significant word matches
        if (brand && l.brand?.toLowerCase() === brand.toLowerCase()) return true;
        return words.some(word => listingTitle.includes(word));
      })
      .slice(0, 5)
      .map(l => ({
        title: l.title,
        price: l.price,
        condition: l.condition
      }));
  };

  const fetchSuggestion = async () => {
    if (!title || !category || !condition) {
      setError('Fill in title, category, and condition first');
      return;
    }

    setLoading(true);
    setError(null);
    setHasRequested(true);

    try {
      const similarListings = getSimilarListings();
      const result = await getPricingSuggestion(
        title,
        brand,
        category,
        condition,
        originalPrice,
        similarListings
      );

      if (result) {
        setSuggestion(result);
        setExpanded(true);
      } else {
        setError('Could not generate pricing suggestion');
      }
    } catch (err) {
      console.error('Pricing suggestion error:', err);
      setError('AI pricing unavailable. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Reset when key fields change
  useEffect(() => {
    setSuggestion(null);
    setHasRequested(false);
    setError(null);
  }, [title, category, condition]);

  const currentPriceNum = parseFloat(currentPrice) || 0;
  const isCurrentPriceLow = suggestion && currentPriceNum < suggestion.priceRange.min;
  const isCurrentPriceHigh = suggestion && currentPriceNum > suggestion.priceRange.max;

  return (
    <div className="bg-gradient-to-br from-[#F0FAF8] to-[#F5EDE6] rounded-xl border border-[#E8DDD4] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => hasRequested ? setExpanded(!expanded) : fetchSuggestion()}
        disabled={loading}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#2D9B8C]/20">
            <Sparkles className="w-4 h-4 text-[#2D9B8C]" />
          </div>
          <div>
            <span className="font-medium text-sm text-[#4A3F37]">AI Pricing Suggestion</span>
            {suggestion && (
              <span className="ml-2 text-xs text-[#2D9B8C] font-bold">${suggestion.suggestedPrice}</span>
            )}
          </div>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 text-[#2D9B8C] animate-spin" />
        ) : hasRequested ? (
          expanded ? <ChevronUp className="w-4 h-4 text-[#9A8578]" /> : <ChevronDown className="w-4 h-4 text-[#9A8578]" />
        ) : (
          <span className="text-xs px-2 py-1 bg-[#2D9B8C] text-white rounded-full">Get Suggestion</span>
        )}
      </button>

      {/* Error State */}
      {error && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {suggestion && expanded && (
        <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2">
          {/* Price Options */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onPriceSelect(suggestion.quickSalePrice)}
              className="p-2 bg-white rounded-lg border border-[#E8DDD4] hover:border-[#2D9B8C] hover:bg-[#F0FAF8] transition-colors text-center group"
            >
              <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-[#4A3F37] group-hover:text-[#2D9B8C]">
                ${suggestion.quickSalePrice}
              </div>
              <div className="text-[10px] text-[#B8A395] uppercase">Quick Sale</div>
            </button>

            <button
              onClick={() => onPriceSelect(suggestion.suggestedPrice)}
              className="p-2 bg-[#2D9B8C]/10 rounded-lg border-2 border-[#2D9B8C] hover:bg-[#2D9B8C]/20 transition-colors text-center relative"
            >
              <TrendingUp className="w-4 h-4 text-[#2D9B8C] mx-auto mb-1" />
              <div className="text-lg font-bold text-[#2D9B8C]">
                ${suggestion.suggestedPrice}
              </div>
              <div className="text-[10px] text-[#247A6F] uppercase font-bold">Suggested</div>
              <div className="absolute -top-1.5 -right-1.5 bg-[#2D9B8C] text-white text-[8px] px-1.5 py-0.5 rounded-full">
                Best
              </div>
            </button>

            <button
              onClick={() => onPriceSelect(suggestion.priceRange.max)}
              className="p-2 bg-white rounded-lg border border-[#E8DDD4] hover:border-[#2D9B8C] hover:bg-[#F0FAF8] transition-colors text-center group"
            >
              <DollarSign className="w-4 h-4 text-[#C68E68] mx-auto mb-1" />
              <div className="text-lg font-bold text-[#4A3F37] group-hover:text-[#2D9B8C]">
                ${suggestion.priceRange.max}
              </div>
              <div className="text-[10px] text-[#B8A395] uppercase">Premium</div>
            </button>
          </div>

          {/* Price Range Slider Visualization */}
          <div className="bg-white rounded-lg p-3 border border-[#E8DDD4]">
            <div className="flex items-center justify-between text-xs text-[#6B5D52] mb-2">
              <span>${suggestion.priceRange.min}</span>
              <span className="font-medium">Price Range</span>
              <span>${suggestion.priceRange.max}</span>
            </div>
            <div className="relative h-2 bg-[#F5EDE6] rounded-full">
              <div
                className="absolute h-full bg-gradient-to-r from-[#2D9B8C]/50 to-[#2D9B8C] rounded-full"
                style={{
                  left: '0%',
                  width: '100%'
                }}
              />
              {/* Current price marker */}
              {currentPriceNum > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#4A3F37] rounded-full shadow-sm transition-all"
                  style={{
                    left: `${Math.min(100, Math.max(0, ((currentPriceNum - suggestion.priceRange.min) / (suggestion.priceRange.max - suggestion.priceRange.min)) * 100))}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              )}
            </div>
            {currentPriceNum > 0 && (
              <div className="mt-2 text-center">
                {isCurrentPriceLow && (
                  <span className="text-xs text-yellow-600 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Your price is below market range
                  </span>
                )}
                {isCurrentPriceHigh && (
                  <span className="text-xs text-red-500 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Your price is above market range
                  </span>
                )}
                {!isCurrentPriceLow && !isCurrentPriceHigh && currentPriceNum > 0 && (
                  <span className="text-xs text-green-600">✓ Your price is within range</span>
                )}
              </div>
            )}
          </div>

          {/* Reasoning */}
          <div className="bg-white rounded-lg p-3 border border-[#E8DDD4]">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#2D9B8C] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#6B5D52] leading-relaxed">{suggestion.reasoning}</p>
            </div>
          </div>

          {/* Market Insights */}
          {suggestion.marketInsights && suggestion.marketInsights.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-[#B8A395] uppercase font-bold px-1">Market Tips</p>
              <div className="space-y-1">
                {suggestion.marketInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#6B5D52] bg-white/50 rounded-lg p-2">
                    <span className="text-[#2D9B8C]">💡</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Listings */}
          {suggestion.similarListings && suggestion.similarListings.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-[#B8A395] uppercase font-bold px-1">Similar on Pipit</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {suggestion.similarListings.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex-shrink-0 bg-white rounded-lg p-2 border border-[#E8DDD4] min-w-[120px]">
                    <p className="text-xs text-[#4A3F37] font-medium line-clamp-1">{item.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-[#2D9B8C]">${item.price}</span>
                      <span className="text-[10px] text-[#B8A395]">{item.condition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PricingSuggestionWidget;
