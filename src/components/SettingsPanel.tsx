import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useSettingsStore } from '../stores/settingsStore';
import { PERSONA_LIST } from '../config/personas';
import { LANGUAGE_LIST } from '../config/languages';
import { isValidOpenAIApiKey } from '../utils/validation';
import type { AISettings } from '../stores/settingsStore';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, saveSettings } = useSettingsStore();
  
  // Local state for form management
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Hardcoded Ollama models list
  const ollamaModels = ['qwen3:4b', 'gemma3:4b'];

  // Load settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setHasChanges(false);
      setError(null);
    }
  }, [isOpen, settings]);

  const handleLocalSettingsChange = (partial: Partial<AISettings>) => {
    setLocalSettings(prev => ({ ...prev, ...partial }));
    setHasChanges(true);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    
    // Validate OpenAI API key if OpenAI is selected
    if (localSettings.provider === 'openai') {
      if (!localSettings.openaiApiKey) {
        const errorMsg = 'OpenAI API key is required when using OpenAI provider';
        setError(errorMsg);
        toast.error('Validation Error', {
          description: errorMsg,
          duration: 4000,
        });
        return;
      }
      
      if (!isValidOpenAIApiKey(localSettings.openaiApiKey)) {
        const errorMsg = 'Invalid API key format. OpenAI keys start with "sk-" and are at least 20 characters.';
        setError(errorMsg);
        toast.error('Invalid API Key', {
          description: errorMsg,
          duration: 4000,
        });
        return;
      }
    }
    
    setIsSaving(true);
    
    try {
      // Update store
      updateSettings(localSettings);
      
      // Persist to localStorage
      await saveSettings();
      
      setHasChanges(false);
      toast.success('Settings Saved', {
        description: 'Your AI settings have been saved successfully',
        duration: 3000,
      });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      toast.error('Save Failed', {
        description: errorMessage,
        duration: 5000,
      });
      console.error('[SettingsPanel] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Revert to original settings
    setLocalSettings(settings);
    setHasChanges(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Settings
          </DialogTitle>
          <DialogDescription>
            Customize your poetry generation experience with different personas, languages, and AI providers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Persona Selector */}
          <div className="grid gap-2">
            <Label htmlFor="persona">Persona</Label>
            <Select
              value={localSettings.persona}
              onValueChange={(value) => handleLocalSettingsChange({ persona: value as any })}
            >
              <SelectTrigger id="persona">
                <SelectValue placeholder="Select a persona" />
              </SelectTrigger>
              <SelectContent>
                {PERSONA_LIST.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    {persona.name} ({persona.nameKo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {PERSONA_LIST.find(p => p.id === localSettings.persona)?.description}
            </p>
          </div>

          {/* Language Selector */}
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={localSettings.language}
              onValueChange={(value) => handleLocalSettingsChange({ language: value as any })}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_LIST.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Provider Selector */}
          <div className="grid gap-2">
            <Label>AI Provider</Label>
            <ToggleGroup
              type="single"
              value={localSettings.provider}
              onValueChange={(value) => {
                if (value) {
                  handleLocalSettingsChange({ provider: value as 'ollama' | 'openai' });
                }
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="ollama" aria-label="Use Ollama">
                Ollama
              </ToggleGroupItem>
              <ToggleGroupItem value="openai" aria-label="Use OpenAI">
                OpenAI
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Conditional: Ollama Model Selector */}
          {localSettings.provider === 'ollama' && (
            <div className="grid gap-2">
              <Label htmlFor="ollama-model">Ollama Model</Label>
              <Select
                value={localSettings.ollamaModel}
                onValueChange={(value) => handleLocalSettingsChange({ ollamaModel: value })}
              >
                <SelectTrigger id="ollama-model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {ollamaModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Available models: {ollamaModels.join(', ')}
              </p>
            </div>
          )}

          {/* Conditional: OpenAI Configuration */}
          {localSettings.provider === 'openai' && (
            <>
              {/* OpenAI Model Selector */}
              <div className="grid gap-2">
                <Label htmlFor="openai-model">OpenAI Model</Label>
                <Select
                  value={localSettings.ollamaModel || 'gpt-3.5-turbo'}
                  onValueChange={(value) => handleLocalSettingsChange({ ollamaModel: value })}
                >
                  <SelectTrigger id="openai-model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  GPT-4 provides better quality but costs more. GPT-3.5 Turbo is faster and cheaper.
                </p>
              </div>

              {/* OpenAI API Key Input */}
              <div className="grid gap-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={localSettings.openaiApiKey || ''}
                  onChange={(e) => handleLocalSettingsChange({ openaiApiKey: e.target.value })}
                  error={error?.includes('API key') ? true : false}
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is encrypted and stored locally in your browser.
                </p>
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="text-sm text-destructive p-2 border border-destructive rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
