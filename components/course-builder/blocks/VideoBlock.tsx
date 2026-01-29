import { useState, useMemo } from 'react';
import { Video, Play, Trash2, ExternalLink } from 'lucide-react';
import { VideoPageData } from '../../../types';

interface VideoBlockProps {
  data: VideoPageData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: VideoPageData) => void;
  onDelete: () => void;
}

function detectProvider(url: string): VideoPageData['provider'] {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (url.includes('loom.com')) {
    return 'loom';
  }
  return 'custom';
}

function getEmbedUrl(url: string, provider: VideoPageData['provider']): string | null {
  try {
    if (provider === 'youtube') {
      // Handle various YouTube URL formats
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0] || '';
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (provider === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/);
      const videoId = match?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    if (provider === 'loom') {
      const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
      const videoId = match?.[1];
      return videoId ? `https://www.loom.com/embed/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function VideoBlock({
  data,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: VideoBlockProps) {
  const [inputUrl, setInputUrl] = useState(data.url || '');

  const embedUrl = useMemo(() => {
    if (!data.url) return null;
    return getEmbedUrl(data.url, data.provider);
  }, [data.url, data.provider]);

  const handleUrlChange = (url: string) => {
    setInputUrl(url);
    const provider = detectProvider(url);
    onUpdate({
      type: 'video',
      url,
      provider
    });
  };

  return (
    <div
      className={`relative group rounded-lg border transition-all overflow-hidden ${
        isSelected
          ? 'border-blue-400 shadow-sm'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          title="Delete block"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {embedUrl ? (
        // Video preview
        <div className="aspect-video bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        // Empty state / URL input
        <div className="p-6 bg-gray-50">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add a video</h3>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Paste a YouTube, Vimeo, or Loom URL
            </p>
          </div>
        </div>
      )}

      {/* URL input (always visible when selected or no URL) */}
      {(isSelected || !embedUrl) && (
        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {data.url && (
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          {data.provider && data.provider !== 'custom' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 capitalize">
                {data.provider}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
