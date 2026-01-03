import { Listing, User, Condition, Category, AgeRange, Charity } from './types';
import { ZIP_COORDINATES } from './utils/locationHelpers';

// Default charity for MVP - hardcoded single partner
export const DEFAULT_CHARITY: Charity = {
  id: 'charity-auburn-food-bank',
  name: 'Auburn Food Bank',
  shortDescription: 'Kids Backpack Program - weekend meals for local students',
  fullDescription: 'The Auburn Food Bank serves families in need throughout the Auburn area. Their Kids Backpack Program provides weekend food packs to students who rely on school meals during the week.',
  websiteUrl: 'https://auburnfoodbank.org',
  logoUrl: '', // Add when available
  locationCity: 'Auburn',
  locationState: 'WA',
  isActive: true,
  totalReceived: 0,
  createdAt: new Date().toISOString(),
};

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Sarah M.',
  isVerifiedParent: true,
  joinDate: 'Jan 2024',
  itemsSold: 12,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  location: 'Auburn, WA',
  bio: 'Mom of 2. Clearing out the garage!'
};

export const MOCK_USERS: Record<string, User> = {
  'u2': {
    id: 'u2',
    name: 'Jessica R.',
    isVerifiedParent: true,
    joinDate: 'Dec 2023',
    itemsSold: 5,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    location: 'Auburn, WA',
    bio: 'Safety first! All items sanitized before pickup.'
  },
  'u3': {
    id: 'u3',
    name: 'Mike T.',
    isVerifiedParent: false,
    joinDate: 'Feb 2024',
    itemsSold: 1,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    location: 'Federal Way, WA',
    bio: 'Dad to a new toddler.'
  },
  'u4': {
    id: 'u4',
    name: 'Emily W.',
    isVerifiedParent: true,
    joinDate: 'Nov 2023',
    itemsSold: 22,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    location: 'Lakeland Hills, WA',
    bio: 'Selling gently used clothes and toys.'
  },
  'u5': {
    id: 'u5',
    name: 'Ashley K.',
    isVerifiedParent: true,
    joinDate: 'Mar 2024',
    itemsSold: 0,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ashley',
    location: 'Auburn, WA',
    bio: 'New to the neighborhood.'
  }
};

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'l1',
    userId: 'u2',
    title: 'UPPAbaby Vista V2 Stroller',
    description: 'Gently used stroller in Jake (Black/Carbon). Includes bassinet and toddler seat. Always stored indoors. Smoke-free home.',
    price: 650,
    originalPrice: 999,
    condition: Condition.EXCELLENT,
    category: Category.GEAR,
    ageRange: AgeRange.ZERO_TO_SIX_MO,
    brand: 'UPPAbaby',
    isSmokeFree: true,
    isPetFree: true,
    images: ['https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&q=80&w=800'],
    locationZip: '98001',
    coordinates: ZIP_COORDINATES['98001'],
    isSafetyVerified: true,
    distanceMiles: 0, 
    createdAt: '2 hours ago'
  },
  {
    id: 'l2',
    userId: 'u3',
    title: 'Wooden Activity Gym',
    description: 'Minimalist wooden play gym. Great condition, just a few scuffs on the bottom.',
    price: 45,
    originalPrice: 80,
    condition: Condition.VERY_GOOD,
    category: Category.TOYS,
    ageRange: AgeRange.ZERO_TO_SIX_MO,
    brand: 'Lovevery',
    isSmokeFree: true,
    isPetFree: false,
    images: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800'],
    locationZip: '98002',
    coordinates: ZIP_COORDINATES['98002'],
    isSafetyVerified: true,
    distanceMiles: 0,
    createdAt: '1 day ago'
  },
  {
    id: 'l3',
    userId: 'u4',
    title: 'Ergobaby Omni 360 Carrier',
    description: 'Mesh carrier, very breathable. Perfect for hiking. Washed and ready to go.',
    price: 80,
    originalPrice: 180,
    condition: Condition.GOOD,
    category: Category.GEAR,
    ageRange: AgeRange.SIX_TO_TWELVE_MO,
    brand: 'Ergobaby',
    isSmokeFree: true,
    isPetFree: true,
    images: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800'],
    locationZip: '98092',
    coordinates: ZIP_COORDINATES['98092'],
    isSafetyVerified: true,
    distanceMiles: 0,
    createdAt: '3 days ago'
  },
  {
    id: 'l4',
    userId: 'u5',
    title: 'Huge Lot of 2T Boy Clothes',
    description: 'Over 20 items. Gap, Old Navy, Carter\'s. Pants, shirts, and pajamas.',
    price: 30,
    condition: Condition.GOOD,
    category: Category.CLOTHING,
    ageRange: AgeRange.TWO_TO_THREE_YR,
    isSmokeFree: false,
    isPetFree: false,
    images: ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800'],
    locationZip: '98001',
    coordinates: ZIP_COORDINATES['98001'],
    isSafetyVerified: false,
    distanceMiles: 0,
    createdAt: '4 hours ago'
  }
];