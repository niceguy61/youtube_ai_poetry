import { useState } from 'react';

interface ExportPanelProps {
  onExportPoetry: (format: 'txt' | 'json' | 'markdown') => void;
  onExportCanvas: (format: 'png' | 'jpg') => void;
  onExportExperience: () => void;
  onGenerateShareURL: () => void;
  hasPoetry?: boolean;
  hasCanvas?: boolean;
  isExporting?: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  onExportPoetry,
  onExportCanvas,
  onExportExperience,
  onGenerateShareURL,
  hasPoetry = false,
  hasCanvas = false,
  isExporting = false
}) => {
  const [poetryFormat, setPoetryFormat] = useState<'txt' | 'json' | 'markdown'>('txt');
  const [canvasFormat, setCanvasFormat] = useState<'png' | 'jpg'>('png');
  const [showShareURL, setShowShareURL] = useState(false);

  const handleExportPoetry = () => {
    onExportPoetry(poetryFormat);
  };

  const handleExportCanvas = () => {
    onExportCanvas(canvasFormat);
  };

  const handleGenerateShareURL = () => {
    onGenerateShareURL();
    setShowShareURL(true);
    setTimeout(() => setShowShareURL(false), 3000);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4 transition-colors hover:text-gray-100">Export & Share</h2>

      {/* Export Poetry */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-300 mb-2 flex items-center gap-2 transition-colors hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Export Poetry
        </h3>
        <div className="flex gap-2 mb-2">
          {(['txt', 'json', 'markdown'] as const).map((format) => (
            <button
              key={format}
              onClick={() => setPoetryFormat(format)}
              className={`px-3 py-1 rounded text-base font-semibold transition-colors ${
                poetryFormat === format
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              .{format}
            </button>
          ))}
        </div>
        <button
          onClick={handleExportPoetry}
          disabled={!hasPoetry || isExporting}
          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-base font-semibold flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Poetry
            </>
          )}
        </button>
      </div>

      {/* Export Canvas */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-300 mb-2 flex items-center gap-2 transition-colors hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Export Canvas
        </h3>
        <div className="flex gap-2 mb-2">
          {(['png', 'jpg'] as const).map((format) => (
            <button
              key={format}
              onClick={() => setCanvasFormat(format)}
              className={`px-3 py-1 rounded text-base font-semibold transition-colors ${
                canvasFormat === format
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              .{format}
            </button>
          ))}
        </div>
        <button
          onClick={handleExportCanvas}
          disabled={!hasCanvas || isExporting}
          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-base font-semibold flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Image
            </>
          )}
        </button>
      </div>

      {/* Export Complete Experience */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-300 mb-2 flex items-center gap-2 transition-colors hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Complete Experience
        </h3>
        <button
          onClick={onExportExperience}
          disabled={!hasPoetry && !hasCanvas || isExporting}
          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-base font-semibold flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export All Data
        </button>
      </div>

      {/* Share URL */}
      <div>
        <h3 className="text-base font-semibold text-gray-300 mb-2 flex items-center gap-2 transition-colors hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Experience
        </h3>
        <button
          onClick={handleGenerateShareURL}
          disabled={!hasPoetry && !hasCanvas || isExporting}
          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-base font-semibold flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Generate Share Link
        </button>
        
        {showShareURL && (
          <div className="mt-2 p-2 bg-green-500/20 border border-green-500/50 rounded text-base text-green-400 text-center">
            ✓ Share URL copied to clipboard!
          </div>
        )}
      </div>

      {/* Info */}
      {!hasPoetry && !hasCanvas && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
          <p className="text-sm text-yellow-400 text-center">
            Create poetry and visualizations to enable export
          </p>
        </div>
      )}
    </div>
  );
};
