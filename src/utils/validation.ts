/**
 * Validation utility functions
 */

/**
 * Validates if a duration is within the acceptable limit
 * @param duration Duration in seconds
 * @param maxDuration Maximum allowed duration in seconds (default: 300)
 * @returns true if duration is valid, false otherwise
 */
export function isValidDuration(duration: number, maxDuration: number = 300): boolean {
  return duration > 0 && duration <= maxDuration;
}

/**
 * Validates if a URL is a valid HTTP/HTTPS URL
 * @param url URL string to validate
 * @returns true if URL is valid, false otherwise
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates if a file has an accepted audio format
 * @param filename Filename to check
 * @returns true if file has valid audio extension
 */
export function isValidAudioFile(filename: string): boolean {
  const validExtensions = ['.mp3', '.ogg'];
  const lowerFilename = filename.toLowerCase();
  return validExtensions.some(ext => lowerFilename.endsWith(ext));
}

/**
 * Validates OpenAI API key format
 * OpenAI API keys start with 'sk-' and are at least 20 characters long
 * @param apiKey API key string to validate
 * @returns true if API key format is valid, false otherwise
 */
export function isValidOpenAIApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // OpenAI API keys start with 'sk-' and are at least 20 characters
  return apiKey.startsWith('sk-') && apiKey.length >= 20;
}
