// Simple fuzzy search implementation for matching search terms
// Supports typo tolerance and partial matches

/**
 * Calculate Levenshtein distance between two strings
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Calculate similarity score between 0-1
 */
export const similarity = (a: string, b: string): number => {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - levenshteinDistance(a.toLowerCase(), b.toLowerCase()) / maxLength;
};

/**
 * Check if a search term fuzzy matches a target string
 * @param searchTerm - The user's search query
 * @param target - The string to match against
 * @param threshold - Minimum similarity score (0-1), default 0.6 for typo tolerance
 */
export const fuzzyMatch = (
  searchTerm: string,
  target: string,
  threshold: number = 0.6
): boolean => {
  const searchLower = searchTerm.toLowerCase().trim();
  const targetLower = target.toLowerCase();

  // Exact substring match (highest priority)
  if (targetLower.includes(searchLower)) {
    return true;
  }

  // Word-level matching - check each word in target
  const targetWords = targetLower.split(/\s+/);
  const searchWords = searchLower.split(/\s+/);

  for (const searchWord of searchWords) {
    if (searchWord.length < 2) continue;

    // Check if any target word starts with search word
    if (targetWords.some(word => word.startsWith(searchWord))) {
      return true;
    }

    // Fuzzy match against each target word
    for (const targetWord of targetWords) {
      if (targetWord.length < 2) continue;

      // For short words, require higher similarity
      const adjustedThreshold = searchWord.length <= 3 ? 0.8 : threshold;

      if (similarity(searchWord, targetWord) >= adjustedThreshold) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Score how well a search term matches a listing
 * Higher score = better match
 */
export const scoreListing = (
  searchTerm: string,
  listing: {
    title: string;
    description: string;
    brand?: string;
    category?: string;
  }
): number => {
  const searchLower = searchTerm.toLowerCase().trim();
  let score = 0;

  // Title exact match (highest weight)
  if (listing.title.toLowerCase().includes(searchLower)) {
    score += 100;
  } else if (fuzzyMatch(searchTerm, listing.title, 0.7)) {
    score += 60;
  }

  // Brand exact match (high weight)
  if (listing.brand) {
    if (listing.brand.toLowerCase().includes(searchLower)) {
      score += 80;
    } else if (fuzzyMatch(searchTerm, listing.brand, 0.7)) {
      score += 50;
    }
  }

  // Category match
  if (listing.category && listing.category.toLowerCase().includes(searchLower)) {
    score += 40;
  }

  // Description match (lower weight)
  if (listing.description.toLowerCase().includes(searchLower)) {
    score += 20;
  } else if (fuzzyMatch(searchTerm, listing.description, 0.6)) {
    score += 10;
  }

  return score;
};

// Popular search terms for suggestions
export const POPULAR_SEARCHES = [
  'UPPAbaby',
  'Bugaboo',
  'Nuna',
  'Graco',
  'stroller',
  'car seat',
  'bassinet',
  'high chair',
  'baby carrier',
  'play mat',
  'toys',
  'clothing',
  'Chicco',
  'Britax',
  'Maxi-Cosi',
];

// Common brand names for autocomplete
export const COMMON_BRANDS = [
  'UPPAbaby',
  'Bugaboo',
  'Nuna',
  'Graco',
  'Chicco',
  'Britax',
  'Maxi-Cosi',
  'Baby Jogger',
  'BOB',
  'Cybex',
  'Stokke',
  'Doona',
  'Babyzen',
  '4moms',
  'Fisher-Price',
  'Skip Hop',
  'Baby Bjorn',
  'Ergobaby',
  'Halo',
  'SNOO',
];

/**
 * Get search suggestions based on partial input
 */
export const getSearchSuggestions = (
  input: string,
  recentSearches: string[] = [],
  maxSuggestions: number = 5
): { type: 'recent' | 'popular' | 'brand'; term: string }[] => {
  const inputLower = input.toLowerCase().trim();

  if (!inputLower) {
    // Return recent searches if no input
    return recentSearches.slice(0, maxSuggestions).map(term => ({
      type: 'recent' as const,
      term,
    }));
  }

  const suggestions: { type: 'recent' | 'popular' | 'brand'; term: string; score: number }[] = [];

  // Check recent searches first
  for (const term of recentSearches) {
    if (term.toLowerCase().includes(inputLower) || fuzzyMatch(input, term, 0.7)) {
      suggestions.push({ type: 'recent', term, score: 100 });
    }
  }

  // Check brands
  for (const brand of COMMON_BRANDS) {
    if (brand.toLowerCase().startsWith(inputLower)) {
      suggestions.push({ type: 'brand', term: brand, score: 90 });
    } else if (brand.toLowerCase().includes(inputLower)) {
      suggestions.push({ type: 'brand', term: brand, score: 70 });
    }
  }

  // Check popular searches
  for (const term of POPULAR_SEARCHES) {
    if (term.toLowerCase().includes(inputLower)) {
      // Don't duplicate brands
      if (!suggestions.some(s => s.term.toLowerCase() === term.toLowerCase())) {
        suggestions.push({ type: 'popular', term, score: 60 });
      }
    }
  }

  // Sort by score and return top suggestions
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map(({ type, term }) => ({ type, term }));
};
