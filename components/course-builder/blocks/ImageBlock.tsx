import { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Link, Trash2, X } from 'lucide-react';
import { ImagePageData } from '../../../types';
import { supabase } from '../../../lib/supabase';

interface ImageBlockProps {
  data: ImagePageData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: ImagePageData) => void;
  onDelete: () => void;
}

export function ImageBlock({
  data,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: ImageBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `course-images/${filename}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-assets')
        .getPublicUrl(path);

      onUpdate({
        type: 'image',
        url: urlData.publicUrl,
        alt: file.name,
        caption: data.caption
      });
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onUpdate({
        type: 'image',
        url: urlInput.trim(),
        alt: data.alt || 'Image',
        caption: data.caption
      });
      setShowUrlInput(false);
      setUrlInput('');
    }
  };

  const handleCaptionChange = (caption: string) => {
    onUpdate({
      ...data,
      caption
    });
  };

  const handleAltChange = (alt: string) => {
    onUpdate({
      ...data,
      alt
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

      {data.url ? (
        // Image preview
        <div className="relative">
          <img
            src={data.url}
            alt={data.alt}
            className="w-full max-h-[500px] object-contain bg-gray-100"
          />

          {/* Caption input when selected */}
          {isSelected && (
            <div className="p-3 border-t border-gray-200 bg-white space-y-2">
              <input
                type="text"
                value={data.alt}
                onChange={(e) => handleAltChange(e.target.value)}
                placeholder="Alt text (for accessibility)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={data.caption || ''}
                onChange={(e) => handleCaptionChange(e.target.value)}
                placeholder="Add a caption (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Caption display when not selected */}
          {!isSelected && data.caption && (
            <p className="text-sm text-gray-500 text-center py-2 italic">
              {data.caption}
            </p>
          )}
        </div>
      ) : (
        // Empty state / Upload UI
        <div className="p-6 bg-gray-50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {showUrlInput ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUrlSubmit();
                    if (e.key === 'Escape') {
                      setShowUrlInput(false);
                      setUrlInput('');
                    }
                  }}
                />
                <button
                  onClick={handleUrlSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInput('');
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Add an image</h3>
              <p className="text-sm text-gray-500 mb-4 text-center">
                Upload an image or paste a URL
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => setShowUrlInput(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  <Link className="w-4 h-4" />
                  Paste URL
                </button>
              </div>

              {uploadError && (
                <p className="mt-3 text-sm text-red-600">{uploadError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
