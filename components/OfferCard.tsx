import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Offer, OfferStatus } from '../types';
import { Tag, Check, X, MessageCircle, DollarSign, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OfferCardProps {
  offer: Offer;
  onRespond?: () => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onRespond }) => {
  const navigate = useNavigate();
  const { getListingById, getUserById, respondToOffer, createTransaction, sendMessage, startConversation } = useStore();
  const { showToast } = useToast();

  const [showCounterInput, setShowCounterInput] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const listing = getListingById(offer.listingId);
  const buyer = getUserById(offer.buyerId);

  if (!listing || !buyer) return null;

  const timeLeft = () => {
    const expires = new Date(offer.expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours >= 1) return `${hours}h left`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m left`;
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await respondToOffer(offer.id, 'accept');

      // Create transaction at offered price
      const txId = await createTransaction(offer.listingId, offer.id, offer.amount);

      // Notify buyer in chat
      const conversationId = await startConversation(offer.listingId);
      sendMessage(conversationId, `✅ I've accepted your offer of $${offer.amount}! Let's proceed with the transaction.`);

      showToast('Offer accepted! Transaction started.', 'success');
      onRespond?.();
      navigate(`/transaction/${txId}`);
    } catch (e) {
      showToast('Failed to accept offer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await respondToOffer(offer.id, 'decline');

      // Notify buyer
      const conversationId = await startConversation(offer.listingId);
      sendMessage(conversationId, `I'm not able to accept $${offer.amount} for this item. Feel free to make another offer or buy at the listed price!`);

      showToast('Offer declined', 'info');
      onRespond?.();
    } catch (e) {
      showToast('Failed to decline offer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = async () => {
    if (!counterAmount) return;

    const amount = parseInt(counterAmount);
    if (isNaN(amount) || amount <= offer.amount || amount >= listing.price) {
      showToast('Counter must be between offer and asking price', 'error');
      return;
    }

    setLoading(true);
    try {
      await respondToOffer(offer.id, 'counter', amount);

      // Notify buyer
      const conversationId = await startConversation(offer.listingId);
      sendMessage(conversationId, `💬 I've countered your offer of $${offer.amount} with $${amount}. Let me know if that works for you!`);

      showToast('Counter offer sent!', 'success');
      setShowCounterInput(false);
      onRespond?.();
    } catch (e) {
      showToast('Failed to send counter offer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPending = offer.status === OfferStatus.PENDING;
  const savingsPercent = Math.round((1 - offer.amount / listing.price) * 100);

  return (
    <div className="bg-white rounded-xl border border-[#E8DDD4] overflow-hidden shadow-warm-sm">
      {/* Header */}
      <div className="p-4 border-b border-[#F5EDE6]">
        <div className="flex items-center gap-3">
          <img
            src={buyer.avatarUrl}
            alt={buyer.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#4A3F37] text-sm truncate">{buyer.name}</p>
            <p className="text-xs text-[#6B5D52] truncate">{listing.title}</p>
          </div>
          {isPending && (
            <div className="flex items-center gap-1 text-[#2D9B8C] text-xs">
              <Clock className="w-3 h-3" />
              {timeLeft()}
            </div>
          )}
        </div>
      </div>

      {/* Offer Details */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#2D9B8C]" />
              <span className="text-2xl font-bold text-[#4A3F37] font-mono">${offer.amount}</span>
            </div>
            <p className="text-xs text-[#6B5D52] mt-0.5">
              {savingsPercent}% off your ${listing.price} asking price
            </p>
          </div>
          {offer.status !== OfferStatus.PENDING && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              offer.status === OfferStatus.ACCEPTED ? 'bg-green-100 text-green-800' :
              offer.status === OfferStatus.COUNTERED ? 'bg-[#E8B44C]/20 text-[#946518]' :
              offer.status === OfferStatus.DECLINED ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {offer.status === OfferStatus.ACCEPTED ? 'Accepted' :
               offer.status === OfferStatus.COUNTERED ? `Countered: $${offer.counterAmount}` :
               offer.status === OfferStatus.DECLINED ? 'Declined' :
               offer.status}
            </span>
          )}
        </div>

        {offer.message && (
          <div className="bg-[#FFFCF9] rounded-lg p-3 mb-4 border border-[#F5EDE6]">
            <p className="text-sm text-[#6B5D52] italic">"{offer.message}"</p>
          </div>
        )}

        {/* Action Buttons - Only show for pending offers */}
        {isPending && (
          <>
            {showCounterInput ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A3F37]">$</span>
                    <input
                      type="number"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      placeholder={Math.round((offer.amount + listing.price) / 2).toString()}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E8DDD4] text-[#4A3F37] focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]"
                    />
                  </div>
                  <button
                    onClick={handleCounter}
                    disabled={loading}
                    className="px-4 py-2 bg-[#2D9B8C] text-white rounded-lg font-medium hover:bg-[#247A6F] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                  </button>
                  <button
                    onClick={() => setShowCounterInput(false)}
                    className="p-2 text-[#B8A396] hover:text-[#6B5D52]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-[#B8A396]">
                  Counter between ${offer.amount + 1} and ${listing.price - 1}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="flex items-center justify-center gap-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Accept</>}
                </button>
                <button
                  onClick={() => setShowCounterInput(true)}
                  className="flex items-center justify-center gap-1 py-2.5 bg-[#F5EDE6] text-[#4A3F37] rounded-lg font-medium hover:bg-[#E8DDD4] transition-colors"
                >
                  <DollarSign className="w-4 h-4" /> Counter
                </button>
                <button
                  onClick={handleDecline}
                  disabled={loading}
                  className="flex items-center justify-center gap-1 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4" /> Decline</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OfferCard;
