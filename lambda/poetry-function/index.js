/**
 * Poetry Generation Lambda Function
 * 
 * Generates AI poetry using AWS Bedrock (Claude models) based on audio features.
 * Supports multiple personas and languages.
 * 
 * Handler: exports.handler
 * Runtime: Node.js 20.x
 * Memory: 512MB
 * Timeout: 30 seconds
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION || 'us-east-1'
});

/**
 * Lambda handler for poetry generation
 */
export const handler = async (event, context) => {
  console.log('[Poetry] Request received:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { 
      audioFeatures, 
      persona = 'hamlet', 
      language = 'ko',
      model = 'anthropic.claude-3-haiku-20240307-v1:0'
    } = body;

    // Validate required fields
    if (!audioFeatures) {
      return errorResponse(400, 'Audio features are required');
    }

    console.log(`[Poetry] Generating - Persona: ${persona}, Language: ${language}, Model: ${model}`);

    // Build poetry prompt
    const prompt = buildPoetryPrompt(audioFeatures, persona, language);

    // Generate poetry with Bedrock
    const poetry = await generateWithBedrock(prompt, model);

    console.log(`[Poetry] Success - Generated ${poetry.length} characters`);

    return successResponse({
      success: true,
      poetry
    });

  } catch (error) {
    console.error('[Poetry] Error:', error);

    // Handle specific error types
    if (error.name === 'AccessDeniedException') {
      return errorResponse(403, 'Bedrock access denied', 'Please check IAM permissions');
    }

    if (error.name === 'ValidationException') {
      return errorResponse(400, 'Invalid request', error.message);
    }

    return errorResponse(500, 'Poetry generation failed', error.message);
  }
};

/**
 * Generate poetry using AWS Bedrock
 */
async function generateWithBedrock(prompt, modelId) {
  try {
    // Prepare request for Claude models
    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    console.log('[Poetry] Invoking Bedrock model:', modelId);
    const response = await bedrockClient.send(command);

    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract poetry from Claude response
    const poetry = responseBody.content?.[0]?.text || '';

    if (!poetry || poetry.trim() === '') {
      throw new Error('Empty response from Bedrock');
    }

    return poetry.trim();

  } catch (error) {
    console.error('[Poetry] Bedrock error:', error);
    throw error;
  }
}

/**
 * Build poetry generation prompt based on audio features, persona, and language
 */
function buildPoetryPrompt(audioFeatures, persona, language) {
  const { tempo, energy, mood, intensity, valence, spectralCentroid, key } = audioFeatures;

  // Calculate derived characteristics
  const paceDescription = tempo < 90 ? 'slow' : tempo < 120 ? 'moderate' : 'fast';
  const energyDesc = energy < 0.3 ? 'very calm' : energy < 0.6 ? 'moderate' : 'very energetic';
  const intensityPercent = Math.round((intensity || energy) * 100);
  const intensityDesc = intensityPercent < 30 ? 'very soft' : intensityPercent < 60 ? 'moderate' : 'very intense';
  const emotionalTone = valence > 0.6 ? 'positive' : valence < 0.4 ? 'melancholic' : 'neutral';

  // Persona characteristics
  const personaPrompts = {
    'hamlet': {
      description: 'the contemplative Danish prince',
      style: 'exploring existential themes with melancholic introspection'
    },
    'nietzsche': {
      description: 'the bold German philosopher',
      style: 'challenging conventional wisdom with powerful declarations'
    },
    'yi-sang': {
      description: 'the surreal Korean modernist (이상)',
      style: 'with fragmented imagery and geometric metaphors'
    },
    'baudelaire': {
      description: 'the decadent French symbolist',
      style: 'exploring beauty in darkness with rich sensory imagery'
    },
    'rimbaud': {
      description: 'the rebellious French visionary',
      style: 'with vivid synesthetic imagery and youthful energy'
    },
    'kim-soo-young': {
      description: 'the socially conscious Korean poet (김수영)',
      style: 'with direct observations and themes of freedom'
    },
    'yun-dong-ju': {
      description: 'the pure-hearted Korean poet (윤동주)',
      style: 'with gentle introspection and moral clarity'
    },
    'edgar-allan-poe': {
      description: 'the dark American Gothic master',
      style: 'with haunting atmosphere and psychological intensity'
    },
    'oscar-wilde': {
      description: 'the witty Irish aesthete',
      style: 'celebrating beauty with clever paradoxes'
    },
    'kafka': {
      description: 'the absurdist Czech-German writer',
      style: 'exploring alienation with nightmarish logic'
    },
    'baek-seok': {
      description: 'the nostalgic Korean poet (백석)',
      style: 'with warm rural imagery and traditional elements'
    }
  };

  // Language instructions
  const languageInstructions = {
    'ko': 'Korean (한국어)',
    'en': 'English',
    'ja': 'Japanese (日本語)',
    'zh': 'Chinese (中文)',
    'fr': 'French (Français)',
    'de': 'German (Deutsch)',
    'es': 'Spanish (Español)'
  };

  const personaInfo = personaPrompts[persona] || personaPrompts['hamlet'];
  const languageName = languageInstructions[language] || 'Korean';

  return `You are ${personaInfo.description}, ${personaInfo.style}. Write ONLY the poem in ${languageName}.

MUSIC CHARACTERISTICS:
- Tempo: ${tempo} BPM (${paceDescription} pace)
- Intensity: ${intensityPercent}% (${intensityDesc}) - THIS IS THE DOMINANT CHARACTERISTIC
- PRIMARY MOOD: ${mood.toUpperCase()} - This should be the dominant feeling
- Energy level: ${energy.toFixed(2)} (${energyDesc}) - secondary characteristic
- Emotional tone: ${emotionalTone}
- Key: ${key || 'Unknown'}
- Brightness: ${spectralCentroid ? spectralCentroid.toFixed(2) : 'N/A'}

IMPORTANT REQUIREMENTS:
1. The poem MUST reflect the PRIMARY MOOD (${mood}) and intensity level
2. Write 400-550 characters (approximately 12-16 lines in ${languageName})
3. Do not write short poems
4. Output ONLY the poem, nothing else (no titles, no explanations, no notes)
5. Do NOT write "Here is a poem" or any introduction
6. Do NOT include explanations or commentary
7. Do NOT ask questions like "Would you like me to"

NOW OUTPUT ONLY THE POEM:`;
}

/**
 * Success response helper
 */
function successResponse(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(data)
  };
}

/**
 * Error response helper
 */
function errorResponse(statusCode, error, details = null) {
  const response = {
    error,
    ...(details && { details })
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(response)
  };
}
