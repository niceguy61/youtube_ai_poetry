export type Language = 
  | 'ko'  // Korean
  | 'en'  // English
  | 'ja'  // Japanese
  | 'zh'  // Chinese
  | 'fr'  // French
  | 'de'  // German
  | 'es'; // Spanish

export interface LanguageDefinition {
  code: Language;
  name: string;
  nativeName: string;
}
