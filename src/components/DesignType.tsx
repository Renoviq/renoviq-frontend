import React, { useState } from 'react';

interface DesignStyle {
  id: string;
  name: string;
  imageUrl: string;
  // Shown behind (or instead of) the photo, for example if the photo file is missing.
  color: string;
}

const designStyles: DesignStyle[] = [
  {
    id: 'modern',
    name: 'Modern',
    imageUrl: '/images/design-styles/modern.jpg',
    color: '#e5e7eb',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    imageUrl: '/images/design-styles/industrial.jpg',
    color: '#9ca3af',
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    imageUrl: '/images/design-styles/bohemian.jpg',
    color: '#f3d9b1',
  },
  {
    id: 'traditional',
    name: 'Traditional',
    imageUrl: '/images/design-styles/traditional.jpg',
    color: '#d6b88c',
  },
  {
    id: 'rustic',
    name: 'Rustic',
    imageUrl: '/images/design-styles/rustic.jpg',
    color: '#b9936c',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    imageUrl: '/images/design-styles/minimalist.jpg',
    color: '#f5f5f4',
  },
];

interface DesignTypeProps {
  selectedDesign: string;
  onSelect: (designId: string) => void;
}

export const DesignType: React.FC<DesignTypeProps> = ({ selectedDesign, onSelect }) => {
  return (
    <div className="mb-6">
      <label className="block mb-2 font-semibold text-gray-700">Select Interior Design Type</label>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {designStyles.map((style) => (
          <div
            key={style.id}
            className={`cursor-pointer border rounded-md overflow-hidden ${
              selectedDesign === style.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'
            }`}
            onClick={() => onSelect(style.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(style.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={selectedDesign === style.id}
            title={style.name}
          >
            <div className="relative w-full h-20" style={{ backgroundColor: style.color }}>
              <img
                src={style.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <p className="text-center text-sm mt-1">{style.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
