
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkProductSafety } from './geminiService';

// Mock the GoogleGenAI class
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    })),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      BOOLEAN: 'BOOLEAN',
      ARRAY: 'ARRAY'
    }
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkProductSafety', () => {
    it('should return safe result with grounding sources', async () => {
      // Mock successful response
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          isSafe: true,
          reason: "No recalls found.",
          confidence: 0.95,
          potentialRecalls: []
        }),
        candidates: [{
          groundingMetadata: {
            groundingChunks: [
              { web: { title: "CPSC Database", uri: "https://cpsc.gov/recalls" } }
            ]
          }
        }]
      });

      const result = await checkProductSafety('Stroller', 'A nice stroller');
      
      expect(result.isSafe).toBe(true);
      expect(result.sources).toHaveLength(1);
      expect(result.sources?.[0].title).toBe("CPSC Database");
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        config: expect.objectContaining({
          tools: [{ googleSearch: {} }] // Verify search grounding is enabled
        })
      }));
    });

    it('should handle unsafe items correctly', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          isSafe: false,
          reason: "Recalled due to tipping hazard.",
          confidence: 0.99,
          potentialRecalls: ["Model X Tipping"]
        })
      });

      const result = await checkProductSafety('Bad Stroller', 'Dangerous');
      expect(result.isSafe).toBe(false);
      expect(result.potentialRecalls).toContain("Model X Tipping");
    });

    it('should handle AI errors gracefully', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error("API Error"));
      
      const result = await checkProductSafety('Stroller', 'Desc');
      
      // Should fallback to safe=true (non-blocking) but with a reason
      expect(result.isSafe).toBe(true);
      expect(result.reason).toContain("unavailable");
      expect(result.confidence).toBe(0);
    });
  });
});
