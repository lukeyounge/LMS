import { useRef, useEffect } from 'react';
import {
  Slide,
  SlideData,
  Theme,
  TitleSlideData,
  ContentSlideData,
  MediaSlideData,
  SplitSlideData,
  QuizSlideData,
  WebappSlideData,
  CodeSlideData,
  BulletsSlideData,
} from './slideTypes';

interface SlideCanvasProps {
  slide: Slide;
  theme: Theme;
  isEditing: boolean;
  onUpdate: (data: SlideData) => void;
}

// Responsive container that maintains aspect ratio on desktop but fills on mobile
function SlideContainer({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div
        className="w-full h-full md:aspect-video md:max-h-[80vh] md:h-auto rounded-lg overflow-hidden shadow-2xl"
        style={{
          backgroundColor: theme.colors.surface,
          fontFamily: theme.fonts.body,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Title Slide Template
function TitleSlide({
  data,
  theme,
  isEditing,
  onUpdate,
}: {
  data: TitleSlideData;
  theme: Theme;
  isEditing: boolean;
  onUpdate: (data: TitleSlideData) => void;
}) {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <div
      className={`h-full flex flex-col justify-center p-8 md:p-16 ${alignmentClasses[data.alignment || 'center']}`}
      style={{
        backgroundImage: data.backgroundImage ? `url(${data.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {isEditing ? (
        <>
          <input
            type="text"
            value={data.headline}
            onChange={(e) => onUpdate({ ...data, headline: e.target.value })}
            placeholder="Enter headline..."
            className="w-full bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          />
          <input
            type="text"
            value={data.subtitle || ''}
            onChange={(e) => onUpdate({ ...data, subtitle: e.target.value })}
            placeholder="Enter subtitle (optional)..."
            className="w-full mt-4 bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            }}
          />
        </>
      ) : (
        <>
          <h1
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {data.headline}
          </h1>
          {data.subtitle && (
            <p
              className="mt-4"
              style={{
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.body,
                fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              }}
            >
              {data.subtitle}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// Content Slide Template
function ContentSlide({
  data,
  theme,
  isEditing,
  onUpdate,
}: {
  data: ContentSlideData;
  theme: Theme;
  isEditing: boolean;
  onUpdate: (data: ContentSlideData) => void;
}) {
  const hasMedia = data.media?.url;
  const mediaPosition = data.media?.position || 'right';

  const contentSection = (
    <div className={`flex-1 p-8 md:p-12 flex flex-col justify-center ${hasMedia && mediaPosition === 'right' ? 'md:pr-4' : ''}`}>
      {isEditing ? (
        <>
          <input
            type="text"
            value={data.heading || ''}
            onChange={(e) => onUpdate({ ...data, heading: e.target.value })}
            placeholder="Heading (optional)..."
            className="w-full mb-6 bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              fontWeight: 600,
            }}
          />
          <textarea
            value={data.body}
            onChange={(e) => onUpdate({ ...data, body: e.target.value })}
            placeholder="Enter your content..."
            rows={6}
            className="w-full bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors resize-none"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              lineHeight: 1.8,
            }}
          />
        </>
      ) : (
        <>
          {data.heading && (
            <h2
              className="mb-6"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                fontWeight: 600,
              }}
            >
              {data.heading}
            </h2>
          )}
          <div
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              lineHeight: 1.8,
            }}
            dangerouslySetInnerHTML={{ __html: data.body }}
          />
        </>
      )}
    </div>
  );

  const mediaSection = hasMedia && (
    <div className={`${mediaPosition === 'top' || mediaPosition === 'bottom' ? 'w-full h-1/3' : 'md:w-1/2 h-full'}`}>
      {data.media?.type === 'image' ? (
        <img
          src={data.media.url}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          src={data.media?.url}
          className="w-full h-full object-cover"
          controls
        />
      )}
    </div>
  );

  if (mediaPosition === 'top') {
    return (
      <div className="h-full flex flex-col">
        {mediaSection}
        {contentSection}
      </div>
    );
  }

  if (mediaPosition === 'bottom') {
    return (
      <div className="h-full flex flex-col">
        {contentSection}
        {mediaSection}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row">
      {contentSection}
      {mediaSection}
    </div>
  );
}

// Media Slide (Full-bleed)
function MediaSlide({
  data,
  theme,
  isEditing,
  onUpdate,
}: {
  data: MediaSlideData;
  theme: Theme;
  isEditing: boolean;
  onUpdate: (data: MediaSlideData) => void;
}) {
  return (
    <div className="h-full relative">
      {data.url ? (
        <>
          {data.mediaType === 'image' ? (
            <img src={data.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <video src={data.url} className="w-full h-full object-cover" controls />
          )}
          {data.overlay && (
            <div className="absolute inset-0 bg-black/40" />
          )}
          {data.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-lg">{data.caption}</p>
            </div>
          )}
        </>
      ) : (
        <div className="h-full flex items-center justify-center" style={{ backgroundColor: theme.colors.surface }}>
          {isEditing ? (
            <div className="text-center p-8">
              <input
                type="url"
                value={data.url}
                onChange={(e) => onUpdate({ ...data, url: e.target.value })}
                placeholder="Enter image or video URL..."
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => onUpdate({ ...data, mediaType: 'image' })}
                  className={`px-4 py-2 rounded-lg ${data.mediaType === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  Image
                </button>
                <button
                  onClick={() => onUpdate({ ...data, mediaType: 'video' })}
                  className={`px-4 py-2 rounded-lg ${data.mediaType === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  Video
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: theme.colors.textMuted }}>No media added</p>
          )}
        </div>
      )}
    </div>
  );
}

// Split Slide
function SplitSlide({
  data,
  theme,
  isEditing,
  onUpdate,
}: {
  data: SplitSlideData;
  theme: Theme;
  isEditing: boolean;
  onUpdate: (data: SplitSlideData) => void;
}) {
  const ratioClasses = {
    '50-50': 'md:w-1/2',
    '60-40': '',
    '40-60': '',
  };

  const leftWidth = data.ratio === '60-40' ? 'md:w-3/5' : data.ratio === '40-60' ? 'md:w-2/5' : 'md:w-1/2';
  const rightWidth = data.ratio === '60-40' ? 'md:w-2/5' : data.ratio === '40-60' ? 'md:w-3/5' : 'md:w-1/2';

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className={`flex-1 ${leftWidth} p-8 flex flex-col justify-center`} style={{ backgroundColor: theme.colors.surface }}>
        {isEditing ? (
          <textarea
            value={data.leftContent}
            onChange={(e) => onUpdate({ ...data, leftContent: e.target.value })}
            placeholder="Left column content..."
            className="w-full h-full bg-transparent border-0 focus:outline-none resize-none"
            style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: '1.125rem', lineHeight: 1.8 }}
          />
        ) : (
          <div
            style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: '1.125rem', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: data.leftContent }}
          />
        )}
      </div>
      <div className={`flex-1 ${rightWidth} p-8 flex flex-col justify-center`} style={{ backgroundColor: theme.colors.background }}>
        {isEditing ? (
          <textarea
            value={data.rightContent}
            onChange={(e) => onUpdate({ ...data, rightContent: e.target.value })}
            placeholder="Right column content..."
            className="w-full h-full bg-transparent border-0 focus:outline-none resize-none"
            style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: '1.125rem', lineHeight: 1.8 }}
          />
        ) : (
          <div
            style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: '1.125rem', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: data.rightContent }}
          />
        )}
      </div>
    </div>
  );
}

// Quiz Slide
function QuizSlide({
  data,
  theme,
  isEditing,
  onUpdate,
}: {
  data: QuizSlideData;
  theme: Theme;
  isEditing: boolean;
  onUpdate: (data: QuizSlideData) => void;
}) {
  const addOption = () => {
    const newOption = { id: crypto.randomUUID(), text: '', isCorrect: false };
    onUpdate({ ...data, options: [...data.options, newOption] });
  };

  const updateOption = (id: string, updates: Partial<{ text: string; isCorrect: boolean }>) => {
    onUpdate({
      ...data,
      options: data.options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt)),
    });
  };

  const removeOption = (id: string) => {
    onUpdate({ ...data, options: data.options.filter((opt) => opt.id !== id) });
  };

  return (
    <div className="h-full p-8 md:p-16 flex flex-col justify-center">
      {isEditing ? (
        <input
          type="text"
          value={data.question}
          onChange={(e) => onUpdate({ ...data, question: e.target.value })}
          placeholder="Enter your question..."
          className="w-full mb-8 bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 600,
          }}
        />
      ) : (
        <h2
          className="mb-8"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 600,
          }}
        >
          {data.question}
        </h2>
      )}

      <div className="space-y-4">
        {data.options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-4">
            {isEditing && (
              <input
                type="checkbox"
                checked={option.isCorrect}
                onChange={(e) => updateOption(option.id, { isCorrect: e.target.checked })}
                className="w-5 h-5"
                title="Mark as correct"
              />
            )}
            {isEditing ? (
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, { text: e.target.value })}
                placeholder={`Option ${index + 1}...`}
                className="flex-1 px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: option.isCorrect ? theme.colors.primary : 'transparent',
                  color: theme.colors.text,
                }}
              />
            ) : (
              <button
                className="flex-1 px-4 py-3 rounded-lg border-2 text-left hover:border-blue-500 transition-colors"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: 'transparent',
                  color: theme.colors.text,
                }}
              >
                {option.text}
              </button>
            )}
            {isEditing && (
              <button
                onClick={() => removeOption(option.id)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <button
          onClick={addOption}
          className="mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          + Add option
        </button>
      )}
    </div>
  );
}

// Webapp Slide (Seamless Embed)
function WebappSlide({
  data,
  theme,
  isEditing,
  onUpdate,
}: {
  data: WebappSlideData;
  theme: Theme;
  isEditing: boolean;
  onUpdate: (data: WebappSlideData) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Handle messages from embedded webapp for potential completion tracking
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(data.url || 'about:blank').origin) return;
      // Could handle completion events here
      console.log('Message from webapp:', event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data.url]);

  if (!data.url || isEditing) {
    return (
      <div className="h-full flex items-center justify-center p-8" style={{ backgroundColor: theme.colors.surface }}>
        <div className="text-center w-full max-w-lg">
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.primary + '20' }}
          >
            <svg className="w-8 h-8" style={{ color: theme.colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>
            Embed a Webapp
          </h3>
          <p className="mb-6" style={{ color: theme.colors.textMuted }}>
            Enter the URL of your interactive webapp
          </p>
          <input
            type="url"
            value={data.url}
            onChange={(e) => onUpdate({ ...data, url: e.target.value })}
            placeholder="https://your-webapp.vercel.app"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => onUpdate({ ...data, title: e.target.value })}
            placeholder="Title (for accessibility)"
            className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  }

  // Seamless iframe embed - no borders, fills container completely
  return (
    <iframe
      ref={iframeRef}
      src={data.url}
      title={data.title || 'Embedded webapp'}
      className="w-full h-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      loading="lazy"
    />
  );
}

// Code Slide
function CodeSlide({
  data,
  theme,
  isEditing,
  onUpdate,
}: {
  data: CodeSlideData;
  theme: Theme;
  isEditing: boolean;
  onUpdate: (data: CodeSlideData) => void;
}) {
  return (
    <div className="h-full p-8 md:p-12 flex flex-col">
      {data.heading && (
        <h2
          className="mb-6"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
            fontWeight: 600,
          }}
        >
          {isEditing ? (
            <input
              type="text"
              value={data.heading}
              onChange={(e) => onUpdate({ ...data, heading: e.target.value })}
              placeholder="Heading..."
              className="w-full bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          ) : (
            data.heading
          )}
        </h2>
      )}

      <div className="flex-1 rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1e1e' }}>
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800">
              <select
                value={data.language}
                onChange={(e) => onUpdate({ ...data, language: e.target.value })}
                className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
              </select>
            </div>
            <textarea
              value={data.code}
              onChange={(e) => onUpdate({ ...data, code: e.target.value })}
              placeholder="Enter your code..."
              className="flex-1 w-full p-4 bg-transparent text-gray-100 font-mono text-sm focus:outline-none resize-none"
              style={{ tabSize: 2 }}
            />
          </div>
        ) : (
          <pre className="h-full p-4 overflow-auto">
            <code className={`language-${data.language} text-gray-100 text-sm font-mono`}>
              {data.code}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
}

// Bullets Slide
function BulletsSlide({
  data,
  theme,
  isEditing,
  onUpdate,
}: {
  data: BulletsSlideData;
  theme: Theme;
  isEditing: boolean;
  onUpdate: (data: BulletsSlideData) => void;
}) {
  const addBullet = () => {
    const newBullet = { id: crypto.randomUUID(), text: '' };
    onUpdate({ ...data, bullets: [...data.bullets, newBullet] });
  };

  const updateBullet = (id: string, text: string) => {
    onUpdate({
      ...data,
      bullets: data.bullets.map((b) => (b.id === id ? { ...b, text } : b)),
    });
  };

  const removeBullet = (id: string) => {
    onUpdate({ ...data, bullets: data.bullets.filter((b) => b.id !== id) });
  };

  return (
    <div className="h-full p-8 md:p-16 flex flex-col justify-center">
      {isEditing ? (
        <input
          type="text"
          value={data.heading || ''}
          onChange={(e) => onUpdate({ ...data, heading: e.target.value })}
          placeholder="Heading (optional)..."
          className="w-full mb-8 bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
            fontWeight: 600,
          }}
        />
      ) : data.heading ? (
        <h2
          className="mb-8"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
            fontWeight: 600,
          }}
        >
          {data.heading}
        </h2>
      ) : null}

      <ul className="space-y-4">
        {data.bullets.map((bullet) => (
          <li key={bullet.id} className="flex items-start gap-4">
            <span
              className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: theme.colors.primary }}
            />
            {isEditing ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={bullet.text}
                  onChange={(e) => updateBullet(bullet.id, e.target.value)}
                  placeholder="Bullet point..."
                  className="flex-1 bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                  style={{
                    color: theme.colors.text,
                    fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
                    lineHeight: 1.6,
                  }}
                />
                <button
                  onClick={() => removeBullet(bullet.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ) : (
              <span
                style={{
                  color: theme.colors.text,
                  fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
                  lineHeight: 1.6,
                }}
              >
                {bullet.text}
              </span>
            )}
          </li>
        ))}
      </ul>

      {isEditing && (
        <button
          onClick={addBullet}
          className="mt-6 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors self-start"
        >
          + Add bullet
        </button>
      )}
    </div>
  );
}

// Main SlideCanvas component that renders the appropriate template
export function SlideCanvas({ slide, theme, isEditing, onUpdate }: SlideCanvasProps) {
  const renderSlide = () => {
    switch (slide.data.template) {
      case 'title':
        return (
          <TitleSlide
            data={slide.data as TitleSlideData}
            theme={theme}
            isEditing={isEditing}
            onUpdate={(data) => onUpdate(data)}
          />
        );
      case 'content':
        return (
          <ContentSlide
            data={slide.data as ContentSlideData}
            theme={theme}
            isEditing={isEditing}
            onUpdate={(data) => onUpdate(data)}
          />
        );
      case 'media':
        return (
          <MediaSlide
            data={slide.data as MediaSlideData}
            theme={theme}
            isEditing={isEditing}
            onUpdate={(data) => onUpdate(data)}
          />
        );
      case 'split':
        return (
          <SplitSlide
            data={slide.data as SplitSlideData}
            theme={theme}
            isEditing={isEditing}
            onUpdate={(data) => onUpdate(data)}
          />
        );
      case 'quiz':
        return (
          <QuizSlide
            data={slide.data as QuizSlideData}
            theme={theme}
            isEditing={isEditing}
            onUpdate={(data) => onUpdate(data)}
          />
        );
      case 'webapp':
        return (
          <WebappSlide
            data={slide.data as WebappSlideData}
            theme={theme}
            isEditing={isEditing}
            onUpdate={(data) => onUpdate(data)}
          />
        );
      case 'code':
        return (
          <CodeSlide
            data={slide.data as CodeSlideData}
            theme={theme}
            isEditing={isEditing}
            onUpdate={(data) => onUpdate(data)}
          />
        );
      case 'bullets':
        return (
          <BulletsSlide
            data={slide.data as BulletsSlideData}
            theme={theme}
            isEditing={isEditing}
            onUpdate={(data) => onUpdate(data)}
          />
        );
      default:
        return (
          <div className="h-full flex items-center justify-center" style={{ color: theme.colors.textMuted }}>
            Unknown slide template
          </div>
        );
    }
  };

  return (
    <SlideContainer theme={theme}>
      {renderSlide()}
    </SlideContainer>
  );
}
