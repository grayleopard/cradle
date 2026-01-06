import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, getUserProfile } from '../services/supabase';
import { useStore } from '../context/StoreContext';
import { User } from '../types';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

type CallbackStatus = 'loading' | 'success' | 'error' | 'needs_profile';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useStore();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash fragment for auth tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params (some Supabase versions use these)
        const errorCode = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorCode) {
          setStatus('error');
          setErrorMessage(errorDescription || 'Authentication failed');
          return;
        }

        if (!supabase) {
          setStatus('error');
          setErrorMessage('Authentication service not available');
          return;
        }

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }

          if (data.user) {
            // Check for existing profile
            const existingProfile = await getUserProfile(data.user.id);

            if (existingProfile) {
              // Existing user - log them in
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
                emailVerified: true,
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
              setStatus('success');
              setMessage(type === 'recovery' ? 'Password reset successful!' : 'Email verified successfully!');

              // Redirect after a moment
              setTimeout(() => {
                navigate(type === 'recovery' ? '/auth/reset-password' : '/', { replace: true });
              }, 2000);
            } else {
              // New user - need to complete profile
              setStatus('needs_profile');
              setMessage('Email verified! Complete your profile to continue.');

              // Store auth user ID for profile creation
              sessionStorage.setItem('pendingAuthUserId', data.user.id);

              setTimeout(() => {
                navigate('/', { replace: true });
              }, 2000);
            }
          }
        } else {
          // Try to get existing session
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const existingProfile = await getUserProfile(session.user.id);

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
                emailVerified: true,
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
              setStatus('success');
              setMessage('Welcome back!');

              setTimeout(() => {
                navigate('/', { replace: true });
              }, 2000);
            } else {
              setStatus('needs_profile');
              sessionStorage.setItem('pendingAuthUserId', session.user.id);
              setTimeout(() => navigate('/', { replace: true }), 2000);
            }
          } else {
            setStatus('error');
            setErrorMessage('Session expired. Please try again.');
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Something went wrong');
      }
    };

    handleCallback();
  }, [navigate, login, searchParams]);

  return (
    <div className="min-h-screen bg-[#FFFCF9] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-warm-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-[#2D9B8C] mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-serif font-semibold text-[#4A3F37] mb-2">
              {message}
            </h1>
            <p className="text-[#6B5D52]">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#2D9B8C]" />
            </div>
            <h1 className="text-xl font-serif font-semibold text-[#4A3F37] mb-2">
              {message}
            </h1>
            <p className="text-[#6B5D52]">Redirecting you now...</p>
          </>
        )}

        {status === 'needs_profile' && (
          <>
            <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#2D9B8C]" />
            </div>
            <h1 className="text-xl font-serif font-semibold text-[#4A3F37] mb-2">
              {message}
            </h1>
            <p className="text-[#6B5D52]">You'll need to complete your profile to start using Pipit.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-serif font-semibold text-[#4A3F37] mb-2">
              Verification Failed
            </h1>
            <p className="text-red-600 mb-4">{errorMessage}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-3 bg-[#2D9B8C] text-white rounded-full font-medium hover:bg-[#247A6F] transition-colors"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
