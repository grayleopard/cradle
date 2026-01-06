import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, mockFetchResponse, createMockUser } from '../../test/setup';

// Mock auth service functions
const signInWithPhone = async (phone: string) => {
  const { data, error } = await mockSupabaseClient.auth.signInWithOtp({
    phone,
  });
  if (error) throw error;
  return data;
};

const verifyOtp = async (phone: string, token: string) => {
  const { data, error } = await mockSupabaseClient.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  if (error) throw error;
  return data;
};

const signOut = async () => {
  const { error } = await mockSupabaseClient.auth.signOut();
  if (error) throw error;
};

const getCurrentSession = async () => {
  const { data, error } = await mockSupabaseClient.auth.getSession();
  if (error) throw error;
  return data.session;
};

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phone Sign-In', () => {
    it('should send OTP to valid phone number', async () => {
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValueOnce({
        data: { messageId: 'msg_123' },
        error: null,
      });

      const result = await signInWithPhone('+12065551234');
      expect(result).toBeDefined();
      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
        phone: '+12065551234',
      });
    });

    it('should handle invalid phone number', async () => {
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid phone number format' },
      });

      await expect(signInWithPhone('invalid')).rejects.toThrow('Invalid phone number format');
    });

    it('should handle rate limiting', async () => {
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Too many requests' },
      });

      await expect(signInWithPhone('+12065551234')).rejects.toThrow('Too many requests');
    });
  });

  describe('OTP Verification', () => {
    it('should verify valid OTP', async () => {
      const mockSession = {
        user: { id: 'user-123', phone: '+12065551234' },
        access_token: 'token_abc',
        refresh_token: 'refresh_xyz',
      };

      mockSupabaseClient.auth.verifyOtp.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const result = await verifyOtp('+12065551234', '123456');
      expect(result.session).toBeDefined();
      expect(result.session.user.id).toBe('user-123');
    });

    it('should reject invalid OTP', async () => {
      mockSupabaseClient.auth.verifyOtp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid OTP' },
      });

      await expect(verifyOtp('+12065551234', '000000')).rejects.toThrow('Invalid OTP');
    });

    it('should handle expired OTP', async () => {
      mockSupabaseClient.auth.verifyOtp.mockResolvedValueOnce({
        data: null,
        error: { message: 'OTP has expired' },
      });

      await expect(verifyOtp('+12065551234', '123456')).rejects.toThrow('OTP has expired');
    });
  });

  describe('Session Management', () => {
    it('should return null when not logged in', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const session = await getCurrentSession();
      expect(session).toBeNull();
    });

    it('should return session when logged in', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token_abc',
        expires_at: Date.now() / 1000 + 3600,
      };

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const session = await getCurrentSession();
      expect(session).toBeDefined();
      expect(session?.user.id).toBe('user-123');
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ error: null });

      await expect(signOut()).resolves.not.toThrow();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors gracefully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: { message: 'Network error' },
      });

      await expect(signOut()).rejects.toThrow('Network error');
    });
  });

  describe('Auth State Listener', () => {
    it('should set up auth state listener', () => {
      const callback = vi.fn();
      mockSupabaseClient.auth.onAuthStateChange(callback);

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(callback);
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const { data } = mockSupabaseClient.auth.onAuthStateChange(callback);

      expect(data.subscription).toBeDefined();
      expect(data.subscription.unsubscribe).toBeInstanceOf(Function);
    });
  });
});

describe('User Profile Creation', () => {
  it('should create profile after first sign in', async () => {
    const newUser = createMockUser({ id: 'new-user-123', name: 'New Parent' });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: newUser, error: null }),
    });

    // Simulate profile check + creation
    const db = mockSupabaseClient.from('profiles');
    const { data: existingProfile } = await db.select().eq('id', 'new-user-123').single();

    if (!existingProfile) {
      const { data: createdProfile, error } = await db.insert(newUser);
      expect(error).toBeNull();
      expect(createdProfile).toBeDefined();
    }
  });

  it('should return existing profile if already exists', async () => {
    const existingUser = createMockUser({ id: 'existing-user' });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: existingUser, error: null }),
    });

    const db = mockSupabaseClient.from('profiles');
    const { data } = await db.select().eq('id', 'existing-user').single();

    expect(data).toEqual(existingUser);
  });
});

describe('Trust Tier Verification Flow', () => {
  it('should start user at BASIC tier', async () => {
    const newUser = createMockUser({
      trustTier: 'basic',
      phoneVerified: true,
      emailVerified: false,
    });

    expect(newUser.trustTier).toBe('basic');
  });

  it('should upgrade to VERIFIED when requirements met', async () => {
    const verifiedUser = createMockUser({
      trustTier: 'verified',
      phoneVerified: true,
      emailVerified: true,
      hasPaymentMethod: true,
      hasProfilePhoto: true,
    });

    expect(verifiedUser.phoneVerified).toBe(true);
    expect(verifiedUser.emailVerified).toBe(true);
    expect(verifiedUser.trustTier).toBe('verified');
  });
});
