/**
 * Simple test script for the poetry generation endpoint
 * Run with: node test-poetry-endpoint.js
 */

const testPoetryEndpoint = async () => {
  const baseUrl = 'http://localhost:3001';
  
  console.log('Testing Poetry Generation Endpoint...\n');

  // Test 1: Missing audio features
  console.log('Test 1: Missing audio features (should return 400)');
  try {
    const response = await fetch(`${baseUrl}/api/poetry/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    console.log(response.status === 400 ? '✅ PASS\n' : '❌ FAIL\n');
  } catch (error) {
    console.log('❌ FAIL:', error.message, '\n');
  }

  // Test 2: Ollama provider with valid data
  console.log('Test 2: Ollama provider with valid audio features');
  try {
    const response = await fetch(`${baseUrl}/api/poetry/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioFeatures: {
          tempo: 120,
          energy: 0.75,
          mood: 'energetic',
          spectralCentroid: 2000,
          key: 'C major'
        },
        persona: 'hamlet',
        language: 'en',
        provider: 'ollama',
        model: 'gemma3:4b'
      })
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    console.log(response.status === 200 || response.status === 503 ? '✅ PASS (or Ollama unavailable)\n' : '❌ FAIL\n');
  } catch (error) {
    console.log('❌ FAIL:', error.message, '\n');
  }

  // Test 3: OpenAI provider without API key
  console.log('Test 3: OpenAI provider without API key (should return 400)');
  try {
    const response = await fetch(`${baseUrl}/api/poetry/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioFeatures: {
          tempo: 120,
          energy: 0.75,
          mood: 'energetic'
        },
        provider: 'openai'
      })
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    console.log(response.status === 400 ? '✅ PASS\n' : '❌ FAIL\n');
  } catch (error) {
    console.log('❌ FAIL:', error.message, '\n');
  }

  // Test 4: OpenAI provider with invalid API key
  console.log('Test 4: OpenAI provider with invalid API key (should return 401)');
  try {
    const response = await fetch(`${baseUrl}/api/poetry/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioFeatures: {
          tempo: 120,
          energy: 0.75,
          mood: 'energetic'
        },
        provider: 'openai',
        apiKey: 'invalid-key-12345'
      })
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    console.log(response.status === 401 ? '✅ PASS\n' : '❌ FAIL\n');
  } catch (error) {
    console.log('❌ FAIL:', error.message, '\n');
  }

  // Test 5: Different persona and language
  console.log('Test 5: Different persona (Nietzsche) and language (German)');
  try {
    const response = await fetch(`${baseUrl}/api/poetry/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioFeatures: {
          tempo: 90,
          energy: 0.5,
          mood: 'contemplative',
          spectralCentroid: 1500,
          key: 'D minor'
        },
        persona: 'nietzsche',
        language: 'de',
        provider: 'ollama',
        model: 'gemma3:4b'
      })
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    console.log(response.status === 200 || response.status === 503 ? '✅ PASS (or Ollama unavailable)\n' : '❌ FAIL\n');
  } catch (error) {
    console.log('❌ FAIL:', error.message, '\n');
  }

  console.log('Testing complete!');
};

// Run tests
testPoetryEndpoint().catch(console.error);
