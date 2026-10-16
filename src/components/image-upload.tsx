import React, { useState, ChangeEvent, DragEvent } from 'react';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png']; // the types the AI accepts

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Shared by the file picker and drag and drop: JPG or PNG, up to 5 MB.
  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) {
      onFileSelect(null);
      setPreviewUrl(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please select a JPG or PNG image.');
    } else if (file.size > MAX_SIZE) {
      setError('Image must be 5 MB or smaller.');
    } else {
      onFileSelect(file);
      setPreviewUrl(URL.createObjectURL(file));
      return;
    }
    onFileSelect(null);
    setPreviewUrl(null);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); // required, otherwise the browser refuses the drop
    setIsDragging(true);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {previewUrl ? (
        <div className="relative w-full h-64 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
          <img
            src={previewUrl}
            alt="Preview"
            className="object-contain w-full h-full"
          />
          <button
            type="button"
            onClick={() => {
              onFileSelect(null);
              setPreviewUrl(null);
              setError(null);
            }}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
            aria-label="Remove selected image"
          >
            &times;
          </button>
        </div>
      ) : (
        <label
          htmlFor="file-upload"
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-md transition text-gray-500 hover:border-green-600 hover:bg-green-50 ${
            isDragging ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <svg
            className="w-12 h-12 mb-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16V4m0 0L3 8m4-4l4 4m6 4v8m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          <span>Click to select an image or drag and drop</span>
          <input
            id="file-upload"
            type="file"
            accept="image/jpeg,image/png"
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};
