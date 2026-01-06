
import { createClient } from '@supabase/supabase-js';

// Access env vars safely, fallback to localStorage, then fallback to the keys in DevSettings
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return (import.meta as any).env?.[key];
  } catch {
    return undefined;
  }
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

const DEFAULT_URL = 'https://heykcjvqkkecpcrjowjy.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhleWtjanZxa2tlY3Bjcmpvd2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTg2NzYsImV4cCI6MjA4Mjg3NDY3Nn0.G3IO36EqdfHeIuDhnZK_qjfbC-ba0E1dmXNOzyXFyQM';

const supabaseUrl = envUrl || localStorage.getItem('VITE_SUPABASE_URL') || DEFAULT_URL;
const supabaseKey = envKey || localStorage.getItem('VITE_SUPABASE_ANON_KEY') || DEFAULT_KEY;

// Create a single supabase client for interacting with your database
export const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project.supabase.co') 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = () => {
  return !!supabase;
};

// --- Auth Helper Functions ---

// Format phone to E.164 (required by Supabase Auth)
export const formatPhoneE164 = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  // Assume US number if no country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // If already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  // Already formatted or international
  return phone.startsWith('+') ? phone : `+${digits}`;
};

// Check if we're in mock auth mode (no Twilio configured)
// Real auth requires Twilio credentials in Supabase dashboard
let mockAuthMode = true; // Default to mock until we know otherwise
let mockAuthUserId: string | null = null;

// Production check - disable mock auth in production
const isProduction = () => {
  try {
    return window.location.hostname !== 'localhost' &&
           !window.location.hostname.includes('127.0.0.1') &&
           !window.location.hostname.includes('.local');
  } catch {
    return false;
  }
};

// Send OTP via SMS (or mock it for local dev)
export const sendOtp = async (phone: string): Promise<void> => {
  const formattedPhone = formatPhoneE164(phone);

  if (!supabase) {
    // No Supabase - use mock mode
    console.log('[Mock Auth] OTP "sent" to:', formattedPhone);
    mockAuthMode = true;
    return;
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone
    });

    if (error) {
      // Check for common errors that indicate Twilio isn't configured
      if (error.message.includes('provider') ||
          error.message.includes('Phone') ||
          error.message.includes('SMS') ||
          error.message.includes('not enabled')) {
        console.log('[Mock Auth] Phone provider not configured, using mock mode');
        mockAuthMode = true;
        return;
      }
      throw error;
    }

    mockAuthMode = false;
    console.log('[Real Auth] OTP sent to:', formattedPhone);
  } catch (err: any) {
    // If phone auth fails, fall back to mock
    console.log('[Mock Auth] Falling back to mock mode due to:', err.message);
    mockAuthMode = true;
  }
};

// Verify OTP code
export const verifyOtp = async (phone: string, token: string): Promise<{ userId: string; isNewUser: boolean }> => {
  const formattedPhone = formatPhoneE164(phone);

  // Block mock auth in production
  if (isProduction() && mockAuthMode) {
    throw new Error('Authentication is not properly configured. Please contact support.');
  }

  if (mockAuthMode || !supabase) {
    // Mock verification - only accept specific test codes (DEV ONLY)
    const validTestCodes = ['123456', '000000', '111111'];
    if (token.length === 6 && validTestCodes.includes(token)) {
      // Generate a consistent mock user ID based on phone number
      const phoneHash = formattedPhone.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      mockAuthUserId = `mock-${phoneHash}-${formattedPhone.slice(-4)}`;
      console.log('[Mock Auth] OTP verified for:', formattedPhone, '-> User ID:', mockAuthUserId);

      // Check if user exists in DB
      const existingUser = await getUserProfile(mockAuthUserId);
      return { userId: mockAuthUserId, isNewUser: !existingUser };
    }
    throw new Error('Invalid verification code. Use 123456 for testing.');
  }

  // Real Supabase verification
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: 'sms'
  });

  if (error) throw error;
  if (!data.user) throw new Error('Verification failed');

  const userId = data.user.id;
  const existingUser = await getUserProfile(userId);

  return { userId, isNewUser: !existingUser };
};

// Get current auth session
export const getSession = async (): Promise<{ userId: string; phone?: string } | null> => {
  // Check mock auth first
  if (mockAuthUserId) {
    return { userId: mockAuthUserId };
  }

  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return {
        userId: session.user.id,
        phone: session.user.phone
      };
    }
  } catch (err) {
    console.error('Failed to get session:', err);
  }

  return null;
};

// Sign out
export const signOut = async (): Promise<void> => {
  mockAuthUserId = null;

  if (supabase) {
    await supabase.auth.signOut();
  }
};

// Get user profile from database
export const getUserProfile = async (userId: string): Promise<any | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // PGRST116 = no rows found, 406 = table/RLS issue - both mean "no profile"
    if (error) {
      if (error.code !== 'PGRST116') {
        console.log('[Auth] User profile not found or table not configured:', error.code);
      }
      return null;
    }

    return data;
  } catch (err) {
    console.log('[Auth] Could not fetch user profile (DB may not be set up)');
    return null;
  }
};

// Check if we're in mock auth mode
export const isMockAuthMode = (): boolean => mockAuthMode;

// ============================================
// EMAIL/PASSWORD AUTH (Alternative to Phone)
// ============================================

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string): Promise<{ userId: string; isNewUser: boolean }> => {
  if (!supabase) {
    throw new Error('Authentication service not available');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Sign up failed');

  // Check if this is truly a new user (Supabase returns user even if exists)
  const isNewUser = !data.user.confirmed_at;

  return { userId: data.user.id, isNewUser };
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<{ userId: string; isNewUser: boolean }> => {
  if (!supabase) {
    throw new Error('Authentication service not available');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password');
    }
    throw error;
  }

  if (!data.user) throw new Error('Sign in failed');

  const existingProfile = await getUserProfile(data.user.id);
  return { userId: data.user.id, isNewUser: !existingProfile };
};

// Send magic link email
export const sendMagicLink = async (email: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Authentication service not available');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) throw error;
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Authentication service not available');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  });

  if (error) throw error;
};

// Check if email auth is available (Supabase configured)
export const isEmailAuthAvailable = (): boolean => {
  return !!supabase;
};

// Delete user account
// Note: Full account deletion requires server-side function with admin privileges
// This function handles the client-side part and marks the account for deletion
export const deleteUserAccount = async (userId: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Service not available');
  }

  try {
    // Delete user's profile data first
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Failed to delete user profile:', profileError);
    }

    // Delete user's listings
    const { error: listingsError } = await supabase
      .from('listings')
      .delete()
      .eq('user_id', userId);

    if (listingsError && listingsError.code !== 'PGRST116') {
      console.error('Failed to delete user listings:', listingsError);
    }

    // Sign out the user
    await supabase.auth.signOut();
  } catch (error: any) {
    console.error('Account deletion error:', error);
    throw new Error('Failed to delete account. Please contact support.');
  }
};

// Update user email (requires email verification)
export const updateUserEmail = async (newEmail: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Service not available');
  }

  const { error } = await supabase.auth.updateUser({
    email: newEmail
  });

  if (error) throw error;
};

// Update user password
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Service not available');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
};

// ============================================
// SOCIAL OAUTH (Google, Facebook, Apple)
// ============================================

export type OAuthProvider = 'google' | 'facebook' | 'apple';

// Sign in with OAuth provider (redirects to provider)
export const signInWithOAuth = async (provider: OAuthProvider): Promise<void> => {
  if (!supabase) {
    throw new Error('Authentication service not available');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: provider === 'google' ? {
        access_type: 'offline',
        prompt: 'consent',
      } : undefined
    }
  });

  if (error) throw error;
};

// Convenience functions for each provider
export const signInWithGoogle = () => signInWithOAuth('google');
export const signInWithFacebook = () => signInWithOAuth('facebook');
export const signInWithApple = () => signInWithOAuth('apple');

// Link an OAuth provider to existing account (for trust verification)
export const linkOAuthProvider = async (provider: OAuthProvider): Promise<void> => {
  if (!supabase) {
    throw new Error('Authentication service not available');
  }

  // Note: Supabase doesn't directly support linking accounts
  // Instead, we'll use the identity linking approach
  const { error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback?link=${provider}`
    }
  });

  if (error) {
    // If linking fails (may not be supported in all Supabase versions),
    // fall back to just tracking in user metadata
    console.warn('OAuth linking not available:', error.message);
    throw new Error(`Could not connect ${provider}. Please try again.`);
  }
};

// Check if OAuth providers are available
export const isOAuthAvailable = (): boolean => {
  return !!supabase;
};
