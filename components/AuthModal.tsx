import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { User } from '../types';
import { X, Smartphone, MessageSquare, Gift, AlertCircle, RefreshCw } from 'lucide-react';
import { sendOtp, verifyOtp, isMockAuthMode, getUserProfile } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [profile, setProfile] = useState({ name: '', zip: '', referralCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFakeNotification, setShowFakeNotification] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check URL for referral code on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setProfile(prev => ({ ...prev, referralCode: refCode.toUpperCase() }));
    }
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phone = value.replace(/[^\d]/g, '');
    const len = phone.length;
    if (len < 4) return phone;
    if (len < 7) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) return;

    setLoading(true);
    setError(null);

    try {
      await sendOtp(digits);
      setStep('otp');
      setResendCooldown(30); // 30 second cooldown for resend

      // Show mock notification in mock mode
      if (isMockAuthMode()) {
        setTimeout(() => setShowFakeNotification(true), 500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    try {
      const digits = phoneNumber.replace(/\D/g, '');
      await sendOtp(digits);
      setResendCooldown(30);

      if (isMockAuthMode()) {
        setShowFakeNotification(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;

    setLoading(true);
    setError(null);

    try {
      const digits = phoneNumber.replace(/\D/g, '');
      const { userId, isNewUser } = await verifyOtp(digits, otp);

      setAuthUserId(userId);
      setShowFakeNotification(false);

      if (isNewUser) {
        // New user - show profile form
        setStep('profile');
      } else {
        // Returning user - load profile and login directly
        const existingProfile = await getUserProfile(userId);
        if (existingProfile) {
          const user: User = {
            id: existingProfile.id,
            name: existingProfile.username || 'User',
            location: existingProfile.location_zip || '',
            isVerifiedParent: existingProfile.is_verified_parent || false,
            isPremium: existingProfile.is_premium || false,
            isAdmin: existingProfile.is_admin || false,
            joinDate: existingProfile.created_at,
            itemsSold: existingProfile.items_sold || 0,
            avatarUrl: existingProfile.avatar_url || '',
            bio: existingProfile.bio,
            email: existingProfile.email,
            savedListingIds: existingProfile.saved_listing_ids || [],
            savedSearches: existingProfile.saved_searches || [],
            followingIds: existingProfile.following_ids || [],
            stripeAccountId: existingProfile.stripe_account_id,
            stripeOnboarded: existingProfile.stripe_onboarded || false,
            referralCode: existingProfile.referral_code,
            referredBy: existingProfile.referred_by,
            referralCredit: existingProfile.referral_credit || 0,
            referralCount: existingProfile.referral_count || 0,
            neighborhood: existingProfile.neighborhood,
            kidAges: existingProfile.kid_ages || [],
            parentingTags: existingProfile.parenting_tags || []
          };
          login(user);
          onSuccess?.();
          onClose();
        } else {
          // Profile not found despite isNewUser=false, show profile form
          setStep('profile');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name || !profile.zip) return;

    // Use the auth user ID from verification, or generate one as fallback
    const userId = authUserId || `local-${Date.now()}`;

    const newUser: User = {
      id: userId,
      name: profile.name,
      location: profile.zip,
      isVerifiedParent: true,
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      itemsSold: 0,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`
    };

    // Pass referral code if provided
    login(newUser, profile.referralCode || undefined);
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    // Reset state when closing
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setProfile({ name: '', zip: '', referralCode: '' });
    setShowFakeNotification(false);
    setError(null);
    setAuthUserId(null);
    setResendCooldown(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Fake SMS Notification */}
      <div
        className={`absolute top-4 left-4 right-4 bg-gray-800/90 backdrop-blur text-white p-4 rounded-2xl shadow-2xl transition-all duration-500 transform z-50 cursor-pointer max-w-md mx-auto ${showFakeNotification ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}`}
        onClick={() => setOtp('123456')}
      >
        <div className="flex items-start gap-3 text-left">
          <div className="bg-green-500 p-2 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">Messages • Now</h4>
            <p className="text-sm text-gray-200">Your verification code is <span className="font-bold text-white text-lg">123456</span></p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setShowFakeNotification(false); }}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-gray-400 text-center">Tap to auto-fill</div>
      </div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#FFFCF9] rounded-t-3xl sm:rounded-3xl p-6 pb-8 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto shadow-warm-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#E8DDD4] text-[#4A3F37] hover:bg-[#D4C4B8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2 font-serif text-[#4A3F37]">Sign in to continue</h2>
            <p className="text-[#6B5D52] mb-8 text-sm">We'll text you a code to verify your account.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="relative mb-6">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D9B8C]" />
              <input
                autoFocus
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(555) 555-5555"
                className="w-full pl-12 pr-4 py-4 rounded-xl text-lg outline-none transition-all bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C]"
              />
            </div>

            <button
              disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
              className="w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 bg-[#4A3F37] text-white hover:bg-[#2D2622] transition-colors"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2 font-serif text-[#4A3F37]">Verify Code</h2>
            <p className="text-[#6B5D52] mb-6 text-sm">Enter the code we sent to {phoneNumber}</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <input
              autoFocus
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center tracking-[1em] py-4 rounded-xl text-2xl font-mono outline-none transition-all mb-6 bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C]"
            />

            <button
              disabled={loading || otp.length < 6}
              className="w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 bg-[#4A3F37] text-white hover:bg-[#2D2622] transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(null); }}
                className="text-[#B8A396] hover:text-[#6B5D52]"
              >
                Wrong number?
              </button>
              <span className="text-[#D4C4B8]">|</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-[#2D9B8C] hover:text-[#247A6F] disabled:text-[#B8A396] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 font-serif text-[#4A3F37]">Create Profile</h2>
              <p className="text-[#6B5D52] text-sm">Introduce yourself to other parents.</p>
            </div>

            <div className="space-y-4 mb-8 text-left">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#6B5D52]">First Name</label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="e.g. Sarah"
                  className="w-full p-4 rounded-xl outline-none bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#6B5D52]">Zip Code</label>
                <input
                  required
                  type="number"
                  maxLength={5}
                  value={profile.zip}
                  onChange={(e) => setProfile({...profile, zip: e.target.value})}
                  placeholder="e.g. 98001"
                  className="w-full p-4 rounded-xl outline-none bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C]"
                />
                <p className="text-xs text-[#B8A396] mt-2">We use this to find gear near you.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#6B5D52] flex items-center gap-1">
                  <Gift className="w-4 h-4 text-[#E8B44C]" />
                  Referral Code <span className="text-[#B8A396] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={profile.referralCode}
                  onChange={(e) => setProfile({...profile, referralCode: e.target.value.toUpperCase()})}
                  placeholder="e.g. ABC123"
                  className="w-full p-4 rounded-xl outline-none bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C] uppercase tracking-wider"
                />
                {profile.referralCode && (
                  <p className="text-xs text-[#2D9B8C] mt-2">Your friend will get $5 credit when you join!</p>
                )}
              </div>
            </div>

            <button
              className="w-full py-4 rounded-xl font-bold text-lg shadow-warm-lg bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors"
            >
              Finish Setup
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
