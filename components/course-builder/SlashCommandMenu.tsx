import { useState, useEffect, useRef } from 'react';
import {
  Type,
  Video,
  Image,
  Code2,
  HelpCircle,
  Layout,
  Minus,
  Search
} from 'lucide-react';
import { PageType } from '../../types';

interface SlashCommandMenuProps {
  position: { x: number; y: number };
  onSelect: (type: PageType) => void;
  onClose: () => void;
}

interface CommandOption {
  type: PageType;
  icon: typeof Type;
  label: string;
  description: string;
  keywords: string[];
}

const commands: CommandOption[] = [
  {
    type: 'text',
    icon: Type,
    label: 'Text',
    description: 'Rich text with formatting',
    keywords: ['text', 'paragraph', 'write', 'content']
  },
  {
    type: 'video',
    icon: Video,
    label: 'Video',
    description: 'YouTube, Vimeo, or Loom',
    keywords: ['video', 'youtube', 'vimeo', 'loom', 'media']
  },
  {
    type: 'image',
    icon: Image,
    label: 'Image',
    description: 'Upload or embed an image',
    keywords: ['image', 'photo', 'picture', 'upload']
  },
  {
    type: 'code',
    icon: Code2,
    label: 'Code',
    description: 'Code snippet with syntax highlighting',
    keywords: ['code', 'snippet', 'programming', 'javascript', 'python']
  },
  {
    type: 'quiz',
    icon: HelpCircle,
    label: 'Quiz',
    description: 'Multiple choice questions',
    keywords: ['quiz', 'question', 'test', 'assessment']
  },
  {
    type: 'embed',
    icon: Layout,
    label: 'Embed',
    description: 'CodePen, Figma, Miro, and more',
    keywords: ['embed', 'codepen', 'figma', 'miro', 'codesandbox', 'iframe']
  },
  {
    type: 'divider',
    icon: Minus,
    label: 'Divider',
    description: 'Visual separator',
    keywords: ['divider', 'separator', 'line', 'break']
  }
];

export function SlashCommandMenu({
  position,
  onSelect,
  onClose
}: SlashCommandMenuProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description.toLowerCase().includes(searchLower) ||
      cmd.keywords.some(k => k.includes(searchLower))
    );
  });

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex].type);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 280),
    y: Math.min(position.y, window.innerHeight - 400)
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {/* Search input */}
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blocks..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Commands list */}
      <div className="max-h-64 overflow-y-auto py-1">
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-gray-500">
            No blocks found
          </div>
        ) : (
          filteredCommands.map((cmd, index) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.type}
                onClick={() => onSelect(cmd.type)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`p-1.5 rounded ${
                  index === selectedIndex ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    index === selectedIndex ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    index === selectedIndex ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {cmd.label}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {cmd.description}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">↑↓</kbd>
          <span>Navigate</span>
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">↵</kbd>
          <span>Select</span>
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">Esc</kbd>
          <span>Close</span>
        </div>
      </div>
    </div>
  );
}
