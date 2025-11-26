/**
 * Duration Validator Service
 * 
 * Validates audio duration before processing to enforce the 5-minute limit.
 * Requirements: 1.4, 1.5, 1.6
 */

import type { ValidationResult } from '../types/audio';
import { CONFIG } from '../config/config';

/**
 * DurationValidator class
 * 
 * Responsible for validating audio duration against the system's 5-minute limit.
 * This ensures that only audio files within the acceptable duration range are processed.
 */
export class DurationValidator {
  /**
   * Validates the duration of an audio source
   * 
   * @param duration - The duration in seconds to validate
   * @returns ValidationResult containing validation status, duration, and optional message
   * 
   * @example
   * ```typescript
   * const validator = new DurationValidator();
   * const result = validator.validate(250); // Valid
   * const result2 = validator.validate(350); // Invalid
   * ```
   */
  validate(duration: number): ValidationResult {
    const maxDuration = CONFIG.audio.MAX_DURATION;
    
    if (duration > maxDuration) {
      return {
        isValid: false,
        duration,
        message: `Audio duration (${duration}s) exceeds the maximum limit of ${maxDuration}s (5 minutes). Please use a shorter audio file.`
      };
    }

    return {
      isValid: true,
      duration
    };
  }

  /**
   * Returns the maximum allowed duration in seconds
   * 
   * @returns The maximum duration (300 seconds / 5 minutes)
   */
  getMaxDuration(): number {
    return CONFIG.audio.MAX_DURATION;
  }
}
