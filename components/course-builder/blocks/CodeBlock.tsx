import { useState } from 'react';
import { Code, Copy, Check, Trash2, Play } from 'lucide-react';
import { CodePageData } from '../../../types';

interface CodeBlockProps {
  data: CodePageData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: CodePageData) => void;
  onDelete: () => void;
}

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' }
];

export function CodeBlock({
  data,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (code: string) => {
    onUpdate({
      ...data,
      code
    });
  };

  const handleLanguageChange = (language: string) => {
    onUpdate({
      ...data,
      language
    });
  };

  const handleRunnableToggle = () => {
    onUpdate({
      ...data,
      runnable: !data.runnable
    });
  };

  const languageLabel = languages.find(l => l.value === data.language)?.label || data.language;

  return (
    <div
      className={`relative group rounded-lg border transition-all overflow-hidden ${
        isSelected
          ? 'border-blue-400 shadow-sm'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-gray-400" />
          {isSelected ? (
            <select
              value={data.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-gray-400">{languageLabel}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {data.runnable && (
            <span className="text-xs text-green-400 px-2 py-0.5 bg-green-900/30 rounded mr-2">
              Runnable
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Code editor/display */}
      {isSelected ? (
        <textarea
          value={data.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Paste your code here..."
          className="w-full min-h-[200px] p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-y focus:outline-none"
          spellCheck={false}
        />
      ) : (
        <pre className="p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-x-auto">
          <code>{data.code || '// No code yet...'}</code>
        </pre>
      )}

      {/* Settings (when selected) */}
      {isSelected && (
        <div className="flex items-center gap-4 px-3 py-2 bg-gray-100 border-t border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.runnable}
              onChange={handleRunnableToggle}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Allow students to run this code</span>
          </label>
        </div>
      )}
    </div>
  );
}
