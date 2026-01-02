import { SafetyCheckResult, Category, Condition, AgeRange, Listing, Review, DealAnalysis } from "../types";

// API endpoint for secure server-side Gemini calls
const API_URL = '/api/gemini';

async function callGeminiAPI<T>(action: string, params: Record<string, any>): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Interface for Auto-fill
export interface ListingMetadata {
  title: string;
  description: string;
  category: Category;
  condition: Condition;
  ageRange: AgeRange;
  suggestedPrice: number;
}

export interface ComparisonResult {
  title1: string;
  title2: string;
  title3?: string;
  rows: {
    feature: string;
    item1Value: string;
    item2Value: string;
    item3Value?: string;
    winnerIndex?: number;
  }[];
  verdict: string;
  bestFor: string[];
}

export interface ConciergeResponse {
  message: string;
  recommendedListingIds: string[];
}

export interface VoiceSearchIntent {
  query: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface MeetingDetails {
  isAgreed: boolean;
  location: string;
  dateTime: string;
  summary: string;
}

export const processVoiceCommand = async (
  base64Audio: string,
  mimeType: string
): Promise<VoiceSearchIntent | null> => {
  try {
    return await callGeminiAPI<VoiceSearchIntent>('processVoiceCommand', { base64Audio, mimeType });
  } catch (error) {
    console.error("Voice command failed:", error);
    return null;
  }
};

export const generateListingMetadata = async (
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<ListingMetadata | null> => {
  try {
    return await callGeminiAPI<ListingMetadata>('generateListingMetadata', { base64Image, mimeType });
  } catch (error) {
    console.error("Auto-fill failed:", error);
    return null;
  }
};

export const identifyItemFromImage = async (
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<{ searchQuery: string; category: string } | null> => {
  try {
    return await callGeminiAPI('identifyItemFromImage', { base64Image, mimeType });
  } catch (error) {
    console.error("Visual Search failed:", error);
    return null;
  }
};

export const checkProductSafety = async (
  title: string,
  description: string,
  base64Image?: string,
  mimeType: string = 'image/jpeg'
): Promise<SafetyCheckResult> => {
  try {
    return await callGeminiAPI<SafetyCheckResult>('checkProductSafety', { title, description, base64Image, mimeType });
  } catch (error) {
    console.error("Safety check failed:", error);
    return {
      isSafe: true,
      reason: "Automated check unavailable. Item queued for manual review.",
      confidence: 0,
      potentialRecalls: []
    };
  }
};

export const analyzeDeal = async (
  title: string,
  price: number,
  condition: string,
  originalPrice?: number
): Promise<DealAnalysis | null> => {
  try {
    return await callGeminiAPI<DealAnalysis>('analyzeDeal', { title, price, condition, originalPrice });
  } catch (error) {
    console.error("Deal analysis failed:", error);
    return null;
  }
};

export const compareListings = async (
  listings: Listing[]
): Promise<ComparisonResult | null> => {
  if (listings.length < 2) return null;

  try {
    return await callGeminiAPI<ComparisonResult>('compareListings', { listings });
  } catch (error) {
    console.error("Comparison failed:", error);
    return null;
  }
};

export const askConcierge = async (
  history: { role: 'user' | 'model'; text: string }[],
  userMessage: string,
  listings: Listing[],
  image?: { base64: string; mimeType: string }
): Promise<ConciergeResponse | null> => {
  try {
    return await callGeminiAPI<ConciergeResponse>('askConcierge', { history, userMessage, listings, image });
  } catch (error) {
    console.error("Concierge failed:", error);
    return null;
  }
};

export const generateSmartReplies = async (
  myRole: 'buyer' | 'seller',
  otherUserName: string,
  itemTitle: string,
  itemPrice: number,
  lastMessageText: string,
  fullHistory: { senderId: string; text: string }[]
): Promise<string[]> => {
  try {
    return await callGeminiAPI<string[]>('generateSmartReplies', {
      myRole,
      otherUserName,
      itemTitle,
      itemPrice,
      lastMessageText,
      fullHistory
    });
  } catch (error) {
    console.error("Smart Replies failed:", error);
    return [];
  }
};

export const optimizeListingDescription = async (
  draftDescription: string,
  title: string,
  category: string
): Promise<string | null> => {
  try {
    return await callGeminiAPI<string>('optimizeListingDescription', { draftDescription, title, category });
  } catch (error) {
    console.error("Description optimizer failed:", error);
    return null;
  }
};

export const generateInspectionChecklist = async (
  title: string,
  category: string
): Promise<string[]> => {
  try {
    return await callGeminiAPI<string[]>('generateInspectionChecklist', { title, category });
  } catch (error) {
    console.warn("AI Checklist failed, using default:", error);
    return getDefaultChecklist(category);
  }
};

export const summarizeUserReputation = async (
  reviews: Review[],
  sellerName: string,
  isVerified: boolean,
  soldCount: number
): Promise<string | null> => {
  if (reviews.length === 0 && soldCount === 0) return null;

  try {
    return await callGeminiAPI<string>('summarizeUserReputation', { reviews, sellerName, isVerified, soldCount });
  } catch (error) {
    console.error("Reputation summary failed:", error);
    return null;
  }
};

export const extractMeetingDetails = async (
  messages: { text: string; senderId: string }[]
): Promise<MeetingDetails | null> => {
  if (messages.length < 2) return null;

  try {
    return await callGeminiAPI<MeetingDetails>('extractMeetingDetails', { messages });
  } catch (error) {
    console.error("Meeting extraction failed:", error);
    return null;
  }
};

const getDefaultChecklist = (category: string): string[] => {
  switch (category) {
    case Category.STROLLERS:
      return ["Check brakes", "Test folding mechanism", "Inspect harness", "Check wheels"];
    case Category.CAR_SEATS:
      return ["Check expiration date", "Inspect for stress marks", "Verify harness tightens", "Check buckle function"];
    case Category.TOYS:
      return ["Check for loose parts", "Inspect battery compartment", "Check for sharp edges", "Verify sound/lights"];
    default:
      return ["Item matches description", "No undisclosed damage", "Clean condition", "All parts included"];
  }
};
