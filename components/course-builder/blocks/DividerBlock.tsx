import { Minus, MoreHorizontal, Trash2 } from 'lucide-react';
import { DividerPageData } from '../../../types';

interface DividerBlockProps {
  data: DividerPageData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: DividerPageData) => void;
  onDelete: () => void;
}

export function DividerBlock({
  data,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: DividerBlockProps) {
  const styles: { value: DividerPageData['style']; label: string }[] = [
    { value: 'line', label: 'Line' },
    { value: 'space', label: 'Space' },
    { value: 'dots', label: 'Dots' }
  ];

  return (
    <div
      className={`relative group py-4 transition-all ${
        isSelected ? 'bg-blue-50 rounded-lg' : ''
      }`}
      onClick={onSelect}
    >
      {/* Divider visualization */}
      <div className="flex items-center justify-center">
        {data.style === 'line' && (
          <div className="w-full h-px bg-gray-300" />
        )}
        {data.style === 'space' && (
          <div className="w-full h-8" />
        )}
        {data.style === 'dots' && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          </div>
        )}
      </div>

      {/* Controls (when selected) */}
      {isSelected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg shadow-sm">
          {styles.map((style) => (
            <button
              key={style.value}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ type: 'divider', style: style.value });
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                data.style === style.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {style.label}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
