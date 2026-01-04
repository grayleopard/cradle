
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Listing, User, Conversation, Message, Review, Transaction, TransactionStatus, Report, SavedSearch, Offer, OfferStatus, Charity, DonationOption, Notification, NotificationType } from '../types';
import { MOCK_LISTINGS, MOCK_USERS, DEFAULT_CHARITY } from '../constants';
import { calculateDistance, ZIP_COORDINATES } from '../utils/locationHelpers';
import { supabase, getSession, getUserProfile, signOut as supabaseSignOut } from '../services/supabase';
import { generateUUID } from '../utils/uuid';

interface StoreContextType {
  listings: Listing[];
  currentUser: User | null;
  conversations: Conversation[];
  messages: Message[];
  reviews: Review[];
  transactions: Transaction[];
  reports: Report[];
  offers: Offer[];
  userLocation: { lat: number; lng: number } | null;
  locationStatus: 'idle' | 'locating' | 'located' | 'error';
  isLoading: boolean;

  // Compare Feature
  compareIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  login: (user: User, referralCodeUsed?: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  upgradeToPremium: () => void;
  useReferralCredit: (amount: number) => Promise<number>;

  // Listings
  addListing: (listing: Listing) => void;
  updateListing: (listing: Listing) => void;
  getListingById: (id: string) => Listing | undefined;
  deleteListing: (id: string) => void;
  markAsSold: (id: string) => void;
  toggleFavorite: (listingId: string) => void;

  // Users & Community
  getUserById: (id: string) => User | undefined;
  followUser: (targetUserId: string) => void;
  unfollowUser: (targetUserId: string) => void;
  reportListing: (listingId: string, reason: string) => void;
  saveSearch: (search: SavedSearch) => void;
  deleteSavedSearch: (id: string) => void;

  // Chat
  startConversation: (listingId: string) => Promise<string>;
  sendMessage: (conversationId: string, text: string) => void;
  markMessagesAsRead: (conversationId: string) => void;
  getMessagesByConversationId: (conversationId: string) => Message[];
  getConversationById: (conversationId: string) => Conversation | undefined;

  // Reviews
  addReview: (review: Review) => void;
  getReviewsByUserId: (userId: string) => Review[];

  // Offers
  createOffer: (listingId: string, amount: number, message?: string) => Promise<string>;
  respondToOffer: (offerId: string, response: 'accept' | 'decline' | 'counter', counterAmount?: number) => Promise<void>;
  acceptCounterOffer: (offerId: string) => Promise<string>;
  withdrawOffer: (offerId: string) => void;
  getOffersForListing: (listingId: string) => Offer[];
  getOfferById: (id: string) => Offer | undefined;
  getPendingOffersForSeller: () => Offer[];

  // Transactions
  createTransaction: (listingId: string, offerId?: string, negotiatedPrice?: number, donation?: { option: DonationOption; amount: number }) => Promise<string>;
  getTransactionById: (id: string) => Transaction | undefined;
  updateTransactionStatus: (id: string, status: TransactionStatus, updates?: Partial<Transaction>) => void;
  getActiveTransactionForListing: (listingId: string) => Transaction | undefined;

  // Charity
  activeCharity: Charity;
  getActiveCharity: () => Charity;
  updateUserDonationTotal: (amount: number) => void;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notificationId: string) => void;

  resetStore: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'cradle_user',
  LISTINGS: 'cradle_listings',
  CONVERSATIONS: 'cradle_conversations',
  MESSAGES: 'cradle_messages',
  REVIEWS: 'cradle_reviews',
  TRANSACTIONS: 'cradle_transactions',
  REPORTS: 'cradle_reports',
  COMPARE: 'cradle_compare',
  OFFERS: 'cradle_offers',
  NOTIFICATIONS: 'cradle_notifications'
};

// Helper to safely parse JSON from localStorage
const safeParse = (key: string, fallback: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage`, e);
    return fallback;
  }
};

// Database row to TypeScript object mappers
const mapUserFromDB = (row: any): User => ({
  id: row.id,
  name: row.username || 'Unknown',
  isVerifiedParent: row.is_verified_parent || false,
  isPremium: row.is_premium || false,
  isAdmin: row.is_admin || false,
  joinDate: row.created_at,
  itemsSold: row.items_sold || 0,
  avatarUrl: row.avatar_url || '',
  location: row.location_zip || '',
  bio: row.bio,
  email: row.email,
  savedListingIds: row.saved_listing_ids || [],
  savedSearches: row.saved_searches || [],
  followingIds: row.following_ids || [],
  stripeAccountId: row.stripe_account_id,
  stripeOnboarded: row.stripe_onboarded || false,
  referralCode: row.referral_code,
  referredBy: row.referred_by,
  referralCredit: row.referral_credit || 0,
  referralCount: row.referral_count || 0,
  // Social/Community features
  neighborhood: row.neighborhood,
  kidAges: row.kid_ages || [],
  parentingTags: row.parenting_tags || []
});

const mapListingFromDB = (row: any): Listing => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  price: Number(row.price),
  originalPrice: row.original_price ? Number(row.original_price) : undefined,
  dealAnalysis: row.deal_analysis,
  condition: row.condition,
  category: row.category,
  ageRange: row.age_range,
  brand: row.brand,
  model: row.model,
  manufactureDate: row.manufacture_date,
  expirationDate: row.expiration_date,
  isSmokeFree: row.is_smoke_free,
  isPetFree: row.is_pet_free,
  images: row.images || [],
  locationZip: row.location_zip || '98001',
  isSafetyVerified: row.is_safety_verified,
  safetyCheckResult: row.safety_check_result,
  isSold: row.is_sold,
  isPromoted: row.is_promoted,
  createdAt: row.created_at,
  distanceMiles: 0,
  coordinates: ZIP_COORDINATES[row.location_zip] || undefined
});

const mapConversationFromDB = (row: any, lastMsg?: Message): Conversation => ({
  id: row.id,
  listingId: row.listing_id,
  participantIds: row.participant_ids || [],
  lastMessage: lastMsg,
  updatedAt: row.updated_at
});

const mapMessageFromDB = (row: any): Message => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  text: row.text,
  timestamp: row.created_at,
  isRead: row.is_read
});

const mapReviewFromDB = (row: any): Review => ({
  id: row.id,
  targetUserId: row.target_user_id,
  authorId: row.author_id,
  authorName: row.author_name,
  rating: row.rating,
  comment: row.comment || '',
  date: row.created_at
});

const mapTransactionFromDB = (row: any): Transaction => ({
  id: row.id,
  listingId: row.listing_id,
  buyerId: row.buyer_id,
  sellerId: row.seller_id,
  amount: Number(row.amount),
  platformFee: Number(row.platform_fee),
  total: Number(row.total),
  status: row.status as TransactionStatus,
  stripePaymentIntentId: row.stripe_payment_intent_id,
  meetupLocation: row.meetup_location,
  meetupTime: row.meetup_time,
  inspectionPhotoUrl: row.inspection_photo_url,
  inspectionChecklist: row.inspection_checklist,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapReportFromDB = (row: any): Report => ({
  id: row.id,
  listingId: row.listing_id,
  reporterId: row.reporter_id,
  reason: row.reason,
  timestamp: row.created_at,
  status: row.status
});

const mapNotificationFromDB = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as NotificationType,
  title: row.title,
  message: row.message,
  actorId: row.actor_id,
  actorName: row.actor_name,
  actorAvatarUrl: row.actor_avatar_url,
  referenceId: row.reference_id,
  referenceType: row.reference_type,
  isRead: row.is_read,
  createdAt: row.created_at
});

export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);

  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => safeParse(STORAGE_KEYS.USER, null));

  // --- Data State ---
  const [listings, setListings] = useState<Listing[]>(() => safeParse(STORAGE_KEYS.LISTINGS, MOCK_LISTINGS));
  const [conversations, setConversations] = useState<Conversation[]>(() => safeParse(STORAGE_KEYS.CONVERSATIONS, []));
  const [messages, setMessages] = useState<Message[]>(() => safeParse(STORAGE_KEYS.MESSAGES, []));
  const [reviews, setReviews] = useState<Review[]>(() => {
    const defaultReviews = [
      { id: 'r1', targetUserId: 'u2', authorId: 'u4', authorName: 'Emily W.', rating: 5, comment: 'Great seller! Item exactly as described.', date: '2024-03-01' },
      { id: 'r2', targetUserId: 'u2', authorId: 'u5', authorName: 'Ashley K.', rating: 5, comment: 'Super safe meetup at the police station. Thanks!', date: '2024-02-15' }
    ];
    return safeParse(STORAGE_KEYS.REVIEWS, defaultReviews);
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => safeParse(STORAGE_KEYS.TRANSACTIONS, []));
  const [reports, setReports] = useState<Report[]>(() => safeParse(STORAGE_KEYS.REPORTS, []));
  const [offers, setOffers] = useState<Offer[]>(() => safeParse(STORAGE_KEYS.OFFERS, []));
  const [compareIds, setCompareIds] = useState<string[]>(() => safeParse(STORAGE_KEYS.COMPARE, []));
  const [notifications, setNotifications] = useState<Notification[]>(() => safeParse(STORAGE_KEYS.NOTIFICATIONS, []));
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'located' | 'error'>('idle');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Computed: unread notification count
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  // --- Supabase Data Sync ---
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const fetchAllData = async () => {
      if (!supabase) return;

      try {
        // Fetch listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (listingsData && listingsData.length > 0) {
          setListings(listingsData.map(mapListingFromDB));
        }

        // Fetch conversations
        const { data: convsData } = await supabase
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false });

        if (convsData) {
          // Get all messages to find last message for each conversation
          const { data: msgsData } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

          const mappedMessages = msgsData ? msgsData.map(mapMessageFromDB) : [];
          setMessages(mappedMessages);

          const mappedConvs = convsData.map(conv => {
            const lastMsg = mappedMessages.find(m => m.conversationId === conv.id);
            return mapConversationFromDB(conv, lastMsg);
          });
          setConversations(mappedConvs);
        }

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData.map(mapReviewFromDB));
        }

        // Fetch transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (txData) {
          setTransactions(txData.map(mapTransactionFromDB));
        }

        // Fetch reports
        const { data: reportsData } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (reportsData) {
          setReports(reportsData.map(mapReportFromDB));
        }

        // Note: Notifications are fetched separately when currentUser is available

      } catch (err) {
        console.error("Failed to fetch from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (!supabase || !currentUser) return;

    const fetchNotifications = async () => {
      if (!supabase) return; // TypeScript null check
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsData) {
        setNotifications(notificationsData.map(mapNotificationFromDB));
      }
    };

    fetchNotifications();
  }, [currentUser?.id]);

  // --- Session Restoration on Mount ---
  useEffect(() => {
    const restoreSession = async () => {
      // Skip if we already have a user from localStorage
      if (currentUser) return;

      const session = await getSession();
      if (session?.userId) {
        const profile = await getUserProfile(session.userId);
        if (profile) {
          const restoredUser: User = {
            id: profile.id,
            name: profile.username || 'User',
            location: profile.location_zip || '',
            isVerifiedParent: profile.is_verified_parent || false,
            isPremium: profile.is_premium || false,
            isAdmin: profile.is_admin || false,
            joinDate: profile.created_at,
            itemsSold: profile.items_sold || 0,
            avatarUrl: profile.avatar_url || '',
            bio: profile.bio,
            email: profile.email,
            savedListingIds: profile.saved_listing_ids || [],
            savedSearches: profile.saved_searches || [],
            followingIds: profile.following_ids || [],
            stripeAccountId: profile.stripe_account_id,
            stripeOnboarded: profile.stripe_onboarded || false,
            referralCode: profile.referral_code,
            referredBy: profile.referred_by,
            referralCredit: profile.referral_credit || 0,
            referralCount: profile.referral_count || 0,
            neighborhood: profile.neighborhood,
            kidAges: profile.kid_ages || [],
            parentingTags: profile.parenting_tags || []
          };
          setCurrentUser(restoredUser);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(restoredUser));
          console.log('[Auth] Session restored for:', restoredUser.name);
        }
      }
    };

    restoreSession();
  }, []);

  // --- Auth State Listener (handles token refresh, sign out from other tabs) ---
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change:', event);

      if (event === 'SIGNED_OUT') {
        // User signed out (possibly from another tab)
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refreshed');
      } else if (event === 'SIGNED_IN' && session?.user && !currentUser) {
        // User signed in (possibly from another tab)
        const profile = await getUserProfile(session.user.id);
        if (profile) {
          const restoredUser: User = {
            id: profile.id,
            name: profile.username || 'User',
            location: profile.location_zip || '',
            isVerifiedParent: profile.is_verified_parent || false,
            isPremium: profile.is_premium || false,
            isAdmin: profile.is_admin || false,
            joinDate: profile.created_at,
            itemsSold: profile.items_sold || 0,
            avatarUrl: profile.avatar_url || '',
            bio: profile.bio,
            email: profile.email,
            savedListingIds: profile.saved_listing_ids || [],
            savedSearches: profile.saved_searches || [],
            followingIds: profile.following_ids || [],
            stripeAccountId: profile.stripe_account_id,
            stripeOnboarded: profile.stripe_onboarded || false,
            referralCode: profile.referral_code,
            referredBy: profile.referred_by,
            referralCredit: profile.referral_credit || 0,
            referralCount: profile.referral_count || 0,
            neighborhood: profile.neighborhood,
            kidAges: profile.kid_ages || [],
            parentingTags: profile.parenting_tags || []
          };
          setCurrentUser(restoredUser);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(restoredUser));
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  // --- Persistence to localStorage (fallback) ---
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings)); }, [listings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers)); }, [offers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(compareIds)); }, [compareIds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }, [notifications]);

  // Generate a unique referral code (6 chars, alphanumeric)
  const generateReferralCode = (userId: string): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I)
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // --- Auth Functions ---
  const login = async (user: User, referralCodeUsed?: string) => {
    // Generate referral code for new users
    if (!user.referralCode) {
      user.referralCode = generateReferralCode(user.id);
      user.referralCredit = 0;
      user.referralCount = 0;
    }

    // If user signed up with a referral code, credit the referrer
    if (referralCodeUsed && !user.referredBy) {
      user.referredBy = referralCodeUsed;
      await creditReferrer(referralCodeUsed);
    }

    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    // Sync user to Supabase
    if (supabase) {
      await supabase.from('users').upsert({
        id: user.id,
        username: user.name,
        email: user.email,
        location_zip: user.location,
        is_verified_parent: user.isVerifiedParent,
        is_premium: user.isPremium,
        is_admin: user.isAdmin,
        items_sold: user.itemsSold,
        avatar_url: user.avatarUrl,
        bio: user.bio,
        saved_listing_ids: user.savedListingIds || [],
        saved_searches: user.savedSearches || [],
        following_ids: user.followingIds || [],
        stripe_account_id: user.stripeAccountId,
        stripe_onboarded: user.stripeOnboarded,
        referral_code: user.referralCode,
        referred_by: user.referredBy,
        referral_credit: user.referralCredit || 0,
        referral_count: user.referralCount || 0,
        // Social/Community features
        neighborhood: user.neighborhood,
        kid_ages: user.kidAges || [],
        parenting_tags: user.parentingTags || []
      });
    }
  };

  // Credit referrer $5 when someone uses their code
  const creditReferrer = async (referralCode: string) => {
    if (!supabase) return;

    // Find user with this referral code
    const { data: referrer } = await supabase
      .from('users')
      .select('*')
      .eq('referral_code', referralCode)
      .single();

    if (referrer) {
      const newCredit = (referrer.referral_credit || 0) + 5;
      const newCount = (referrer.referral_count || 0) + 1;

      await supabase
        .from('users')
        .update({
          referral_credit: newCredit,
          referral_count: newCount
        })
        .eq('id', referrer.id);

      console.log(`Credited $5 to referrer ${referrer.username} (code: ${referralCode})`);
    }
  };

  // Use referral credit on a transaction (reduces fee)
  const useReferralCredit = async (amount: number): Promise<number> => {
    if (!currentUser || !currentUser.referralCredit || currentUser.referralCredit <= 0) {
      return 0;
    }

    const creditToUse = Math.min(amount, currentUser.referralCredit);
    const newCredit = currentUser.referralCredit - creditToUse;

    const updatedUser = { ...currentUser, referralCredit: newCredit };
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

    if (supabase) {
      await supabase
        .from('users')
        .update({ referral_credit: newCredit })
        .eq('id', currentUser.id);
    }

    return creditToUse;
  };

  const logout = async () => {
    await supabaseSignOut();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = '/#/';
  };

  const updateUser = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

    // Sync to Supabase
    if (supabase) {
      await supabase.from('users').upsert({
        id: updatedUser.id,
        username: updatedUser.name,
        email: updatedUser.email,
        location_zip: updatedUser.location,
        is_verified_parent: updatedUser.isVerifiedParent,
        is_premium: updatedUser.isPremium,
        is_admin: updatedUser.isAdmin,
        items_sold: updatedUser.itemsSold,
        avatar_url: updatedUser.avatarUrl,
        bio: updatedUser.bio,
        saved_listing_ids: updatedUser.savedListingIds || [],
        saved_searches: updatedUser.savedSearches || [],
        following_ids: updatedUser.followingIds || [],
        stripe_account_id: updatedUser.stripeAccountId,
        stripe_onboarded: updatedUser.stripeOnboarded,
        referral_code: updatedUser.referralCode,
        referred_by: updatedUser.referredBy,
        referral_credit: updatedUser.referralCredit || 0,
        referral_count: updatedUser.referralCount || 0,
        // Social/Community features
        neighborhood: updatedUser.neighborhood,
        kid_ages: updatedUser.kidAges || [],
        parenting_tags: updatedUser.parentingTags || []
      });
    }
  };

  const upgradeToPremium = () => {
    if (currentUser) {
      updateUser({ ...currentUser, isPremium: true });
    }
  };

  const toggleFavorite = (listingId: string) => {
    if (!currentUser) return;
    const savedIds = currentUser.savedListingIds || [];
    let newSavedIds;
    if (savedIds.includes(listingId)) {
      newSavedIds = savedIds.filter(id => id !== listingId);
    } else {
      newSavedIds = [...savedIds, listingId];
    }
    updateUser({ ...currentUser, savedListingIds: newSavedIds });
  };

  const saveSearch = (search: SavedSearch) => {
    if (!currentUser) return;
    const currentSearches = currentUser.savedSearches || [];
    const newSearches = [search, ...currentSearches].slice(0, 10);
    updateUser({ ...currentUser, savedSearches: newSearches });
  };

  const deleteSavedSearch = (id: string) => {
    if (!currentUser) return;
    const currentSearches = currentUser.savedSearches || [];
    updateUser({ ...currentUser, savedSearches: currentSearches.filter(s => s.id !== id) });
  };

  // --- Geolocation ---
  useEffect(() => {
    if (!currentUser) return;
    if (!navigator.geolocation) { setLocationStatus('error'); return; }
    setLocationStatus('locating');
    let defaultCoords = { lat: 47.3073, lng: -122.2284 };
    if (currentUser.location && currentUser.location.length === 5 && ZIP_COORDINATES[currentUser.location]) {
      defaultCoords = ZIP_COORDINATES[currentUser.location];
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationStatus('located');
        updateListingDistances(latitude, longitude);
      },
      () => {
        setUserLocation(defaultCoords);
        setLocationStatus('error');
        updateListingDistances(defaultCoords.lat, defaultCoords.lng);
      }
    );
  }, [currentUser]);

  useEffect(() => {
    if (userLocation) {
      updateListingDistances(userLocation.lat, userLocation.lng);
    }
  }, [listings.length]);

  const updateListingDistances = useCallback((lat: number, lng: number) => {
    setListings(prev => prev.map(listing => {
      let coords = listing.coordinates;
      if (!coords && listing.locationZip && ZIP_COORDINATES[listing.locationZip]) {
        coords = ZIP_COORDINATES[listing.locationZip];
      }
      if (coords) {
        const dist = calculateDistance(lat, lng, coords.lat, coords.lng);
        if (listing.distanceMiles !== dist) {
          return { ...listing, distanceMiles: dist, coordinates: coords };
        }
      }
      return listing;
    }));
  }, []);

  // --- Compare Feature ---
  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(cid => cid !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const clearCompare = () => setCompareIds([]);

  // --- Community Functions ---
  const followUser = (targetUserId: string) => {
    if (!currentUser) return;
    const currentFollowing = currentUser.followingIds || [];
    if (!currentFollowing.includes(targetUserId)) {
      updateUser({ ...currentUser, followingIds: [...currentFollowing, targetUserId] });

      // Notify the user being followed
      addNotification({
        userId: targetUserId,
        type: NotificationType.NEW_FOLLOWER,
        title: 'New Follower',
        message: `${currentUser.name} started following you`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorAvatarUrl: currentUser.avatarUrl,
        referenceId: currentUser.id,
        referenceType: 'user'
      });
    }
  };

  const unfollowUser = (targetUserId: string) => {
    if (!currentUser) return;
    const currentFollowing = currentUser.followingIds || [];
    updateUser({
      ...currentUser,
      followingIds: currentFollowing.filter(id => id !== targetUserId)
    });
  };

  const reportListing = async (listingId: string, reason: string) => {
    if (!currentUser) return;
    const newReport: Report = {
      id: generateUUID(),
      listingId,
      reporterId: currentUser.id,
      reason,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    setReports(prev => [...prev, newReport]);

    // Sync to Supabase
    if (supabase) {
      await supabase.from('reports').insert({
        id: newReport.id,
        listing_id: listingId,
        reporter_id: currentUser.id,
        reason,
        status: 'pending'
      });
    }
  };

  // --- Listings ---
  const getUserById = (id: string) => {
    if (currentUser && currentUser.id === id) return currentUser;
    const user = MOCK_USERS[id];
    if (user) {
      const userReviews = reviews.filter(r => r.targetUserId === id);
      const rating = userReviews.length > 0 ? userReviews.reduce((a, b) => a + b.rating, 0) / userReviews.length : 0;
      return { ...user, rating, reviewCount: userReviews.length };
    }
    return user;
  };

  const addListing = async (listing: Listing) => {
    const coords = ZIP_COORDINATES[listing.locationZip] || ZIP_COORDINATES['98001'];
    const listingWithCoords = {
      ...listing,
      coordinates: coords,
      distanceMiles: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng) : 0,
      isPromoted: currentUser?.isPremium
    };
    setListings((prev) => [listingWithCoords, ...prev]);

    // Sync to Supabase
    if (supabase && currentUser) {
      try {
        // Ensure user exists
        await supabase.from('users').upsert({
          id: currentUser.id,
          username: currentUser.name,
          location_zip: currentUser.location,
          is_verified_parent: currentUser.isVerifiedParent,
          items_sold: currentUser.itemsSold,
          avatar_url: currentUser.avatarUrl
        });

        await supabase.from('listings').insert({
          id: listing.id,
          user_id: currentUser.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          original_price: listing.originalPrice,
          deal_analysis: listing.dealAnalysis,
          condition: listing.condition,
          category: listing.category,
          age_range: listing.ageRange,
          brand: listing.brand,
          model: listing.model,
          manufacture_date: listing.manufactureDate,
          expiration_date: listing.expirationDate,
          is_smoke_free: listing.isSmokeFree,
          is_pet_free: listing.isPetFree,
          images: listing.images,
          location_zip: listing.locationZip,
          is_safety_verified: listing.isSafetyVerified,
          safety_check_result: listing.safetyCheckResult,
          is_promoted: currentUser.isPremium
        });
      } catch (e) {
        console.error("Supabase insert failed", e);
      }
    }
  };

  const updateListing = async (updatedListing: Listing) => {
    setListings((prev) => prev.map(l => l.id === updatedListing.id ? updatedListing : l));

    if (supabase) {
      await supabase.from('listings').update({
        title: updatedListing.title,
        description: updatedListing.description,
        price: updatedListing.price,
        original_price: updatedListing.originalPrice,
        deal_analysis: updatedListing.dealAnalysis,
        condition: updatedListing.condition,
        category: updatedListing.category,
        age_range: updatedListing.ageRange,
        brand: updatedListing.brand,
        model: updatedListing.model,
        is_smoke_free: updatedListing.isSmokeFree,
        is_pet_free: updatedListing.isPetFree,
        images: updatedListing.images,
        location_zip: updatedListing.locationZip,
        is_safety_verified: updatedListing.isSafetyVerified,
        is_sold: updatedListing.isSold
      }).eq('id', updatedListing.id);
    }
  };

  const markAsSold = async (id: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, isSold: true } : l));
    if (supabase) {
      await supabase.from('listings').update({ is_sold: true }).eq('id', id);
    }
  };

  const deleteListing = async (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
    if (supabase) {
      await supabase.from('listings').delete().eq('id', id);
    }
  };

  const getListingById = (id: string) => listings.find((l) => l.id === id);

  // --- Chat ---
  const startConversation = async (listingId: string): Promise<string> => {
    if (!currentUser) throw new Error("Must be logged in");
    const listing = getListingById(listingId);
    if (!listing) throw new Error('Listing not found');

    const existing = conversations.find(c => c.listingId === listingId && c.participantIds.includes(currentUser.id));
    if (existing) return existing.id;

    const newConv: Conversation = {
      id: generateUUID(),
      listingId,
      participantIds: [currentUser.id, listing.userId],
      updatedAt: new Date().toISOString()
    };
    setConversations(prev => [newConv, ...prev]);

    // Sync to Supabase
    if (supabase) {
      await supabase.from('conversations').insert({
        id: newConv.id,
        listing_id: listingId,
        participant_ids: [currentUser.id, listing.userId]
      });
    }

    return newConv.id;
  };

  const sendMessage = async (conversationId: string, text: string) => {
    if (!currentUser) return;
    const newMessage: Message = {
      id: generateUUID(),
      conversationId,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setMessages(prev => [...prev, newMessage]);
    setConversations(prev => prev.map(c =>
      c.id === conversationId
        ? { ...c, lastMessage: newMessage, updatedAt: new Date().toISOString() }
        : c
    ));

    // Sync to Supabase
    if (supabase) {
      await supabase.from('messages').insert({
        id: newMessage.id,
        conversation_id: conversationId,
        sender_id: currentUser.id,
        text
      });
      await supabase.from('conversations').update({
        updated_at: new Date().toISOString()
      }).eq('id', conversationId);
    }

    // Create notification for recipient
    const conversation = conversations.find(c => c.id === conversationId);
    const recipientId = conversation?.participantIds.find(id => id !== currentUser.id);
    if (recipientId) {
      addNotification({
        userId: recipientId,
        type: NotificationType.NEW_MESSAGE,
        title: 'New Message',
        message: `${currentUser.name}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorAvatarUrl: currentUser.avatarUrl,
        referenceId: conversationId,
        referenceType: 'conversation'
      });
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!currentUser) return;

    setMessages(prev => prev.map(m =>
      m.conversationId === conversationId && m.senderId !== currentUser.id && !m.isRead
        ? { ...m, isRead: true }
        : m
    ));

    // Sync to Supabase
    if (supabase) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.id);
    }
  };

  const getMessagesByConversationId = (id: string) =>
    messages.filter(m => m.conversationId === id).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  const getConversationById = (id: string) => conversations.find(c => c.id === id);

  // --- Reviews ---
  const addReview = async (review: Review) => {
    setReviews(prev => [review, ...prev]);

    if (supabase) {
      await supabase.from('reviews').insert({
        id: review.id,
        target_user_id: review.targetUserId,
        author_id: review.authorId,
        author_name: review.authorName,
        rating: review.rating,
        comment: review.comment
      });
    }
  };

  const getReviewsByUserId = (userId: string) =>
    reviews.filter(r => r.targetUserId === userId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  // --- Offers ---
  const createOffer = async (listingId: string, amount: number, message?: string): Promise<string> => {
    if (!currentUser) throw new Error("Must be logged in");
    const listing = listings.find(l => l.id === listingId);
    if (!listing) throw new Error("Listing not found");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const newOffer: Offer = {
      id: generateUUID(),
      listingId,
      buyerId: currentUser.id,
      sellerId: listing.userId,
      amount,
      message,
      status: OfferStatus.PENDING,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    setOffers(prev => [...prev, newOffer]);

    // Sync to Supabase
    if (supabase) {
      await supabase.from('offers').insert({
        id: newOffer.id,
        listing_id: listingId,
        buyer_id: currentUser.id,
        seller_id: listing.userId,
        amount,
        message,
        status: OfferStatus.PENDING,
        expires_at: expiresAt.toISOString()
      });
    }

    // Notify seller of new offer
    addNotification({
      userId: listing.userId,
      type: NotificationType.OFFER_RECEIVED,
      title: 'New Offer Received',
      message: `${currentUser.name} offered $${amount} for "${listing.title}"`,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorAvatarUrl: currentUser.avatarUrl,
      referenceId: listingId,
      referenceType: 'listing'
    });

    return newOffer.id;
  };

  const respondToOffer = async (offerId: string, response: 'accept' | 'decline' | 'counter', counterAmount?: number): Promise<void> => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) throw new Error("Offer not found");

    let newStatus: OfferStatus;
    switch (response) {
      case 'accept':
        newStatus = OfferStatus.ACCEPTED;
        break;
      case 'decline':
        newStatus = OfferStatus.DECLINED;
        break;
      case 'counter':
        newStatus = OfferStatus.COUNTERED;
        break;
    }

    setOffers(prev => prev.map(o =>
      o.id === offerId
        ? { ...o, status: newStatus, counterAmount, updatedAt: new Date().toISOString() }
        : o
    ));

    // Sync to Supabase
    if (supabase) {
      await supabase.from('offers').update({
        status: newStatus,
        counter_amount: counterAmount,
        updated_at: new Date().toISOString()
      }).eq('id', offerId);
    }

    // Notify buyer of the response
    const listing = listings.find(l => l.id === offer.listingId);
    const notificationTypes: Record<string, { type: NotificationType; title: string }> = {
      accept: { type: NotificationType.OFFER_ACCEPTED, title: 'Offer Accepted!' },
      decline: { type: NotificationType.OFFER_DECLINED, title: 'Offer Declined' },
      counter: { type: NotificationType.OFFER_COUNTERED, title: 'Counter Offer Received' }
    };

    const notifConfig = notificationTypes[response];
    const notifMessage = response === 'counter'
      ? `${currentUser?.name} countered with $${counterAmount} for "${listing?.title}"`
      : `Your offer on "${listing?.title}" was ${response}ed`;

    addNotification({
      userId: offer.buyerId,
      type: notifConfig.type,
      title: notifConfig.title,
      message: notifMessage,
      actorId: currentUser?.id,
      actorName: currentUser?.name,
      actorAvatarUrl: currentUser?.avatarUrl,
      referenceId: offer.listingId,
      referenceType: 'listing'
    });
  };

  const acceptCounterOffer = async (offerId: string): Promise<string> => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer || offer.status !== OfferStatus.COUNTERED || !offer.counterAmount) {
      throw new Error("Invalid offer state");
    }

    // Update offer to accepted
    setOffers(prev => prev.map(o =>
      o.id === offerId
        ? { ...o, status: OfferStatus.ACCEPTED, updatedAt: new Date().toISOString() }
        : o
    ));

    // Create transaction at counter amount
    const txId = await createTransaction(offer.listingId, offerId, offer.counterAmount);
    return txId;
  };

  const withdrawOffer = (offerId: string) => {
    setOffers(prev => prev.map(o =>
      o.id === offerId
        ? { ...o, status: OfferStatus.WITHDRAWN, updatedAt: new Date().toISOString() }
        : o
    ));

    if (supabase) {
      supabase.from('offers').update({
        status: OfferStatus.WITHDRAWN,
        updated_at: new Date().toISOString()
      }).eq('id', offerId);
    }
  };

  const getOffersForListing = (listingId: string) =>
    offers.filter(o => o.listingId === listingId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const getOfferById = (id: string) => offers.find(o => o.id === id);

  const getPendingOffersForSeller = () => {
    if (!currentUser) return [];
    return offers.filter(o =>
      o.sellerId === currentUser.id &&
      o.status === OfferStatus.PENDING
    );
  };

  // --- Transactions ---
  const createTransaction = async (
    listingId: string,
    offerId?: string,
    negotiatedPrice?: number,
    donation?: { option: DonationOption; amount: number }
  ): Promise<string> => {
    if (!currentUser) throw new Error("Must be logged in");
    const listing = listings.find(l => l.id === listingId);
    if (!listing) throw new Error("Listing not found");

    const finalPrice = negotiatedPrice || listing.price;
    const platformFee = Math.round(finalPrice * 0.08);
    const donationAmount = donation?.amount || 0;
    const total = finalPrice + platformFee + donationAmount;

    const newTransaction: Transaction = {
      id: generateUUID(),
      listingId,
      buyerId: currentUser.id,
      sellerId: listing.userId,
      amount: finalPrice,
      platformFee,
      total,
      status: TransactionStatus.INITIATED,
      offerId,
      originalListingPrice: negotiatedPrice ? listing.price : undefined,
      // Charity donation fields
      donationAmount: donationAmount > 0 ? donationAmount : undefined,
      donationCharityId: donationAmount > 0 ? DEFAULT_CHARITY.id : undefined,
      donationOption: donation?.option,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTransactions(prev => [...prev, newTransaction]);

    // Sync to Supabase
    if (supabase) {
      await supabase.from('transactions').insert({
        id: newTransaction.id,
        listing_id: listingId,
        buyer_id: currentUser.id,
        seller_id: listing.userId,
        amount: finalPrice,
        platform_fee: platformFee,
        total,
        status: TransactionStatus.INITIATED,
        offer_id: offerId,
        original_listing_price: negotiatedPrice ? listing.price : null,
        donation_amount: donationAmount > 0 ? donationAmount : null,
        donation_charity_id: donationAmount > 0 ? DEFAULT_CHARITY.id : null,
        donation_option: donation?.option || null
      });
    }

    return newTransaction.id;
  };

  const getTransactionById = (id: string) => transactions.find(t => t.id === id);

  const getActiveTransactionForListing = (listingId: string) =>
    transactions.find(t =>
      t.listingId === listingId &&
      t.status !== TransactionStatus.CANCELLED &&
      t.status !== TransactionStatus.COMPLETED
    );

  const updateTransactionStatus = async (id: string, status: TransactionStatus, updates?: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t =>
      t.id === id ? { ...t, status, ...updates, updatedAt: new Date().toISOString() } : t
    ));

    if (status === TransactionStatus.COMPLETED) {
      const tx = transactions.find(t => t.id === id);
      if (tx) markAsSold(tx.listingId);
    }

    // Sync to Supabase
    if (supabase) {
      await supabase.from('transactions').update({
        status,
        stripe_payment_intent_id: updates?.stripePaymentIntentId,
        meetup_location: updates?.meetupLocation,
        meetup_time: updates?.meetupTime,
        inspection_photo_url: updates?.inspectionPhotoUrl,
        inspection_checklist: updates?.inspectionChecklist,
        updated_at: new Date().toISOString()
      }).eq('id', id);
    }

    // Notify the other party of status change
    const tx = transactions.find(t => t.id === id);
    if (tx && currentUser) {
      const recipientId = currentUser.id === tx.buyerId ? tx.sellerId : tx.buyerId;
      const listing = listings.find(l => l.id === tx.listingId);

      const statusMessages: Record<string, string> = {
        [TransactionStatus.ACCEPTED]: 'Your purchase request was accepted',
        [TransactionStatus.PAYMENT_HELD]: 'Payment received, funds secured in escrow',
        [TransactionStatus.MEETUP_AGREED]: 'Meetup details confirmed',
        [TransactionStatus.INSPECTION_PENDING]: 'Arrived at meetup location',
        [TransactionStatus.COMPLETED]: 'Transaction completed! Funds released.',
        [TransactionStatus.CANCELLED]: 'Transaction was cancelled'
      };

      const message = statusMessages[status];
      if (message) {
        addNotification({
          userId: recipientId,
          type: NotificationType.TRANSACTION_UPDATE,
          title: 'Transaction Update',
          message: `${message} for "${listing?.title}"`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorAvatarUrl: currentUser.avatarUrl,
          referenceId: id,
          referenceType: 'transaction'
        });
      }
    }
  };

  // --- Charity ---
  const activeCharity = DEFAULT_CHARITY;

  const getActiveCharity = () => DEFAULT_CHARITY;

  const updateUserDonationTotal = (amount: number) => {
    if (!currentUser || amount <= 0) return;

    const newTotal = (currentUser.totalDonated || 0) + amount;
    const updatedUser = { ...currentUser, totalDonated: newTotal };
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

    // Sync to Supabase
    if (supabase) {
      supabase.from('users').update({
        total_donated: newTotal
      }).eq('id', currentUser.id);
    }
  };

  // --- Notifications ---
  const addNotification = async (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notif,
      id: generateUUID(),
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Only add to local state if this notification is for the current user
    // Otherwise, the recipient will fetch it from Supabase when they log in
    if (notif.userId === currentUser?.id) {
      setNotifications(prev => [newNotification, ...prev]);
    }

    // Sync to Supabase
    if (supabase) {
      await supabase.from('notifications').insert({
        id: newNotification.id,
        user_id: notif.userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        actor_id: notif.actorId,
        actor_name: notif.actorName,
        actor_avatar_url: notif.actorAvatarUrl,
        reference_id: notif.referenceId,
        reference_type: notif.referenceType,
        is_read: false
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));

    if (supabase) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    if (supabase) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    if (supabase) {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    }
  };

  const resetStore = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <StoreContext.Provider value={{
      listings, currentUser, conversations, messages, reviews, transactions, reports, offers,
      userLocation, locationStatus, isLoading,
      login, logout, updateUser, upgradeToPremium, useReferralCredit,
      addListing, updateListing, getListingById, deleteListing, markAsSold, toggleFavorite,
      getUserById, followUser, unfollowUser, reportListing, saveSearch, deleteSavedSearch,
      compareIds, toggleCompare, clearCompare,
      startConversation, sendMessage, markMessagesAsRead, getMessagesByConversationId, getConversationById,
      addReview, getReviewsByUserId,
      createOffer, respondToOffer, acceptCounterOffer, withdrawOffer, getOffersForListing, getOfferById, getPendingOffersForSeller,
      createTransaction, getTransactionById, updateTransactionStatus, getActiveTransactionForListing,
      activeCharity, getActiveCharity, updateUserDonationTotal,
      notifications, unreadNotificationCount, addNotification, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
      resetStore
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
