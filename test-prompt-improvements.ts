/**
 * Test script to verify prompt improvements for contradictory audio signals
 */

import { PoetryGenerator } from './src/services/PoetryGenerator';
import type { AudioFeatures } from './src/types/audio';

// Test case: The problematic scenario from the user
const testFeatures: AudioFeatures = {
  tempo: 108,
  energy: 0.17,  // Very low energy
  valence: 0.65, // Positive
  intensity: 0.84, // Very high intensity (84%)
  mood: 'upbeat', // From librosa
  key: 'F',
  complexity: 0.75,
  spectralCentroid: 2000,
  zeroCrossingRate: 0.1,
  duration: 180,
};

async function testPromptGeneration() {
  console.log('Testing prompt generation with contradictory signals...\n');
  
  const generator = new PoetryGenerator({
    persona: 'yoon-dong-ju',
    language: 'ko',
    provider: 'ollama',
    model: 'gemma3:4b',
  });

  // Access the private buildAudioPrompt method via reflection
  // @ts-ignore - accessing private method for testing
  const prompt = generator['buildAudioPrompt'](testFeatures);
  
  console.log('Generated Prompt:');
  console.log('='.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80));
  console.log('\nKey improvements:');
  console.log('✓ Intensity (84%) is now explicitly mentioned');
  console.log('✓ Mood "upbeat" is emphasized as PRIMARY MOOD');
  console.log('✓ Energy (0.17) is separated from intensity');
  console.log('✓ Clear instruction to reflect the PRIMARY MOOD');
  
  // Check that the prompt contains the expected improvements
  const checks = [
    { test: prompt.includes('Intensity:'), label: 'Intensity mentioned' },
    { test: prompt.includes('84%'), label: 'Intensity percentage shown' },
    { test: prompt.includes('PRIMARY MOOD'), label: 'Mood emphasized' },
    { test: prompt.includes('UPBEAT'), label: 'Upbeat mood in caps' },
    { test: prompt.includes('DOMINANT CHARACTERISTIC'), label: 'Intensity marked as dominant' },
  ];
  
  console.log('\nValidation:');
  checks.forEach(({ test, label }) => {
    console.log(`${test ? '✓' : '✗'} ${label}`);
  });
  
  const allPassed = checks.every(c => c.test);
  console.log(`\n${allPassed ? '✓ All checks passed!' : '✗ Some checks failed'}`);
}

testPromptGeneration().catch(console.error);
