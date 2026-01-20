import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCw, Move, Crop } from 'lucide-react';

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number; // width/height, e.g., 1 for square
  maxOutputSize?: number; // max width/height in pixels
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio,
  maxOutputSize = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropShape, setCropShape] = useState<'circle' | 'square'>('circle');

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      
      const img = document.createElement('img');
      img.onload = () => {
        setImageElement(img);
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Draw preview on canvas
  useEffect(() => {
    if (!canvasRef.current || !imageElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size, size);

    // Save context
    ctx.save();

    // Move to center
    ctx.translate(size / 2, size / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scaled dimensions
    const scale = zoom;
    const imgWidth = imageElement.width * scale;
    const imgHeight = imageElement.height * scale;

    // Draw image centered with position offset
    ctx.drawImage(
      imageElement,
      -imgWidth / 2 + position.x,
      -imgHeight / 2 + position.y,
      imgWidth,
      imgHeight
    );

    ctx.restore();

    // Draw crop overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, size, size);

    // Clear the crop area
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    
    const cropSize = size * 0.75;
    const cropX = (size - cropSize) / 2;
    const cropY = (size - cropSize) / 2;

    if (cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, cropSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(cropX, cropY, cropSize, cropSize);
    }

    ctx.restore();

    // Draw crop border
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    
    if (cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, cropSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(cropX, cropY, cropSize, cropSize);
    }

  }, [imageElement, zoom, rotation, position, cropShape]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropComplete = useCallback(() => {
    if (!imageElement) return;

    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    const outputSize = maxOutputSize;
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    // Calculate the visible crop area relative to the preview
    const previewSize = 280;
    const cropSize = previewSize * 0.75;
    const cropOffset = (previewSize - cropSize) / 2;

    // Scale factor between preview and output
    const scaleFactor = outputSize / cropSize;

    // Apply transformations
    ctx.save();
    
    if (cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scaled dimensions for output
    const scale = zoom * scaleFactor;
    const imgWidth = imageElement.width * scale;
    const imgHeight = imageElement.height * scale;

    // Adjust position for crop offset and scale
    const adjustedX = (position.x - cropOffset + previewSize / 2 - cropSize / 2) * scaleFactor;
    const adjustedY = (position.y - cropOffset + previewSize / 2 - cropSize / 2) * scaleFactor;

    ctx.drawImage(
      imageElement,
      -imgWidth / 2 + position.x * scaleFactor,
      -imgHeight / 2 + position.y * scaleFactor,
      imgWidth,
      imgHeight
    );

    ctx.restore();

    // Convert to blob
    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          onClose();
        }
      },
      'image/jpeg',
      0.9
    );
  }, [imageElement, zoom, rotation, position, cropShape, maxOutputSize, onCropComplete, onClose]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop & Resize Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas preview */}
          <div 
            ref={containerRef}
            className="relative flex justify-center"
          >
            <canvas
              ref={canvasRef}
              className="rounded-lg cursor-move border border-border"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground flex items-center gap-1">
              <Move className="h-3 w-3" />
              Drag to reposition
            </div>
          </div>

          {/* Shape toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant={cropShape === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCropShape('circle')}
            >
              Circle
            </Button>
            <Button
              type="button"
              variant={cropShape === 'square' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCropShape('square')}
            >
              Square
            </Button>
          </div>

          {/* Zoom control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Zoom</Label>
              <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[zoom]}
                min={0.5}
                max={3}
                step={0.05}
                onValueChange={([v]) => setZoom(v)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Rotation control */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Rotation</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="gap-1"
            >
              <RotateCw className="h-4 w-4" />
              {rotation}°
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCropComplete}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};