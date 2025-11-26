/**
 * Duration Validator Tests
 * 
 * Tests for the DurationValidator service
 */

import { describe, it, expect } from 'vitest';
import { DurationValidator } from './DurationValidator';

describe('DurationValidator', () => {
  describe('validate', () => {
    it('should reject audio longer than 5 minutes', () => {
      const validator = new DurationValidator();
      const result = validator.validate(301); // 5:01
      
      expect(result.isValid).toBe(false);
      expect(result.duration).toBe(301);
      expect(result.message).toBeDefined();
      expect(result.message).toContain('exceeds the maximum limit');
    });

    it('should accept audio exactly at 5 minutes', () => {
      const validator = new DurationValidator();
      const result = validator.validate(300); // 5:00
      
      expect(result.isValid).toBe(true);
      expect(result.duration).toBe(300);
      expect(result.message).toBeUndefined();
    });

    it('should accept audio shorter than 5 minutes', () => {
      const validator = new DurationValidator();
      const result = validator.validate(250); // 4:10
      
      expect(result.isValid).toBe(true);
      expect(result.duration).toBe(250);
      expect(result.message).toBeUndefined();
    });

    it('should accept very short audio', () => {
      const validator = new DurationValidator();
      const result = validator.validate(10); // 10 seconds
      
      expect(result.isValid).toBe(true);
      expect(result.duration).toBe(10);
    });

    it('should reject audio significantly longer than 5 minutes', () => {
      const validator = new DurationValidator();
      const result = validator.validate(600); // 10 minutes
      
      expect(result.isValid).toBe(false);
      expect(result.duration).toBe(600);
      expect(result.message).toBeDefined();
    });

    it('should handle zero duration', () => {
      const validator = new DurationValidator();
      const result = validator.validate(0);
      
      expect(result.isValid).toBe(true);
      expect(result.duration).toBe(0);
    });
  });

  describe('getMaxDuration', () => {
    it('should return 300 seconds (5 minutes)', () => {
      const validator = new DurationValidator();
      
      expect(validator.getMaxDuration()).toBe(300);
    });
  });
});
