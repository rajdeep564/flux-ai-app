"use client"

import React, { useEffect } from 'react';
import { X, Download, Copy, Trash2, Maximize2, Calendar, Settings } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { GeneratedImage } from '@/lib/flux-api';

interface ImageModalProps {
  image: GeneratedImage | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (image: GeneratedImage) => void;
  onCopy: (prompt: string) => void;
  onDelete: (imageId: string) => void;
}

export function ImageModal({ 
  image, 
  isOpen, 
  onClose, 
  onDownload, 
  onCopy, 
  onDelete 
}: ImageModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !image) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this image?')) {
      onDelete(image.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm rounded-t-lg">
          <div className="flex items-center gap-3">
            <Maximize2 className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-white">Image Preview</h3>
            <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
              {image.model === "flux-kontext-pro" ? "Pro" : "Max"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Action buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(image)}
              className="text-gray-400 hover:text-white"
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(image.prompt)}
              className="text-gray-400 hover:text-white"
              title="Copy prompt"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-400"
              title="Delete image"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-700 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex-1 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <img
            src={image.url}
            alt={image.prompt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          />
        </div>

        {/* Footer with image details */}
        <div className="p-4 bg-gray-900/80 backdrop-blur-sm rounded-b-lg">
          <div className="space-y-3">
            {/* Prompt */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1">Prompt</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{image.prompt}</p>
            </div>
            
            {/* Image details */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                <span>Model: {image.model === "flux-kontext-pro" ? "Kontext Pro" : "Kontext Max"}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Aspect Ratio: {image.aspectRatio}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Generated: {image.timestamp.toLocaleDateString()} at {image.timestamp.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>ID: {image.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
