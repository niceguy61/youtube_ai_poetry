import { create } from 'zustand';
import type { Persona } from '../types/persona';
import type { Language } from '../types/language';

export interface AISettings {
  persona: Persona;
  language: Language;
  provider: 'ollama' | 'openai';
  ollamaModel: string;
  openaiApiKey: string | null;
}

interface StoredSettings {
  version: string;
  persona: Persona;
  language: Language;
  provider: 'ollama' | 'openai';
  ollamaModel: string;
  openaiApiKey: string | null; // Encrypted
}

interface SettingsStore {
  settings: AISettings;
  updateSettings: (partial: Partial<AISettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'music-poetry-canvas-settings';
const STORAGE_VERSION = '1.0';
const ENCRYPTION_KEY_NAME = 'music-poetry-canvas-encryption-key';

// Default settings as per requirements
const DEFAULT_SETTINGS: AISettings = {
  persona: 'hamlet',
  language: 'ko',
  provider: 'ollama',
  ollamaModel: 'qwen3:4b',
  openaiApiKey: null
};

/**
 * Generate or retrieve encryption key for API key storage
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Try to retrieve existing key from IndexedDB
  const db = await openDatabase();
  const existingKey = await getStoredKey(db);
  
  if (existingKey) {
    return existingKey;
  }
  
  // Generate new key if none exists
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Store the key
  await storeKey(db, key);
  
  return key;
}

/**
 * Open IndexedDB for key storage
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('music-poetry-canvas-keys', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys');
      }
    };
  });
}

/**
 * Retrieve stored encryption key from IndexedDB
 */
async function getStoredKey(db: IDBDatabase): Promise<CryptoKey | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['keys'], 'readonly');
    const store = transaction.objectStore('keys');
    const request = store.get(ENCRYPTION_KEY_NAME);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = async () => {
      if (!request.result) {
        resolve(null);
        return;
      }
      
      try {
        const key = await crypto.subtle.importKey(
          'jwk',
          request.result,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        resolve(key);
      } catch (error) {
        console.error('[SettingsStore] Failed to import key:', error);
        resolve(null);
      }
    };
  });
}

/**
 * Store encryption key in IndexedDB
 */
async function storeKey(db: IDBDatabase, key: CryptoKey): Promise<void> {
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['keys'], 'readwrite');
    const store = transaction.objectStore('keys');
    const request = store.put(exportedKey, ENCRYPTION_KEY_NAME);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Encrypt API key using Web Crypto API
 */
async function encryptApiKey(apiKey: string): Promise<string> {
  if (!apiKey) return '';
  
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedKey = new TextEncoder().encode(apiKey);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedKey
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    console.error('[SettingsStore] Encryption failed:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypt API key using Web Crypto API
 */
async function decryptApiKey(encryptedKey: string): Promise<string> {
  if (!encryptedKey) return '';
  
  try {
    const key = await getEncryptionKey();
    
    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('[SettingsStore] Decryption failed:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Load settings from localStorage
 */
async function loadFromStorage(): Promise<AISettings> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }
    
    const parsed: StoredSettings = JSON.parse(stored);
    
    // Handle version migrations if needed
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('[SettingsStore] Settings version mismatch, using defaults');
      return { ...DEFAULT_SETTINGS };
    }
    
    // Decrypt API key if present
    let decryptedApiKey: string | null = null;
    if (parsed.openaiApiKey) {
      try {
        decryptedApiKey = await decryptApiKey(parsed.openaiApiKey);
      } catch (error) {
        console.error('[SettingsStore] Failed to decrypt API key, clearing it');
        decryptedApiKey = null;
      }
    }
    
    return {
      persona: parsed.persona,
      language: parsed.language,
      provider: parsed.provider,
      ollamaModel: parsed.ollamaModel,
      openaiApiKey: decryptedApiKey
    };
  } catch (error) {
    console.error('[SettingsStore] Failed to load settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to localStorage
 */
async function saveToStorage(settings: AISettings): Promise<void> {
  try {
    // Encrypt API key if present
    let encryptedApiKey: string | null = null;
    if (settings.openaiApiKey) {
      encryptedApiKey = await encryptApiKey(settings.openaiApiKey);
    }
    
    const toStore: StoredSettings = {
      version: STORAGE_VERSION,
      persona: settings.persona,
      language: settings.language,
      provider: settings.provider,
      ollamaModel: settings.ollamaModel,
      openaiApiKey: encryptedApiKey
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('[SettingsStore] Failed to save settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Create the Zustand store
 */
export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  
  updateSettings: (partial: Partial<AISettings>) => {
    set((state) => {
      const newSettings = {
        ...state.settings,
        ...partial
      };
      
      // If provider changed, set appropriate default model
      if (partial.provider && partial.provider !== state.settings.provider) {
        if (partial.provider === 'openai' && !partial.ollamaModel) {
          newSettings.ollamaModel = 'gpt-3.5-turbo';
        } else if (partial.provider === 'ollama' && !partial.ollamaModel) {
          newSettings.ollamaModel = 'qwen3:4b';
        }
      }
      
      return { settings: newSettings };
    });
  },
  
  loadSettings: async () => {
    try {
      const loaded = await loadFromStorage();
      set({ settings: loaded });
    } catch (error) {
      console.error('[SettingsStore] Load failed, using defaults:', error);
      set({ settings: { ...DEFAULT_SETTINGS } });
    }
  },
  
  saveSettings: async () => {
    try {
      const { settings } = get();
      await saveToStorage(settings);
    } catch (error) {
      console.error('[SettingsStore] Save failed:', error);
      throw error;
    }
  },
  
  resetToDefaults: () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
  }
}));
