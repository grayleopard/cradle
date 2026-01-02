import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// CORS headers for client requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, ...params } = req.body;

  try {
    let result;

    switch (action) {
      case 'processVoiceCommand':
        result = await processVoiceCommand(params);
        break;
      case 'generateListingMetadata':
        result = await generateListingMetadata(params);
        break;
      case 'identifyItemFromImage':
        result = await identifyItemFromImage(params);
        break;
      case 'checkProductSafety':
        result = await checkProductSafety(params);
        break;
      case 'analyzeDeal':
        result = await analyzeDeal(params);
        break;
      case 'compareListings':
        result = await compareListings(params);
        break;
      case 'askConcierge':
        result = await askConcierge(params);
        break;
      case 'generateSmartReplies':
        result = await generateSmartReplies(params);
        break;
      case 'optimizeListingDescription':
        result = await optimizeListingDescription(params);
        break;
      case 'generateInspectionChecklist':
        result = await generateInspectionChecklist(params);
        break;
      case 'summarizeUserReputation':
        result = await summarizeUserReputation(params);
        break;
      case 'extractMeetingDetails':
        result = await extractMeetingDetails(params);
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`Gemini API error (${action}):`, error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// --- Gemini Functions (server-side) ---

async function processVoiceCommand({ base64Audio, mimeType }: { base64Audio: string; mimeType: string }) {
  const model = "gemini-2.5-flash-preview-native-audio-dialog";
  const textPrompt = `
    You are a search assistant for a baby gear marketplace.
    Listen to the user's voice command and extract their search filters.

    Categories available: [Strollers & Travel Systems, Car Seats & Boosters, Cribs & Bassinets, High Chairs & Feeding, Baby Carriers & Wraps, Play Yards, Toys & Books, Clothing Bundles, Other Gear, Monitors & Safety]

    Rules:
    1. 'query': The main search text (e.g. "Uppababy Vista").
    2. 'category': Map to one of the available categories if mentioned, otherwise return "All".
    3. 'minPrice' / 'maxPrice': Extract numbers if they mention budget (e.g. "under 200", "over 50").

    Return JSON only.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType } },
        { text: textPrompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING },
          category: { type: Type.STRING },
          minPrice: { type: Type.NUMBER },
          maxPrice: { type: Type.NUMBER }
        },
        required: ["query", "category"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}

async function generateListingMetadata({ base64Image, mimeType = 'image/jpeg' }: { base64Image: string; mimeType?: string }) {
  const model = "gemini-2.5-flash-preview-05-20";
  const textPrompt = `
    You are an expert reseller of baby gear. Analyze this image and create a listing for a marketplace.

    1. Identify the item (Brand and Model if visible).
    2. Write a catchy, short Title (max 60 chars).
    3. Write a helpful Description (2-3 sentences) describing features.
    4. Estimate the Category, Condition, and Age Range based on visual cues.
    5. Suggest a fair resale Price (in USD) assuming it's used.

    Return a JSON object matching this structure:
    {
      "title": "string",
      "description": "string",
      "category": "string (one of: Strollers & Travel Systems, Car Seats & Boosters, Cribs & Bassinets, High Chairs & Feeding, Baby Carriers & Wraps, Play Yards, Toys & Books, Clothing Bundles, Other Gear, Monitors & Safety)",
      "condition": "string (one of: Like New, Excellent, Very Good, Good, Fair)",
      "ageRange": "string (one of: 0-6mo, 6-12mo, 12-18mo, 18-24mo, 2-3yr, 3-5yr, 5+)",
      "suggestedPrice": number
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: textPrompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          condition: { type: Type.STRING },
          ageRange: { type: Type.STRING },
          suggestedPrice: { type: Type.NUMBER }
        },
        required: ["title", "description", "category", "suggestedPrice"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}

async function identifyItemFromImage({ base64Image, mimeType = 'image/jpeg' }: { base64Image: string; mimeType?: string }) {
  const model = "gemini-2.5-flash-preview-05-20";
  const textPrompt = `
    Identify the main item in this image for a search query.
    1. Return a short, precise 'searchQuery' (e.g. "Uppababy Vista" or "Ergobaby 360"). Max 3 words.
    2. Return the most likely 'category' from the list:
       [Strollers & Travel Systems, Car Seats & Boosters, Cribs & Bassinets, High Chairs & Feeding, Baby Carriers & Wraps, Play Yards, Toys & Books, Clothing Bundles, Other Gear, Monitors & Safety]

    Return JSON only.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: textPrompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          searchQuery: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["searchQuery", "category"]
      }
    }
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(text);
}

async function checkProductSafety({ title, description, base64Image, mimeType = 'image/jpeg' }: { title: string; description: string; base64Image?: string; mimeType?: string }) {
  const model = "gemini-2.5-pro-preview-05-06";
  const textPrompt = `
    You are a Product Safety Expert for baby and children's items.

    Task:
    1. Analyze the product "${title}" described as "${description}".
    2. USE GOOGLE SEARCH to find active recalls, specifically looking for CPSC (Consumer Product Safety Commission) notices.
    3. Verify if the specific model described (or shown in image) matches any recalled batches.

    Visual Analysis (if image provided):
    - Look for signs of damage (cracks, stress marks).
    - Check for missing safety restraints (e.g. 5-point harness).
    - Identify if it is a banned item type (e.g. drop-side crib, inclined sleeper).

    Output Requirements:
    - Return a JSON object.
    - "isSafe": false if there is a recall or major damage.
    - "reason": A clear, short explanation citing the recall or issue if found.

    JSON Schema:
    {
      "isSafe": boolean,
      "reason": string,
      "confidence": number (0-1),
      "potentialRecalls": string[]
    }
  `;

  const parts: any[] = [{ text: textPrompt }];
  if (base64Image) {
    parts.unshift({ inlineData: { data: base64Image, mimeType } });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isSafe: { type: Type.BOOLEAN },
          reason: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          potentialRecalls: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["isSafe", "reason", "confidence"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const result = JSON.parse(text);

  // Extract grounding sources
  const sources: { title: string; uri: string }[] = [];
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });
  }

  return { ...result, sources: sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i) };
}

async function analyzeDeal({ title, price, condition, originalPrice }: { title: string; price: number; condition: string; originalPrice?: number }) {
  const model = "gemini-2.5-flash-preview-05-20";
  const useSearch = !originalPrice;

  const textPrompt = useSearch ? `
    You are a pricing expert for used baby gear.
    1. Use Google Search to find the CURRENT RETAIL price (New) for: "${title}".
    2. Compare the used price ($${price}) in "${condition}" condition to the new retail price.
    3. Calculate the savings and determine a 'Deal Score' from 1-10 (10 being an amazing deal).
    4. Provide a short verdict and explanation.

    JSON Schema:
    {
      "estimatedRetailPrice": number,
      "savingsPercentage": number (0-100),
      "dealScore": number (1-10),
      "verdict": "string (e.g. Great Deal, Fair Price, Overpriced)",
      "explanation": "string (max 20 words)",
      "retailSource": "string (e.g. Amazon, Target, Manufacturer)"
    }
  ` : `
    You are a pricing expert for used baby gear.
    The seller states the original retail price was $${originalPrice}.
    The used price is $${price} in "${condition}" condition.

    1. Verify if $${originalPrice} seems accurate for "${title}". If it's wildly inflated, estimate the real retail.
    2. Calculate the savings and depreciation.
    3. Determine a 'Deal Score' from 1-10 based on the condition.
    4. Provide a short verdict.

    JSON Schema:
    {
      "estimatedRetailPrice": number,
      "savingsPercentage": number (0-100),
      "dealScore": number (1-10),
      "verdict": "string (e.g. Great Deal, Fair Price, Overpriced)",
      "explanation": "string (max 20 words)",
      "retailSource": "string (User Provided)"
    }
  `;

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        estimatedRetailPrice: { type: Type.NUMBER },
        savingsPercentage: { type: Type.NUMBER },
        dealScore: { type: Type.NUMBER },
        verdict: { type: Type.STRING },
        explanation: { type: Type.STRING },
        retailSource: { type: Type.STRING }
      },
      required: ["estimatedRetailPrice", "dealScore", "verdict"]
    }
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model,
    contents: textPrompt,
    config
  });

  const text = response.text;
  if (!text) return null;

  const result = JSON.parse(text);

  // Extract grounding sources
  const sources: { title: string; uri: string }[] = [];
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });
  }

  return { ...result, sources: sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i) };
}

async function compareListings({ listings }: { listings: any[] }) {
  if (listings.length < 2) return null;

  const model = "gemini-2.5-pro-preview-05-06";
  const listingsSummary = listings.map((l: any) =>
    `ID: ${l.id}, Title: ${l.title}, Price: $${l.price}, Condition: ${l.condition}, Description: ${l.description}, Age: ${l.ageRange}`
  ).join("\n---\n");

  const textPrompt = `
    You are a shopping assistant helping a parent decide between these baby items.

    Compare them side-by-side.
    1. Create 3-5 rows of comparison features (e.g. Value, Durability, Condition, Feature Set).
    2. For each feature, provide a short value for each item.
    3. Decide a 'winner' for each row (0 for Item 1, 1 for Item 2, etc. or null if tie).
    4. Give a final verdict and a "Best For..." tag for each item.

    Items:
    ${listingsSummary}

    Output JSON Schema:
    {
      "title1": "string",
      "title2": "string",
      "title3": "string (optional)",
      "rows": [
        { "feature": "string", "item1Value": "string", "item2Value": "string", "item3Value": "string (optional)", "winnerIndex": number }
      ],
      "verdict": "string (Comparison summary)",
      "bestFor": ["string (Item 1 Best For)", "string (Item 2 Best For)", "string (Item 3 Best For)"]
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: textPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title1: { type: Type.STRING },
          title2: { type: Type.STRING },
          title3: { type: Type.STRING },
          rows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                feature: { type: Type.STRING },
                item1Value: { type: Type.STRING },
                item2Value: { type: Type.STRING },
                item3Value: { type: Type.STRING },
                winnerIndex: { type: Type.INTEGER }
              }
            }
          },
          verdict: { type: Type.STRING },
          bestFor: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response");
  return JSON.parse(text);
}

async function askConcierge({ history, userMessage, listings, image }: { history: any[]; userMessage: string; listings: any[]; image?: { base64: string; mimeType: string } }) {
  const model = "gemini-2.5-flash-preview-05-20";

  const inventory = listings
    .filter((l: any) => !l.isSold)
    .map((l: any) => `ID: ${l.id} | ${l.title} | $${l.price} | ${l.category} | ${l.condition}`)
    .join('\n');

  const systemInstruction = `
    You are the Cradle Concierge, a helpful and friendly shopping assistant for parents.
    You have access to the current marketplace inventory below.

    INVENTORY:
    ${inventory}

    Your Goal:
    1. Answer the user's question about what gear they need.
    2. RECOMMEND specific items from the inventory if they match.
    3. Return a JSON object with your text response and a list of recommended IDs.

    Tone: Supportive, knowledgeable, safety-conscious.
  `;

  const chatHistory = history.map((msg: any) => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const chat = ai.chats.create({
    model,
    history: chatHistory,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING },
          recommendedListingIds: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["message", "recommendedListingIds"]
      }
    }
  });

  const parts: any[] = [{ text: userMessage }];
  if (image) {
    parts.unshift({ inlineData: { data: image.base64, mimeType: image.mimeType } });
  }

  const response = await chat.sendMessage({ message: parts });
  const text = response.text;
  if (!text) throw new Error("No response");
  return JSON.parse(text);
}

async function generateSmartReplies({ myRole, otherUserName, itemTitle, itemPrice, lastMessageText, fullHistory }: any) {
  const model = "gemini-2.5-flash-preview-05-20";
  const historyText = fullHistory.slice(-5).map((m: any) => m.text).join('\n');

  const textPrompt = `
    You are assisting a ${myRole} in a transaction for "${itemTitle}" ($${itemPrice}).
    The other person (${otherUserName}) just said: "${lastMessageText}".

    Conversation History:
    ${historyText}

    Task: Generate 3 short, natural, and helpful replies (max 10 words each) for me to click and send.
    - If they ask a question, answer it based on context (assume availability if unsure).
    - If they negotiate, offer a polite counter or acceptance.
    - If they suggest a time, confirm it.

    Return ONLY a JSON array of strings. Example: ["Yes, it is!", "I can do $40.", "5pm works."]
  `;

  const response = await ai.models.generateContent({
    model,
    contents: textPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text);
}

async function optimizeListingDescription({ draftDescription, title, category }: { draftDescription: string; title: string; category: string }) {
  const model = "gemini-2.5-flash-preview-05-20";
  const textPrompt = `
    I am a parent selling a "${title}" (${category}).
    My draft description is: "${draftDescription}"

    Please rewrite this to be:
    1. Friendly and trustworthy (parent-to-parent tone).
    2. Persuasive but honest.
    3. Cleanly formatted with bullet points for key features if applicable.
    4. Correct any spelling/grammar errors.

    Return only the new text string. Do not add quotes or preambles.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: textPrompt,
    config: { responseMimeType: "text/plain" }
  });

  return response.text?.trim() || null;
}

async function generateInspectionChecklist({ title, category }: { title: string; category: string }) {
  const model = "gemini-2.5-flash-preview-05-20";
  const textPrompt = `
    I am buying a used "${title}" (Category: ${category}) in person.
    Generate 4 specific, short inspection checks I should perform to ensure it is safe and functional.
    Focus on mechanical parts, safety labels, and common wear points.
    Do not be generic. Be specific to the item type.

    Example for Stroller: ["Test brakes on both wheels", "Fold and unfold mechanism", "Check harness buckle clicks", "Inspect wheels for cracks"]

    Return ONLY a JSON array of strings.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: textPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response");
  return JSON.parse(text);
}

async function summarizeUserReputation({ reviews, sellerName, isVerified, soldCount }: { reviews: any[]; sellerName: string; isVerified: boolean; soldCount: number }) {
  if (reviews.length === 0 && soldCount === 0) return null;

  const model = "gemini-2.5-flash-preview-05-20";
  const reviewTexts = reviews.map((r: any) => `"${r.comment}" (${r.rating}/5)`).join("\n");

  const textPrompt = `
    Summarize the reputation of seller "${sellerName}".

    Data:
    - Verified Parent: ${isVerified}
    - Items Sold: ${soldCount}
    - Reviews:
    ${reviewTexts}

    Task: Write a 2-sentence "Vibe Check" summary for a potential buyer.
    - Mention their reliability, responsiveness, or item quality based on reviews.
    - If verified, mention that adds trust.
    - Tone: Helpful, objective, and friendly.
    - Do NOT use flowery language. Just facts.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: textPrompt,
    config: { responseMimeType: "text/plain" }
  });

  return response.text?.trim() || null;
}

async function extractMeetingDetails({ messages }: { messages: any[] }) {
  if (messages.length < 2) return null;

  const model = "gemini-2.5-flash-preview-05-20";
  const history = messages.slice(-10).map((m: any) => m.text).join("\n");

  const textPrompt = `
    Analyze this chat history for a meetup agreement.

    Chat:
    ${history}

    Task:
    1. Determine if both parties have AGREED to a time and place.
    2. Extract the location and time.

    Return JSON:
    {
      "isAgreed": boolean,
      "location": "string (e.g. Starbucks)",
      "dateTime": "string (e.g. Tuesday at 5pm)",
      "summary": "string (e.g. Meet at Starbucks on Tuesday at 5pm)"
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: textPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isAgreed: { type: Type.BOOLEAN },
          location: { type: Type.STRING },
          dateTime: { type: Type.STRING },
          summary: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(text);
}
