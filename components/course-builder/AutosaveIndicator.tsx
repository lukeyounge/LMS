import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { SaveStatus } from './hooks/useCurriculum';

interface AutosaveIndicatorProps {
  status: SaveStatus;
}

export function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  const configs = {
    idle: {
      icon: Cloud,
      text: 'All changes saved',
      className: 'text-gray-400'
    },
    saving: {
      icon: Loader2,
      text: 'Saving...',
      className: 'text-blue-500'
    },
    saved: {
      icon: Check,
      text: 'Saved',
      className: 'text-green-500'
    },
    error: {
      icon: CloudOff,
      text: 'Error saving',
      className: 'text-red-500'
    }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 text-sm ${config.className} transition-colors duration-200`}>
      <Icon
        className={`w-4 h-4 ${status === 'saving' ? 'animate-spin' : ''}`}
      />
      <span>{config.text}</span>
    </div>
  );
}
