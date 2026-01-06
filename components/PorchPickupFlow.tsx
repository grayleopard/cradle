import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  Check,
  MapPin,
  Clock,
  Home,
  AlertTriangle,
  Loader2,
  Navigation
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Transaction, TransactionStatus, PORCH_PICKUP_CONSTANTS } from '../types';
import { processImage } from '../utils/fileHelpers';
import { uploadToCloudinary } from '../services/cloudinaryService';
import {
  verifyGeofence,
  formatTimeRemaining,
  isPickupExpiringSoon,
  isPickupExpired
} from '../utils/schedulingHelpers';

interface PorchPickupFlowProps {
  transaction: Transaction;
  isBuyer: boolean;
  onDropOff: (photoUrl: string) => void;
  onPickUp: (photoUrl: string, locationVerified: boolean) => void;
  onConfirmReceipt: () => void;
  onReportIssue: () => void;
}

const PorchPickupFlow: React.FC<PorchPickupFlowProps> = ({
  transaction,
  isBuyer,
  onDropOff,
  onPickUp,
  onConfirmReceipt,
  onReportIssue
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update time remaining every minute
  useEffect(() => {
    if (transaction.porchPickup?.expiresAt) {
      const updateTime = () => {
        setTimeRemaining(formatTimeRemaining(transaction.porchPickup!.expiresAt!));
      };
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [transaction.porchPickup?.expiresAt]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const processed = await processImage(e.target.files[0]);
        setPhotoPreview(processed.previewUrl);
        setPhotoBlob(processed.blob);
      } catch (err) {
        showToast("Failed to capture photo", "error");
      }
    }
  };

  const handleVerifyLocation = async () => {
    if (!transaction.porchPickup?.sellerCoordinates) {
      showToast("Location not available", "error");
      return;
    }

    setCheckingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const result = verifyGeofence(
        position.coords.latitude,
        position.coords.longitude,
        transaction.porchPickup.sellerCoordinates.lat,
        transaction.porchPickup.sellerCoordinates.lng
      );

      if (result.verified) {
        setLocationVerified(true);
        showToast("Location verified! You're at the pickup spot.", "success");
      } else {
        setLocationError(`You're ${result.distanceMeters}m away. Please get within ${result.requiredRadiusMeters}m to verify.`);
      }
    } catch (error: any) {
      if (error.code === 1) {
        setLocationError("Location access denied. Please enable location services.");
      } else {
        setLocationError("Could not get your location. Please try again.");
      }
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleSellerDropOff = async () => {
    if (!photoBlob) {
      showToast("Please take a photo first", "error");
      return;
    }

    setUploading(true);
    try {
      const photoUrl = await uploadToCloudinary(photoBlob);
      onDropOff(photoUrl);
    } catch (error) {
      showToast("Failed to upload photo", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleBuyerPickUp = async () => {
    if (!photoBlob) {
      showToast("Please take a photo first", "error");
      return;
    }

    setUploading(true);
    try {
      const photoUrl = await uploadToCloudinary(photoBlob);
      onPickUp(photoUrl, locationVerified);
    } catch (error) {
      showToast("Failed to upload photo", "error");
    } finally {
      setUploading(false);
    }
  };

  // Seller view: Waiting to drop off
  if (!isBuyer && transaction.status === TransactionStatus.SCHEDULED) {
    return (
      <div className="bg-white rounded-2xl border-2 border-[#F59E0B] p-5 shadow-warm-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#FEF9E7] flex items-center justify-center">
            <Home className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-[#4A3F37]">
              Porch Pickup 🏠
            </h3>
            <p className="text-sm text-[#6B5D52]">
              Leave the item on your porch for pickup
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#FEF9E7] rounded-xl p-3 text-sm text-[#92400E]">
            <strong>Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
              <li>Place the item securely on your porch</li>
              <li>Take a clear photo showing the item and its condition</li>
              <li>The buyer will have 24 hours to pick up</li>
            </ol>
          </div>

          <div
            onClick={() => !photoPreview && fileInputRef.current?.click()}
            className={`h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${
              photoPreview ? 'border-[#F59E0B]' : 'border-[#E8DDD4] hover:border-[#F59E0B] hover:bg-[#FEF9E7]/50'
            }`}
          >
            {photoPreview ? (
              <>
                <img src={photoPreview} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); setPhotoPreview(null); setPhotoBlob(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-[#F59E0B] text-white text-xs text-center py-1.5 font-medium">
                  Drop-off Photo Ready
                </div>
              </>
            ) : (
              <div className="text-center text-[#B8A395]">
                <Camera className="w-10 h-10 mx-auto mb-2" />
                <span className="text-sm font-medium">Take Drop-off Photo</span>
                <span className="text-xs block mt-1">Show the item on your porch</span>
              </div>
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

          <button
            onClick={handleSellerDropOff}
            disabled={!photoPreview || uploading}
            className="w-full py-4 bg-[#F59E0B] text-white rounded-full font-semibold text-lg hover:bg-[#D97706] disabled:opacity-50 transition-colors shadow-warm-md flex items-center justify-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {uploading ? 'Uploading...' : 'Confirm Item is Ready'}
          </button>
        </div>
      </div>
    );
  }

  // Seller view: Waiting for buyer to pick up
  if (!isBuyer && transaction.status === TransactionStatus.READY_FOR_PICKUP) {
    const expiring = transaction.porchPickup?.expiresAt && isPickupExpiringSoon(transaction.porchPickup.expiresAt);

    return (
      <div className="bg-white rounded-2xl border border-[#E8DDD4] p-5 shadow-warm-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F5F3] flex items-center justify-center">
            <Clock className="w-6 h-6 text-[#2D9B8C]" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-[#4A3F37]">
              Waiting for Pickup
            </h3>
            <p className={`text-sm ${expiring ? 'text-[#F59E0B] font-medium' : 'text-[#6B5D52]'}`}>
              {timeRemaining}
            </p>
          </div>
        </div>

        {transaction.porchPickup?.dropOffPhotoUrl && (
          <div className="mb-4">
            <p className="text-xs text-[#6B5D52] mb-2">Your drop-off photo:</p>
            <img
              src={transaction.porchPickup.dropOffPhotoUrl}
              alt="Drop-off"
              className="w-full h-32 object-cover rounded-xl"
            />
          </div>
        )}

        <div className="bg-[#E8F5F3] rounded-xl p-3 text-sm text-[#247A6F]">
          The buyer has been notified. Funds will be released once they confirm pickup.
        </div>
      </div>
    );
  }

  // Buyer view: Ready to pick up
  if (isBuyer && transaction.status === TransactionStatus.READY_FOR_PICKUP) {
    const expiring = transaction.porchPickup?.expiresAt && isPickupExpiringSoon(transaction.porchPickup.expiresAt);
    const expired = transaction.porchPickup?.expiresAt && isPickupExpired(transaction.porchPickup.expiresAt);

    if (expired) {
      return (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="font-serif font-semibold text-red-700">
              Pickup Window Expired
            </h3>
          </div>
          <p className="text-sm text-red-600">
            The 24-hour pickup window has expired. Please contact the seller to rearrange.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border-2 border-[#2D9B8C] p-5 shadow-warm-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F5F3] flex items-center justify-center">
            <Home className="w-6 h-6 text-[#2D9B8C]" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-[#4A3F37]">
              Item Ready for Pickup! 🎉
            </h3>
            <p className={`text-sm ${expiring ? 'text-[#F59E0B] font-medium' : 'text-[#6B5D52]'}`}>
              {timeRemaining}
            </p>
          </div>
        </div>

        {/* Seller's drop-off photo */}
        {transaction.porchPickup?.dropOffPhotoUrl && (
          <div className="mb-4">
            <p className="text-xs text-[#6B5D52] mb-2">Seller's drop-off photo:</p>
            <img
              src={transaction.porchPickup.dropOffPhotoUrl}
              alt="Item at porch"
              className="w-full h-40 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Address */}
        <div className="bg-[#F5EDE6] rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-[#4A3F37]">
            <MapPin className="w-4 h-4 text-[#2D9B8C]" />
            <span className="font-medium">{transaction.porchPickup?.sellerAddress}</span>
          </div>
        </div>

        {/* Location verification */}
        {!locationVerified && (
          <div className="mb-4">
            <button
              onClick={handleVerifyLocation}
              disabled={checkingLocation}
              className="w-full py-3 bg-[#F5EDE6] text-[#4A3F37] rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#E8DDD4] transition-colors"
            >
              {checkingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {checkingLocation ? 'Checking location...' : 'Verify I\'m at Location'}
            </button>
            {locationError && (
              <p className="text-xs text-[#F59E0B] mt-2 text-center">{locationError}</p>
            )}
            <p className="text-xs text-[#B8A395] mt-2 text-center">
              Optional: Verify you're within {PORCH_PICKUP_CONSTANTS.GEOFENCE_RADIUS_METERS}m
            </p>
          </div>
        )}

        {locationVerified && (
          <div className="mb-4 bg-[#E8F5F3] rounded-xl p-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-[#2D9B8C]" />
            <span className="text-sm text-[#247A6F] font-medium">Location verified!</span>
          </div>
        )}

        {/* Photo capture */}
        <div className="space-y-4">
          <div
            onClick={() => !photoPreview && fileInputRef.current?.click()}
            className={`h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${
              photoPreview ? 'border-[#2D9B8C]' : 'border-[#E8DDD4] hover:border-[#2D9B8C] hover:bg-[#E8F5F3]/50'
            }`}
          >
            {photoPreview ? (
              <>
                <img src={photoPreview} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); setPhotoPreview(null); setPhotoBlob(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-[#2D9B8C] text-white text-xs text-center py-1.5 font-medium">
                  Pickup Photo Ready
                </div>
              </>
            ) : (
              <div className="text-center text-[#B8A395]">
                <Camera className="w-10 h-10 mx-auto mb-2" />
                <span className="text-sm font-medium">Take Pickup Photo</span>
                <span className="text-xs block mt-1">Show the item you're picking up</span>
              </div>
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

          <button
            onClick={handleBuyerPickUp}
            disabled={!photoPreview || uploading}
            className="w-full py-4 bg-[#2D9B8C] text-white rounded-full font-semibold text-lg hover:bg-[#247A6F] disabled:opacity-50 transition-colors shadow-warm-md flex items-center justify-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {uploading ? 'Uploading...' : 'Confirm Pickup'}
          </button>
        </div>
      </div>
    );
  }

  // Buyer view: Confirming receipt
  if (isBuyer && transaction.status === TransactionStatus.PICKED_UP) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8DDD4] p-5 shadow-warm-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F5F3] flex items-center justify-center">
            <Check className="w-6 h-6 text-[#2D9B8C]" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-[#4A3F37]">
              Confirm You Got the Item
            </h3>
            <p className="text-sm text-[#6B5D52]">
              Is everything as expected?
            </p>
          </div>
        </div>

        {transaction.porchPickup?.pickupPhotoUrl && (
          <div className="mb-4">
            <p className="text-xs text-[#6B5D52] mb-2">Your pickup photo:</p>
            <img
              src={transaction.porchPickup.pickupPhotoUrl}
              alt="Pickup"
              className="w-full h-32 object-cover rounded-xl"
            />
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onConfirmReceipt}
            className="w-full py-4 bg-[#2D9B8C] text-white rounded-full font-semibold hover:bg-[#247A6F] transition-colors shadow-warm-md"
          >
            Everything Looks Good! ✓
          </button>
          <button
            onClick={onReportIssue}
            className="w-full py-3 bg-red-50 text-red-600 rounded-full font-medium hover:bg-red-100 transition-colors"
          >
            Report an Issue
          </button>
        </div>
      </div>
    );
  }

  // Seller view: Waiting for buyer confirmation
  if (!isBuyer && transaction.status === TransactionStatus.PICKED_UP) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8DDD4] p-5 shadow-warm-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#FEF9E7] flex items-center justify-center">
            <Clock className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-[#4A3F37]">
              Buyer Has Picked Up
            </h3>
            <p className="text-sm text-[#6B5D52]">
              Waiting for them to confirm receipt
            </p>
          </div>
        </div>

        {transaction.porchPickup?.pickupPhotoUrl && (
          <div className="mb-4">
            <p className="text-xs text-[#6B5D52] mb-2">Buyer's pickup photo:</p>
            <img
              src={transaction.porchPickup.pickupPhotoUrl}
              alt="Pickup"
              className="w-full h-32 object-cover rounded-xl"
            />
          </div>
        )}

        <div className="bg-[#FEF9E7] rounded-xl p-3 text-sm text-[#92400E]">
          Funds will be released once the buyer confirms they received the item.
        </div>
      </div>
    );
  }

  return null;
};

export default PorchPickupFlow;
