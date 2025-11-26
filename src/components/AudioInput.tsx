import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AudioInputProps {
  onUrlSubmit: (url: string) => void;
  isLoading?: boolean;
}

export const AudioInput: React.FC<AudioInputProps> = ({
  onUrlSubmit,
  isLoading = false
}) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && url.trim()) {
      e.preventDefault();
      onUrlSubmit(url.trim());
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Audio Source</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="relative w-full">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste a YouTube link and press Enter..."
              disabled={isLoading}
              aria-busy={isLoading}
              style={{
                width: '100%',
                padding: isLoading ? '1rem 3rem 1rem 1.25rem' : '1rem 1.25rem',
                fontSize: '1.125rem',
                lineHeight: '1.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '0.75rem',
                color: '#1a1a1a',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease-in-out',
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
                e.target.style.borderColor = '#FF0000';
                e.target.style.outline = 'none';
                e.target.style.boxShadow = '0 0 0 2px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseEnter={(e) => {
                if (document.activeElement !== e.target) {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.07)';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.target) {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                }
              }}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="animate-spin h-5 w-5 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
