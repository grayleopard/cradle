import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Home,
  Shield,
  Check,
  Loader2,
  Info
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  UserAvailability,
  MatchedTimeSlot,
  SafeMeetupLocation,
  ExchangeType,
  DEFAULT_AVAILABILITY
} from '../types';
import {
  findMatchingTimeSlots,
  getSuggestedLocations,
  SAFE_MEETUP_LOCATIONS,
  createDefaultAvailability
} from '../utils/schedulingHelpers';

interface SchedulePickerProps {
  buyerId: string;
  sellerId: string;
  buyerZip: string;
  sellerZip: string;
  sellerPorchEnabled?: boolean;
  onScheduleConfirmed: (schedule: {
    exchangeType: ExchangeType;
    date?: string;
    timeSlot?: string;
    location?: SafeMeetupLocation;
    porchAddress?: string;
  }) => void;
  onCancel: () => void;
}

type Step = 'type' | 'time' | 'location' | 'confirm';

const SchedulePicker: React.FC<SchedulePickerProps> = ({
  buyerId,
  sellerId,
  buyerZip,
  sellerZip,
  sellerPorchEnabled = false,
  onScheduleConfirmed,
  onCancel
}) => {
  const { getUserById } = useStore();
  const buyer = getUserById(buyerId);
  const seller = getUserById(sellerId);

  const [step, setStep] = useState<Step>('type');
  const [exchangeType, setExchangeType] = useState<ExchangeType | null>(null);
  const [matchedSlots, setMatchedSlots] = useState<MatchedTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MatchedTimeSlot | null>(null);
  const [suggestedLocations, setSuggestedLocations] = useState<{
    location: SafeMeetupLocation;
    distanceFromBuyer: number;
    distanceFromSeller: number;
    isMidpoint: boolean;
  }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SafeMeetupLocation | null>(null);
  const [loading, setLoading] = useState(false);

  // Load availability and compute matches
  useEffect(() => {
    if (exchangeType === ExchangeType.IN_PERSON) {
      setLoading(true);

      // Load buyer and seller availability from localStorage
      const buyerAvailStr = localStorage.getItem(`availability_${buyerId}`);
      const sellerAvailStr = localStorage.getItem(`availability_${sellerId}`);

      const buyerAvailability: UserAvailability = buyerAvailStr
        ? JSON.parse(buyerAvailStr)
        : createDefaultAvailability(buyerId);

      const sellerAvailability: UserAvailability = sellerAvailStr
        ? JSON.parse(sellerAvailStr)
        : createDefaultAvailability(sellerId);

      // Find matching time slots
      const matches = findMatchingTimeSlots(buyerAvailability, sellerAvailability);
      setMatchedSlots(matches);

      // Get location suggestions
      const locations = getSuggestedLocations(buyerZip, sellerZip);
      setSuggestedLocations(locations);

      setLoading(false);
      setStep('time');
    }
  }, [exchangeType, buyerId, sellerId, buyerZip, sellerZip]);

  const handleSelectExchangeType = (type: ExchangeType) => {
    setExchangeType(type);
    if (type === ExchangeType.PORCH_PICKUP) {
      // Skip straight to confirm for porch pickup
      setStep('confirm');
    }
  };

  const handleSelectSlot = (slot: MatchedTimeSlot) => {
    setSelectedSlot(slot);
    setStep('location');
  };

  const handleSelectLocation = (location: SafeMeetupLocation) => {
    setSelectedLocation(location);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (exchangeType === ExchangeType.PORCH_PICKUP) {
      onScheduleConfirmed({
        exchangeType: ExchangeType.PORCH_PICKUP,
        porchAddress: seller?.porchPickupAddress
      });
    } else if (exchangeType === ExchangeType.IN_PERSON && selectedSlot && selectedLocation) {
      onScheduleConfirmed({
        exchangeType: ExchangeType.IN_PERSON,
        date: selectedSlot.date,
        timeSlot: selectedSlot.displayTime,
        location: selectedLocation
      });
    }
  };

  const renderExchangeTypeSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-serif text-xl font-semibold text-[#4A3F37]">
          How do you want to exchange? 📅
        </h3>
        <p className="text-sm text-[#6B5D52] mt-1">
          Choose the option that works best for you
        </p>
      </div>

      <button
        onClick={() => handleSelectExchangeType(ExchangeType.IN_PERSON)}
        className="w-full p-4 bg-white rounded-2xl border border-[#E8DDD4] hover:border-[#2D9B8C] hover:shadow-warm-md transition-all text-left group"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F5F3] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2D9B8C] transition-colors">
            <Calendar className="w-6 h-6 text-[#2D9B8C] group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-[#4A3F37] mb-1">
              Meet in Person
            </h4>
            <p className="text-sm text-[#6B5D52]">
              Schedule a time that works for both of you at a safe meetup spot
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-[#E8F5F3] text-[#2D9B8C] px-2 py-0.5 rounded-full">
                🛡️ Safe zones
              </span>
              <span className="text-xs bg-[#F5EDE6] text-[#6B5D52] px-2 py-0.5 rounded-full">
                Inspect before paying
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#B8A395] group-hover:text-[#2D9B8C] transition-colors" />
        </div>
      </button>

      {sellerPorchEnabled && (
        <button
          onClick={() => handleSelectExchangeType(ExchangeType.PORCH_PICKUP)}
          className="w-full p-4 bg-white rounded-2xl border border-[#E8DDD4] hover:border-[#F59E0B] hover:shadow-warm-md transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FEF9E7] flex items-center justify-center flex-shrink-0 group-hover:bg-[#F59E0B] transition-colors">
              <Home className="w-6 h-6 text-[#F59E0B] group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[#4A3F37] mb-1">
                Porch Pickup 🏠
              </h4>
              <p className="text-sm text-[#6B5D52]">
                Pick up from {seller?.name?.split(' ')[0]}'s porch when convenient
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-[#FEF9E7] text-[#92400E] px-2 py-0.5 rounded-full">
                  📍 No scheduling needed
                </span>
                <span className="text-xs bg-[#F5EDE6] text-[#6B5D52] px-2 py-0.5 rounded-full">
                  24h window
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#B8A395] group-hover:text-[#F59E0B] transition-colors" />
          </div>
        </button>
      )}

      <button
        onClick={onCancel}
        className="w-full py-3 text-[#6B5D52] text-sm hover:text-[#4A3F37] transition-colors"
      >
        Cancel
      </button>
    </div>
  );

  const renderTimeSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-serif text-xl font-semibold text-[#4A3F37]">
          Pick a Time ⏰
        </h3>
        <p className="text-sm text-[#6B5D52] mt-1">
          These times work for both of you
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D9B8C] mx-auto mb-3" />
          <p className="text-sm text-[#6B5D52]">Finding matching times...</p>
        </div>
      ) : matchedSlots.length > 0 ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {matchedSlots.slice(0, 10).map((slot, index) => (
            <button
              key={index}
              onClick={() => handleSelectSlot(slot)}
              className="w-full p-3 bg-white rounded-xl border border-[#E8DDD4] hover:border-[#2D9B8C] hover:bg-[#E8F5F3] transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5EDE6] flex items-center justify-center group-hover:bg-[#2D9B8C] transition-colors">
                  <Clock className="w-5 h-5 text-[#6B5D52] group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-[#4A3F37]">
                  {slot.displayTime}
                </span>
                <ChevronRight className="w-4 h-4 text-[#B8A395] ml-auto group-hover:text-[#2D9B8C]" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center bg-[#F5EDE6] rounded-xl">
          <Calendar className="w-10 h-10 text-[#B8A395] mx-auto mb-3" />
          <h4 className="font-medium text-[#4A3F37] mb-1">No matching times found</h4>
          <p className="text-sm text-[#6B5D52] max-w-xs mx-auto">
            Update your availability in settings or message the seller to coordinate
          </p>
        </div>
      )}

      <button
        onClick={() => { setExchangeType(null); setStep('type'); }}
        className="w-full py-3 text-[#6B5D52] text-sm hover:text-[#4A3F37] transition-colors"
      >
        Back
      </button>
    </div>
  );

  const renderLocationSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-serif text-xl font-semibold text-[#4A3F37]">
          Choose a Location 📍
        </h3>
        <p className="text-sm text-[#6B5D52] mt-1">
          Safe meetup spots between you
        </p>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {suggestedLocations.map((suggestion, index) => (
          <button
            key={suggestion.location.id}
            onClick={() => handleSelectLocation(suggestion.location)}
            className="w-full p-3 bg-white rounded-xl border border-[#E8DDD4] hover:border-[#2D9B8C] hover:bg-[#E8F5F3] transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                suggestion.isMidpoint ? 'bg-[#E8F5F3]' : 'bg-[#F5EDE6]'
              } group-hover:bg-[#2D9B8C] transition-colors`}>
                {suggestion.location.type === 'police_station' ? (
                  <Shield className="w-5 h-5 text-[#2D9B8C] group-hover:text-white transition-colors" />
                ) : (
                  <MapPin className="w-5 h-5 text-[#6B5D52] group-hover:text-white transition-colors" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#4A3F37] text-sm truncate">
                    {suggestion.location.name}
                  </span>
                  {suggestion.isMidpoint && (
                    <span className="text-[10px] bg-[#E8F5F3] text-[#2D9B8C] px-1.5 py-0.5 rounded-full flex-shrink-0">
                      Midpoint
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B5D52] truncate">
                  {suggestion.location.address}, {suggestion.location.city}
                </p>
                <p className="text-xs text-[#B8A395] mt-0.5">
                  {suggestion.distanceFromBuyer}mi from you • {suggestion.distanceFromSeller}mi from seller
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#B8A395] group-hover:text-[#2D9B8C] flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setStep('time')}
        className="w-full py-3 text-[#6B5D52] text-sm hover:text-[#4A3F37] transition-colors"
      >
        Back
      </button>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-16 h-16 rounded-full bg-[#E8F5F3] flex items-center justify-center mx-auto mb-3">
          <Check className="w-8 h-8 text-[#2D9B8C]" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-[#4A3F37]">
          Confirm Exchange
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DDD4] overflow-hidden">
        {exchangeType === ExchangeType.PORCH_PICKUP ? (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                <Home className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h4 className="font-medium text-[#4A3F37]">Porch Pickup</h4>
                <p className="text-xs text-[#6B5D52]">Pick up when ready</p>
              </div>
            </div>
            <div className="bg-[#FEF9E7] rounded-xl p-3 text-sm">
              <p className="text-[#92400E]">
                After payment, the seller will leave the item on their porch. You'll have 24 hours to pick it up and confirm receipt.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F5F3] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#2D9B8C]" />
              </div>
              <div>
                <h4 className="font-medium text-[#4A3F37]">When</h4>
                <p className="text-sm text-[#6B5D52]">{selectedSlot?.displayTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F5F3] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#2D9B8C]" />
              </div>
              <div>
                <h4 className="font-medium text-[#4A3F37]">Where</h4>
                <p className="text-sm text-[#6B5D52]">
                  {selectedLocation?.name}
                </p>
                <p className="text-xs text-[#B8A395]">
                  {selectedLocation?.address}, {selectedLocation?.city}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-[#E8F5F3] rounded-xl">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[#2D9B8C] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#247A6F]">
            {exchangeType === ExchangeType.PORCH_PICKUP
              ? "Funds stay in escrow until you confirm pickup"
              : "You'll both receive reminders before the meetup"
            }
          </p>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full py-4 bg-[#2D9B8C] text-white rounded-full font-semibold text-lg hover:bg-[#247A6F] transition-colors shadow-warm-md"
      >
        Confirm Exchange
      </button>

      <button
        onClick={() => setStep(exchangeType === ExchangeType.PORCH_PICKUP ? 'type' : 'location')}
        className="w-full py-3 text-[#6B5D52] text-sm hover:text-[#4A3F37] transition-colors"
      >
        Back
      </button>
    </div>
  );

  return (
    <div className="bg-[#FFFCF9] rounded-2xl p-6 max-w-md mx-auto">
      {step === 'type' && renderExchangeTypeSelection()}
      {step === 'time' && renderTimeSelection()}
      {step === 'location' && renderLocationSelection()}
      {step === 'confirm' && renderConfirmation()}
    </div>
  );
};

export default SchedulePicker;
