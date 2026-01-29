import { useState } from 'react';
import {
  Code2,
  Trash2,
  ExternalLink,
  Figma,
  Layout,
  FileCode,
  Presentation
} from 'lucide-react';
import { EmbedPageData, EmbedProvider } from '../../../types';

interface EmbedBlockProps {
  data: EmbedPageData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: EmbedPageData) => void;
  onDelete: () => void;
}

const providerConfigs: Record<EmbedProvider, {
  name: string;
  icon: typeof Code2;
  color: string;
  bgColor: string;
  placeholder: string;
  getEmbedUrl: (url: string) => string | null;
}> = {
  youtube: {
    name: 'YouTube',
    icon: Layout,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    placeholder: 'https://youtube.com/watch?v=...',
    getEmbedUrl: (url) => {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/watch')) {
        try {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v') || '';
        } catch { return null; }
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
  },
  vimeo: {
    name: 'Vimeo',
    icon: Layout,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    placeholder: 'https://vimeo.com/...',
    getEmbedUrl: (url) => {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : null;
    }
  },
  loom: {
    name: 'Loom',
    icon: Layout,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    placeholder: 'https://loom.com/share/...',
    getEmbedUrl: (url) => {
      const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
      return match?.[1] ? `https://www.loom.com/embed/${match[1]}` : null;
    }
  },
  codepen: {
    name: 'CodePen',
    icon: FileCode,
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    placeholder: 'https://codepen.io/user/pen/...',
    getEmbedUrl: (url) => {
      const match = url.match(/codepen\.io\/([^\/]+)\/pen\/([^\/\?]+)/);
      if (match) {
        return `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result`;
      }
      return null;
    }
  },
  codesandbox: {
    name: 'CodeSandbox',
    icon: Code2,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    placeholder: 'https://codesandbox.io/s/...',
    getEmbedUrl: (url) => {
      const match = url.match(/codesandbox\.io\/s\/([^\/\?]+)/);
      return match?.[1] ? `https://codesandbox.io/embed/${match[1]}` : null;
    }
  },
  figma: {
    name: 'Figma',
    icon: Figma,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    placeholder: 'https://figma.com/file/...',
    getEmbedUrl: (url) => {
      if (url.includes('figma.com')) {
        return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
      }
      return null;
    }
  },
  notion: {
    name: 'Notion',
    icon: Layout,
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    placeholder: 'https://notion.so/...',
    getEmbedUrl: (url) => {
      // Notion embeds need specific formatting
      if (url.includes('notion.so') || url.includes('notion.site')) {
        return url;
      }
      return null;
    }
  },
  miro: {
    name: 'Miro',
    icon: Layout,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    placeholder: 'https://miro.com/app/board/...',
    getEmbedUrl: (url) => {
      const match = url.match(/miro\.com\/app\/board\/([^\/\?]+)/);
      return match?.[1] ? `https://miro.com/app/embed/${match[1]}` : null;
    }
  },
  typeform: {
    name: 'Typeform',
    icon: Layout,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    placeholder: 'https://form.typeform.com/to/...',
    getEmbedUrl: (url) => url
  },
  'google-slides': {
    name: 'Google Slides',
    icon: Presentation,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    placeholder: 'https://docs.google.com/presentation/d/...',
    getEmbedUrl: (url) => {
      const match = url.match(/presentation\/d\/([^\/]+)/);
      return match?.[1] ? `https://docs.google.com/presentation/d/${match[1]}/embed` : null;
    }
  },
  custom: {
    name: 'Custom Embed',
    icon: Code2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    placeholder: 'https://...',
    getEmbedUrl: (url) => url
  }
};

export function EmbedBlock({
  data,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: EmbedBlockProps) {
  const [inputUrl, setInputUrl] = useState(data.embedUrl || '');

  const config = providerConfigs[data.provider];
  const Icon = config.icon;

  const embedUrl = data.embedUrl ? config.getEmbedUrl(data.embedUrl) : null;

  const handleUrlChange = (url: string) => {
    setInputUrl(url);
    onUpdate({
      type: 'embed',
      provider: data.provider,
      embedUrl: url,
      config: data.config
    });
  };

  const handleProviderChange = (provider: EmbedProvider) => {
    onUpdate({
      type: 'embed',
      provider,
      embedUrl: '',
      config: {}
    });
    setInputUrl('');
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
        // Embed preview
        <div className="aspect-video bg-gray-100">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        // Empty state
        <div className="p-6 bg-gray-50">
          <div className="flex flex-col items-center justify-center py-6">
            <div className={`w-14 h-14 rounded-full ${config.bgColor} flex items-center justify-center mb-4`}>
              <Icon className={`w-7 h-7 ${config.color}`} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Add {config.name} embed
            </h3>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {isSelected && (
        <div className="p-3 border-t border-gray-200 bg-white space-y-3">
          {/* Provider selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Provider
            </label>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(providerConfigs) as EmbedProvider[]).map((p) => {
                const pConfig = providerConfigs[p];
                return (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      data.provider === p
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pConfig.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* URL input */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder={config.placeholder}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {data.embedUrl && (
                  <a
                    href={data.embedUrl}
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
          </div>
        </div>
      )}
    </div>
  );
}
