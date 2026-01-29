import { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  FolderPlus,
  Eye,
  Settings,
  Keyboard
} from 'lucide-react';
import { Section } from '../../types';

interface CommandPaletteProps {
  sections: Section[];
  onSelectLesson: (lessonId: string) => void;
  onAddSection: () => void;
  onClose: () => void;
}

interface Command {
  id: string;
  icon: typeof Search;
  label: string;
  description?: string;
  action: () => void;
  type: 'action' | 'navigation';
}

export function CommandPalette({
  sections,
  onSelectLesson,
  onAddSection,
  onClose
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build commands list
  const commands: Command[] = [
    // Actions
    {
      id: 'add-section',
      icon: FolderPlus,
      label: 'Add Section',
      description: 'Create a new section',
      action: () => {
        onAddSection();
        onClose();
      },
      type: 'action'
    },
    {
      id: 'shortcuts',
      icon: Keyboard,
      label: 'Keyboard Shortcuts',
      description: 'View all shortcuts',
      action: () => {
        alert('Cmd+K: Command palette\nCmd+S: Save\nEsc: Close');
        onClose();
      },
      type: 'action'
    },
    // Navigation - lessons
    ...sections.flatMap(section =>
      section.lessons.map(lesson => ({
        id: `lesson-${lesson.id}`,
        icon: FileText,
        label: lesson.title,
        description: section.title,
        action: () => {
          onSelectLesson(lesson.id);
          onClose();
        },
        type: 'navigation' as const
      }))
    )
  ];

  // Filter commands
  const filteredCommands = commands.filter(cmd => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      (cmd.description?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  // Group commands by type
  const actionCommands = filteredCommands.filter(c => c.type === 'action');
  const navigationCommands = filteredCommands.filter(c => c.type === 'navigation');

  const allFilteredCommands = [...actionCommands, ...navigationCommands];

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
          setSelectedIndex(i => Math.min(i + 1, allFilteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allFilteredCommands[selectedIndex]) {
            allFilteredCommands[selectedIndex].action();
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
  }, [allFilteredCommands, selectedIndex, onClose]);

  let currentIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands and lessons..."
              className="w-full pl-10 pr-4 py-2 text-lg border-0 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Commands list */}
        <div className="max-h-80 overflow-y-auto">
          {allFilteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found
            </div>
          ) : (
            <>
              {/* Actions */}
              {actionCommands.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Actions
                  </div>
                  {actionCommands.map((cmd) => {
                    const index = currentIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          index === selectedIndex
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${
                          index === selectedIndex ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className={`font-medium ${
                            index === selectedIndex ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {cmd.label}
                          </div>
                          {cmd.description && (
                            <div className="text-sm text-gray-500">
                              {cmd.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Lessons */}
              {navigationCommands.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Jump to Lesson
                  </div>
                  {navigationCommands.map((cmd) => {
                    const index = currentIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          index === selectedIndex
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${
                          index === selectedIndex ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className={`font-medium ${
                            index === selectedIndex ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {cmd.label}
                          </div>
                          {cmd.description && (
                            <div className="text-sm text-gray-500">
                              {cmd.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
