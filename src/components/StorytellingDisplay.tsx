/**
 * StorytellingDisplay Component
 * 
 * Displays storytelling messages and narrative elements throughout the experience.
 * Shows introduction, analysis messages, transitions, guidance hints, and summaries.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useEffect, useState } from 'react';
import type { StorytellingMessage } from '../core/StorytellingManager';

interface StorytellingDisplayProps {
  currentMessage: StorytellingMessage | null;
  className?: string;
}

export function StorytellingDisplay({ currentMessage, className = '' }: StorytellingDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayMessage, setDisplayMessage] = useState<StorytellingMessage | null>(null);

  // Show message with fade-in animation
  useEffect(() => {
    if (currentMessage) {
      setDisplayMessage(currentMessage);
      setIsVisible(true);

      // Auto-hide after duration based on message type
      const duration = getMessageDuration(currentMessage.type);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [currentMessage]);

  // Clear display message after fade-out
  useEffect(() => {
    if (!isVisible && displayMessage) {
      const timer = setTimeout(() => {
        setDisplayMessage(null);
      }, 500); // Match fade-out duration

      return () => clearTimeout(timer);
    }
  }, [isVisible, displayMessage]);

  if (!displayMessage) {
    return null;
  }

  const messageStyles = getMessageStyles(displayMessage.type);

  return (
    <div
      className={`
        fixed top-20 left-1/2 transform -translate-x-1/2 z-50
        max-w-2xl w-full px-4
        transition-all duration-500 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        ${className}
      `}
    >
      <div
        className={`
          ${messageStyles.bg}
          ${messageStyles.border}
          ${messageStyles.text}
          rounded-lg shadow-2xl p-6
          backdrop-blur-sm
        `}
      >
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${messageStyles.icon}`}>
            {getMessageIcon(displayMessage.type)}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-semibold mb-1 ${messageStyles.label}`}>
              {getMessageLabel(displayMessage.type)}
            </div>
            <div className="text-base leading-relaxed whitespace-pre-line">
              {displayMessage.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get display duration based on message type
 */
function getMessageDuration(type: StorytellingMessage['type']): number {
  switch (type) {
    case 'introduction':
      return 8000; // 8 seconds for introduction
    case 'summary':
      return 15000; // 15 seconds for summary
    case 'analysis':
      return 4000; // 4 seconds for analysis messages
    case 'transition':
      return 3000; // 3 seconds for transitions
    case 'guidance':
      return 6000; // 6 seconds for guidance hints
    default:
      return 5000;
  }
}

/**
 * Get styling based on message type
 */
function getMessageStyles(type: StorytellingMessage['type']) {
  switch (type) {
    case 'introduction':
      return {
        bg: 'bg-gradient-to-r from-purple-900/90 to-blue-900/90',
        border: 'border-2 border-purple-400/50',
        text: 'text-white',
        label: 'text-purple-300',
        icon: 'text-purple-300',
      };
    case 'analysis':
      return {
        bg: 'bg-gradient-to-r from-blue-900/90 to-indigo-900/90',
        border: 'border-2 border-blue-400/50',
        text: 'text-white',
        label: 'text-blue-300',
        icon: 'text-blue-300',
      };
    case 'transition':
      return {
        bg: 'bg-gradient-to-r from-indigo-900/90 to-purple-900/90',
        border: 'border-2 border-indigo-400/50',
        text: 'text-white',
        label: 'text-indigo-300',
        icon: 'text-indigo-300',
      };
    case 'guidance':
      return {
        bg: 'bg-gradient-to-r from-teal-900/90 to-cyan-900/90',
        border: 'border-2 border-teal-400/50',
        text: 'text-white',
        label: 'text-teal-300',
        icon: 'text-teal-300',
      };
    case 'summary':
      return {
        bg: 'bg-gradient-to-r from-amber-900/90 to-orange-900/90',
        border: 'border-2 border-amber-400/50',
        text: 'text-white',
        label: 'text-amber-300',
        icon: 'text-amber-300',
      };
    default:
      return {
        bg: 'bg-gray-900/90',
        border: 'border-2 border-gray-400/50',
        text: 'text-white',
        label: 'text-gray-300',
        icon: 'text-gray-300',
      };
  }
}

/**
 * Get icon for message type
 */
function getMessageIcon(type: StorytellingMessage['type']) {
  switch (type) {
    case 'introduction':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'analysis':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'transition':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      );
    case 'guidance':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'summary':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

/**
 * Get label for message type
 */
function getMessageLabel(type: StorytellingMessage['type']): string {
  switch (type) {
    case 'introduction':
      return 'Welcome';
    case 'analysis':
      return 'Processing';
    case 'transition':
      return 'Transition';
    case 'guidance':
      return 'Hint';
    case 'summary':
      return 'Experience Summary';
    default:
      return 'Message';
  }
}
