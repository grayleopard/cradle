
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Listing, User, Conversation, Message, Review, Transaction, TransactionStatus, Report, SavedSearch } from '../types';
import { MOCK_LISTINGS, MOCK_USERS } from '../constants';
import { calculateDistance, ZIP_COORDINATES } from '../utils/locationHelpers';
import { supabase } from '../services/supabase';
import { generateUUID } from '../utils/uuid';

interface StoreContextType {
  listings: Listing[];
  currentUser: User | null;
  conversations: Conversation[];
  messages: Message[];
  reviews: Review[];
  transactions: Transaction[];
  reports: Report[];
  userLocation: { lat: number; lng: number } | null;
  locationStatus: 'idle' | 'locating' | 'located' | 'error';
  
  // Compare Feature
  compareIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  upgradeToPremium: () => void;
  
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
  startConversation: (listingId: string) => string;
  sendMessage: (conversationId: string, text: string) => void;
  getMessagesByConversationId: (conversationId: string) => Message[];
  getConversationById: (conversationId: string) => Conversation | undefined;
  
  // Reviews
  addReview: (review: Review) => void;
  getReviewsByUserId: (userId: string) => Review[];
  
  // Transactions
  createTransaction: (listingId: string) => string;
  getTransactionById: (id: string) => Transaction | undefined;
  updateTransactionStatus: (id: string, status: TransactionStatus, updates?: Partial<Transaction>) => void;
  getActiveTransactionForListing: (listingId: string) => Transaction | undefined;
  
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
  COMPARE: 'cradle_compare'
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

// Explicitly type children as optional to prevent TS errors in certain JSX environments
export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => safeParse(STORAGE_KEYS.USER, null));

  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = '/#/welcome';
  };

  const updateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
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
    // Limit to 10 saved searches
    const newSearches = [search, ...currentSearches].slice(0, 10);
    updateUser({ ...currentUser, savedSearches: newSearches });
  };

  const deleteSavedSearch = (id: string) => {
    if (!currentUser) return;
    const currentSearches = currentUser.savedSearches || [];
    updateUser({ ...currentUser, savedSearches: currentSearches.filter(s => s.id !== id) });
  };

  // --- Data State ---
  const [listings, setListings] = useState<Listing[]>(() => safeParse(STORAGE_KEYS.LISTINGS, MOCK_LISTINGS));

  // --- Supabase Data Sync ---
  useEffect(() => {
    if (!supabase) return;

    const fetchRemoteListings = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Supabase error fetching listings:", error);
          return;
        }

        if (data && data.length > 0) {
          // Map DB columns to our Typescript Interface
          const mappedListings: Listing[] = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            description: row.description,
            price: Number(row.price),
            originalPrice: row.original_price ? Number(row.original_price) : undefined,
            dealAnalysis: row.deal_analysis, // Stored Analysis
            condition: row.condition,
            category: row.category,
            ageRange: row.age_range,
            brand: row.brand,
            isSmokeFree: row.is_smoke_free,
            isPetFree: row.is_pet_free,
            images: row.images || [],
            locationZip: row.location_zip || '98001',
            isSafetyVerified: row.is_safety_verified,
            isSold: row.is_sold,
            createdAt: row.created_at,
            distanceMiles: 0, // Will be updated by geolocation effect
            coordinates: ZIP_COORDINATES[row.location_zip] || undefined
          }));
          setListings(mappedListings);
        }
      } catch (err) {
        console.error("Failed to fetch from Supabase:", err);
      }
    };

    fetchRemoteListings();
  }, []);

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
  const [compareIds, setCompareIds] = useState<string[]>(() => safeParse(STORAGE_KEYS.COMPARE, []));

  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'located' | 'error'>('idle');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings)); }, [listings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(compareIds)); }, [compareIds]);

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
      (error) => {
        setUserLocation(defaultCoords);
        setLocationStatus('error');
        updateListingDistances(defaultCoords.lat, defaultCoords.lng);
      }
    );
  }, [currentUser]);

  // Recalculate distances whenever listings change or location changes
  useEffect(() => {
    if (userLocation) {
      updateListingDistances(userLocation.lat, userLocation.lng);
    }
  }, [listings.length]); 

  const updateListingDistances = (lat: number, lng: number) => {
    setListings(prev => prev.map(listing => {
      let coords = listing.coordinates;
      if (!coords && listing.locationZip && ZIP_COORDINATES[listing.locationZip]) {
        coords = ZIP_COORDINATES[listing.locationZip];
      }
      if (coords) {
        const dist = calculateDistance(lat, lng, coords.lat, coords.lng);
        // Only update if distance changed to avoid infinite loop
        if (listing.distanceMiles !== dist) {
           return { ...listing, distanceMiles: dist, coordinates: coords };
        }
      }
      return listing;
    }));
  };

  // --- Compare Feature ---
  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(cid => cid !== id);
      if (prev.length >= 3) return [...prev.slice(1), id]; // Keep max 3, remove oldest
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

  const reportListing = (listingId: string, reason: string) => {
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
  };

  // --- Listings & Users ---
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
    // 1. Optimistic Update
    const coords = ZIP_COORDINATES[listing.locationZip] || ZIP_COORDINATES['98001']; 
    const listingWithCoords = { 
      ...listing, 
      coordinates: coords,
      distanceMiles: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng) : 0,
      isPromoted: currentUser?.isPremium
    };
    setListings((prev) => [listingWithCoords, ...prev]);

    // 2. Persist to Supabase if connected
    if (supabase && currentUser) {
      try {
        const { error: userError } = await supabase.from('users').upsert({
            id: currentUser.id,
            username: currentUser.name,
            location_zip: currentUser.location,
            is_verified_parent: currentUser.isVerifiedParent,
            items_sold: currentUser.itemsSold,
            avatar_url: currentUser.avatarUrl
        });

        if (userError) {
            console.error("Error syncing user to Supabase:", userError);
        }

        const { error } = await supabase.from('listings').insert({
          id: listing.id,
          user_id: currentUser.id, 
          title: listing.title,
          description: listing.description,
          price: listing.price,
          // Fixed: Use camelCase properties from Listing object to map to snake_case DB columns
          original_price: listing.originalPrice,
          deal_analysis: listing.dealAnalysis, // Store AI Analysis
          condition: listing.condition,
          category: listing.category,
          age_range: listing.ageRange,
          is_smoke_free: listing.isSmokeFree,
          is_pet_free: listing.isPetFree,
          images: listing.images,
          location_zip: listing.locationZip,
          is_safety_verified: listing.isSafetyVerified
        });
        if (error) console.error("Error saving listing to DB:", error);
      } catch (e) {
        console.error("Supabase insert failed", e);
      }
    }
  };

  const updateListing = (updatedListing: Listing) => {
    setListings((prev) => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
  };

  const markAsSold = (id: string) => setListings(prev => prev.map(l => l.id === id ? { ...l, isSold: true } : l));
  const deleteListing = (id: string) => setListings(prev => prev.filter(l => l.id !== id));
  const getListingById = (id: string) => listings.find((l) => l.id === id);

  // --- Chat ---
  const startConversation = (listingId: string) => {
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
    return newConv.id;
  };

  const sendMessage = (conversationId: string, text: string) => {
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
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, lastMessage: newMessage, updatedAt: new Date().toISOString() } : c));
  };
  
  const getMessagesByConversationId = (id: string) => messages.filter(m => m.conversationId === id).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const getConversationById = (id: string) => conversations.find(c => c.id === id);

  // --- Transactions ---
  const createTransaction = (listingId: string): string => {
    if (!currentUser) throw new Error("Must be logged in");
    const listing = listings.find(l => l.id === listingId);
    if (!listing) throw new Error("Listing not found");
    const platformFee = Math.round(listing.price * 0.08); 
    const newTransaction: Transaction = {
      id: generateUUID(),
      listingId,
      buyerId: currentUser.id,
      sellerId: listing.userId,
      amount: listing.price,
      platformFee,
      total: listing.price + platformFee,
      status: TransactionStatus.INITIATED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTransactions(prev => [...prev, newTransaction]);
    return newTransaction.id;
  };

  const getTransactionById = (id: string) => transactions.find(t => t.id === id);
  const getActiveTransactionForListing = (listingId: string) => transactions.find(t => t.listingId === listingId && t.status !== TransactionStatus.CANCELLED && t.status !== TransactionStatus.COMPLETED);
  const updateTransactionStatus = (id: string, status: TransactionStatus, updates?: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status, ...updates, updatedAt: new Date().toISOString() } : t));
    if (status === TransactionStatus.COMPLETED) {
      const tx = transactions.find(t => t.id === id);
      if (tx) markAsSold(tx.listingId);
    }
  };

  const addReview = (review: Review) => setReviews(prev => [review, ...prev]);
  const getReviewsByUserId = (userId: string) => reviews.filter(r => r.targetUserId === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const resetStore = () => { localStorage.clear(); window.location.reload(); };

  return (
    <StoreContext.Provider value={{ 
      listings, currentUser, conversations, messages, reviews, transactions, reports, userLocation, locationStatus,
      login, logout, updateUser, upgradeToPremium,
      addListing, updateListing, getListingById, deleteListing, markAsSold, toggleFavorite,
      getUserById, followUser, unfollowUser, reportListing, saveSearch, deleteSavedSearch,
      compareIds, toggleCompare, clearCompare,
      startConversation, sendMessage, getMessagesByConversationId, getConversationById,
      addReview, getReviewsByUserId,
      createTransaction, getTransactionById, updateTransactionStatus, getActiveTransactionForListing,
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