'use client';

import { MediaUploader } from '@/components/debate/MediaUploader';
import { Camera } from 'lucide-react';

export function CameraUploader({
  onFileSelected,
  label = 'Camera',
}: {
  onFileSelected: (file: File) => void;
  label?: string;
}) {
  return (
    <MediaUploader
      label={label}
      icon={Camera}
      accept="image/*,video/*"
      capture="environment"
      forceCamera={true}
      onFileSelected={onFileSelected}
    />
  );
}
