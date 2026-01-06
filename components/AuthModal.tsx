import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { User } from '../types';
import { X, Smartphone, MessageSquare, Gift, AlertCircle, RefreshCw, Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { sendOtp, verifyOtp, isMockAuthMode, getUserProfile, signInWithEmail, signUpWithEmail, isEmailAuthAvailable, resetPassword, signInWithGoogle, signInWithFacebook, isOAuthAvailable } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useStore();

  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'phone' | 'otp' | 'email' | 'profile' | 'forgot_password'>('phone');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [profile, setProfile] = useState({ name: '', zip: '', referralCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFakeNotification, setShowFakeNotification] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);

  // Handle OAuth sign in
  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider);
    setError(null);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithFacebook();
      }
      // Will redirect to provider, so no need to handle success here
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
      setOauthLoading(null);
    }
  };

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

  // Handle email auth submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (isSignUp) {
        result = await signUpWithEmail(email, password);
      } else {
        result = await signInWithEmail(email, password);
      }

      setAuthUserId(result.userId);

      if (result.isNewUser) {
        setStep('profile');
      } else {
        const existingProfile = await getUserProfile(result.userId);
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
          setStep('profile');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setAuthMethod('phone');
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setIsSignUp(false);
    setProfile({ name: '', zip: '', referralCode: '' });
    setShowFakeNotification(false);
    setError(null);
    setAuthUserId(null);
    setResendCooldown(0);
    setResetEmailSent(false);
    onClose();
  };

  // Handle forgot password submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <h2 className="text-2xl font-bold mb-2 font-serif text-[#4A3F37]">👋 Welcome to pipit</h2>
            <p className="text-[#6B5D52] mb-6 text-sm">We'll text you a code to verify your account.</p>

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
              className="w-full py-4 rounded-full font-bold text-lg disabled:opacity-50 bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors shadow-warm-md"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>

            <p className="mt-4 text-xs text-center text-[#B8A395]">
              By continuing, you agree to our{' '}
              <Link to="/terms" onClick={handleClose} className="text-[#2D9B8C] hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" onClick={handleClose} className="text-[#2D9B8C] hover:underline">
                Privacy Policy
              </Link>
            </p>

            {/* OAuth Options */}
            {isOAuthAvailable() && (
              <div className="mt-6 pt-4 border-t border-[#E8DDD4]">
                <p className="text-xs text-center text-[#9A8578] mb-3">Or continue with</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={!!oauthLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-[#E8DDD4] rounded-xl hover:bg-[#F5EDE6] transition-colors disabled:opacity-50"
                  >
                    {oauthLoading === 'google' ? (
                      <RefreshCw className="w-5 h-5 text-[#6B5D52] animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span className="text-sm font-medium text-[#4A3F37]">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('facebook')}
                    disabled={!!oauthLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-[#E8DDD4] rounded-xl hover:bg-[#F5EDE6] transition-colors disabled:opacity-50"
                  >
                    {oauthLoading === 'facebook' ? (
                      <RefreshCw className="w-5 h-5 text-[#6B5D52] animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    <span className="text-sm font-medium text-[#4A3F37]">Facebook</span>
                  </button>
                </div>
              </div>
            )}

            {isEmailAuthAvailable() && (
              <div className="mt-4 pt-4 border-t border-[#E8DDD4]">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[#6B5D52] hover:text-[#4A3F37] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Continue with email instead
                </button>
              </div>
            )}
          </form>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2 font-serif text-[#4A3F37]">
              {isSignUp ? '🎉 Create Account' : '👋 Welcome Back'}
            </h2>
            <p className="text-[#6B5D52] mb-6 text-sm">
              {isSignUp ? 'Sign up with your email and password.' : 'Sign in to your account.'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D9B8C]" />
                <input
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-lg outline-none transition-all bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C]"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D9B8C]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-4 rounded-xl text-lg outline-none transition-all bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8A395] hover:text-[#6B5D52]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              disabled={loading || !email || !password}
              className="w-full py-4 rounded-full font-bold text-lg disabled:opacity-50 bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors shadow-warm-md"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <p className="mt-4 text-xs text-center text-[#B8A395]">
              By continuing, you agree to our{' '}
              <Link to="/terms" onClick={handleClose} className="text-[#2D9B8C] hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" onClick={handleClose} className="text-[#2D9B8C] hover:underline">
                Privacy Policy
              </Link>
            </p>

            <div className="mt-4 flex flex-col gap-3 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#2D9B8C] hover:text-[#247A6F]"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => { setStep('forgot_password'); setError(null); setResetEmailSent(false); }}
                  className="text-[#B8A395] hover:text-[#6B5D52] transition-colors"
                >
                  Forgot your password?
                </button>
              )}

              <button
                type="button"
                onClick={() => { setStep('phone'); setError(null); }}
                className="flex items-center justify-center gap-2 text-[#B8A395] hover:text-[#6B5D52] transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                Use phone number instead
              </button>
            </div>
          </form>
        )}

        {step === 'forgot_password' && (
          <div className="animate-in fade-in duration-300">
            {!resetEmailSent ? (
              <form onSubmit={handleForgotPasswordSubmit}>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); }}
                  className="flex items-center gap-1 text-sm text-[#B8A395] hover:text-[#6B5D52] mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>

                <h2 className="text-2xl font-bold mb-2 font-serif text-[#4A3F37]">Reset Password</h2>
                <p className="text-[#6B5D52] mb-6 text-sm">
                  Enter your email and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="relative mb-6">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D9B8C]" />
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-lg outline-none transition-all bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C]"
                  />
                </div>

                <button
                  disabled={loading || !email}
                  className="w-full py-4 rounded-full font-bold text-lg disabled:opacity-50 bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors shadow-warm-md"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[#2D9B8C]" />
                </div>
                <h2 className="text-2xl font-bold mb-2 font-serif text-[#4A3F37]">Check Your Email</h2>
                <p className="text-[#6B5D52] mb-6 text-sm">
                  We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
                </p>
                <p className="text-xs text-[#B8A395] mb-6">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setResetEmailSent(false); setError(null); }}
                    className="w-full py-3 rounded-full font-medium text-[#2D9B8C] border border-[#2D9B8C] hover:bg-[#F0FAF8] transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => { setStep('email'); setResetEmailSent(false); setError(null); }}
                    className="text-sm text-[#B8A395] hover:text-[#6B5D52]"
                  >
                    Back to sign in
                  </button>
                </div>
              </div>
            )}
          </div>
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
              className="w-full py-4 rounded-full font-bold text-lg disabled:opacity-50 bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors shadow-warm-md"
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
              <h2 className="text-2xl font-bold mb-2 font-serif text-[#4A3F37]">🎉 Almost there!</h2>
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
              className="w-full py-4 rounded-full font-bold text-lg shadow-warm-lg bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors"
            >
              Get Started
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
