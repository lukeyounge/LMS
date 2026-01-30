import { useState } from 'react';
import {
  X,
  Type,
  FileText,
  Image,
  Columns,
  HelpCircle,
  Globe,
  Code,
  List,
} from 'lucide-react';
import { SlideTemplate, templateInfo, Theme, themes, ThemeId } from './slideTypes';

interface TemplatePickerProps {
  currentTheme: ThemeId;
  onSelectTemplate: (template: SlideTemplate) => void;
  onChangeTheme: (theme: ThemeId) => void;
  onClose: () => void;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Type,
  FileText,
  Image,
  Columns,
  HelpCircle,
  Globe,
  Code,
  List,
};

export function TemplatePicker({
  currentTheme,
  onSelectTemplate,
  onChangeTheme,
  onClose,
}: TemplatePickerProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'themes'>('templates');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeTab === 'templates'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('templates')}
            >
              Templates
            </button>
            <button
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeTab === 'themes'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('themes')}
            >
              Themes
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {activeTab === 'templates' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {templateInfo.map((template) => {
                const IconComponent = iconMap[template.icon] || FileText;
                const currentThemeData = themes[currentTheme];

                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      onSelectTemplate(template.id);
                      onClose();
                    }}
                    className="group flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    {/* Preview */}
                    <div
                      className="w-full aspect-video rounded-lg mb-3 flex items-center justify-center border border-gray-100"
                      style={{ backgroundColor: currentThemeData.colors.surface }}
                    >
                      <IconComponent
                        className="w-8 h-8 transition-transform group-hover:scale-110"
                        style={{ color: currentThemeData.colors.primary }}
                      />
                    </div>

                    {/* Label */}
                    <span className="text-sm font-medium text-gray-900">
                      {template.name}
                    </span>
                    <span className="text-xs text-gray-500 text-center mt-1">
                      {template.description}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {Object.values(themes).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onChangeTheme(theme.id);
                  }}
                  className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all ${
                    currentTheme === theme.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Theme preview */}
                  <div
                    className="w-full aspect-video rounded-lg mb-3 overflow-hidden border border-gray-100"
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <div className="h-full p-4 flex flex-col justify-center items-center">
                      <div
                        className="text-sm font-bold mb-1"
                        style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
                      >
                        Headline
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: theme.colors.textMuted }}
                      >
                        Body text
                      </div>
                      <div className="flex gap-2 mt-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme name */}
                  <span className="text-sm font-medium text-gray-900">
                    {theme.name}
                  </span>

                  {/* Selected indicator */}
                  {currentTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick add menu that appears when clicking "Add Slide"
export function QuickTemplateMenu({
  position,
  currentTheme,
  onSelect,
  onClose,
}: {
  position: { x: number; y: number };
  currentTheme: ThemeId;
  onSelect: (template: SlideTemplate) => void;
  onClose: () => void;
}) {
  const currentThemeData = themes[currentTheme];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 w-64"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translateY(-50%)',
        }}
      >
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">
          Add Slide
        </div>
        {templateInfo.map((template) => {
          const IconComponent = iconMap[template.icon] || FileText;

          return (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center"
                style={{ backgroundColor: currentThemeData.colors.primary + '15' }}
              >
                <IconComponent
                  className="w-4 h-4"
                  style={{ color: currentThemeData.colors.primary }}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">{template.name}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
