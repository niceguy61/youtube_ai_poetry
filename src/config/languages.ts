import type { Language, LanguageDefinition } from '../types/language';

export const LANGUAGES: Record<Language, LanguageDefinition> = {
  'ko': {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어'
  },
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English'
  },
  'ja': {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語'
  },
  'zh': {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文'
  },
  'fr': {
    code: 'fr',
    name: 'French',
    nativeName: 'Français'
  },
  'de': {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch'
  },
  'es': {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español'
  }
};

export const LANGUAGE_LIST: LanguageDefinition[] = Object.values(LANGUAGES);

export const getLanguage = (code: Language): LanguageDefinition => {
  return LANGUAGES[code];
};
