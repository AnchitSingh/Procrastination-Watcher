// Chrome AI Integration for Activity Monitoring

let session = null;
let modelParams = null;

function getLanguageModel() {
    if (globalThis.LanguageModel) return globalThis.LanguageModel;
    if (typeof chrome !== 'undefined' && chrome?.aiOriginTrial?.languageModel) {
        return chrome.aiOriginTrial.languageModel;
    }
    return null;
}

async function checkAvailability() {
    try {
        const LM = getLanguageModel();
        if (!LM) {
            console.warn('LanguageModel API not found');
            return { available: false, status: 'no-api', detail: null };
        }

        // Check if the API is accessible before calling availability
        if (typeof LM.availability !== 'function') {
            console.error('LanguageModel.availability is not a function');
            return {
                available: false,
                status: 'error',
                detail: null,
                error: 'LanguageModel.availability is not a function'
            };
        }

        // Call availability with timeout to prevent hanging
        const availabilityPromise = LM.availability();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Availability check timeout')), 5000)
        );
        
        const availability = await Promise.race([availabilityPromise, timeoutPromise]);
        
        console.log('AI availability status:', availability);
        
        return {
            available: availability !== 'unavailable',
            status: availability,
            detail: null
        };
    } catch (error) {
        console.error('Availability check error:', error);
        return {
            available: false,
            status: 'error',
            detail: null,
            error: error?.message || 'Availability check failed'
        };
    }
}

async function createSessionIfNeeded() {
  if (session) return session;
  
  const LanguageModel = getLanguageModel();
  
  if (!LanguageModel) {
    throw new Error('Chrome Built-in AI not available');
  }
  
  const status = await LanguageModel.availability();
  
  if (status === 'unavailable') {
    throw new Error('AI model unavailable on this device');
  }
  
  session = await LanguageModel.create({
    initialPrompts: [
      {
        role: 'system',
        content: `You are a productivity assistant called Procrastination Watcher.
Your job is to analyze whether the user's current activity aligns with their stated goal.

Rules:
1. Be understanding but firm - procrastination is natural but needs gentle correction
2. Consider context: YouTube can be work-related (tutorials), Reddit can be research
3. Return ONLY valid JSON - no markdown, no explanations
4. Be concise and encouraging in your reasoning`
      }
    ],
    expectedInputs: [
      { type: 'text' },
      { type: 'image' }
    ],
    expectedOutputs: [
      { type: 'text', languages: ['en'] }
    ]
  });
  
  console.log('✅ Procrastination Watcher session created');
  return session;
}

/**
 * Analyze user activity with multimodal input
 * @param {Object} params
 * @param {string} params.userGoal - What user said they'd work on
 * @param {string} params.tabUrl - Current tab URL
 * @param {string} params.tabTitle - Current tab title
 * @param {Blob} params.screenshot - Screenshot of visible tab
 * @returns {Promise<Object>} - { onTrack: boolean, reason: string }
 */
export async function analyzeActivity({ userGoal, tabUrl, tabTitle, screenshot }) {
  const s = await createSessionIfNeeded();
  
  const prompt = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          value: `User's stated goal: "${userGoal}"

Current activity:
- URL: ${tabUrl}
- Title: ${tabTitle}

Analyze if this activity aligns with the goal. Consider:
- Is the content relevant to the goal?
- Could this be legitimate work/research?
- Or is this clear procrastination?

Return ONLY JSON:
{
  "onTrack": true/false,
  "confidence": 0-100,
  "reason": "brief explanation (max 60 chars)"
}`
        },
        {
          type: 'image',
          value: screenshot
        }
      ]
    }
  ];
  
  try {
    const result = await s.prompt(prompt);
    const cleaned = sanitizeJSON(result);
    await resetSession();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Analysis error:', error);
    await resetSession();
    throw error;
  }
}

function sanitizeJSON(rawText) {
  if (!rawText) {
    throw new Error('Empty AI response');
  }
  
  let cleaned = rawText.trim();
  
  // Remove markdown fences
  cleaned = cleaned.replace(/```\s*/g, '');
  
  // Extract JSON
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}


export async function getModelParams() {
    const LanguageModel = getLanguageModel();
    if (!LanguageModel) return null;
    
    try {
        return await LanguageModel.params();
    } catch (error) {
        console.error('Failed to get model params:', error);
        return null;
    }
}


// Session management
export async function resetSession() {
    if (session) {
        session.destroy();
        session = null;
    }
}

export async function cloneSession() {
    if (!session) throw new Error('No active session to clone');
    return await session.clone();
}

// Public API
export async function available() {
    return await checkAvailability();
}

// Additional utilities
export async function getModelInfo() {
    const LM = getLanguageModel();
    if (!LM) return null;

    try {
        const params = await LM.params();
        return {
            defaultTemperature: params.defaultTemperature,
            maxTemperature: params.maxTemperature,
            defaultTopK: params.defaultTopK,
            maxTopK: params.maxTopK
        };
    } catch {
        return null;
    }
}


export default {
  checkAvailability,
  analyzeActivity,
  resetSession,
  getModelParams,
  getModelInfo,
  available
};
