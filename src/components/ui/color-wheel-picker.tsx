import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorWheelPickerProps {
  value: string;
  onChange: (value: string) => void;
  colorType?: 'dark' | 'light' | 'primary' | 'accent' | 'white' | 'text' | 'divider';
  label?: string;
}

// Helper functions for color conversion
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 50 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function getRecommendedColors(colorType: string, baseHue: number): string[] {
  switch (colorType) {
    case 'dark':
      // Dark colors - low lightness
      return [
        hslToHex(baseHue, 10, 10),
        hslToHex(baseHue, 15, 15),
        hslToHex(baseHue, 20, 20),
        hslToHex(baseHue, 25, 25),
        hslToHex(0, 0, 10), // Near black
        hslToHex(0, 0, 15),
      ];
    case 'light':
      // Light colors - high lightness
      return [
        hslToHex(baseHue, 15, 95),
        hslToHex(baseHue, 20, 92),
        hslToHex(baseHue, 25, 88),
        hslToHex(baseHue, 30, 85),
        hslToHex(0, 0, 97), // Near white
        hslToHex(0, 0, 94),
      ];
    case 'primary':
      // Primary - medium saturation, balanced lightness
      return [
        hslToHex(baseHue, 70, 45),
        hslToHex(baseHue, 80, 50),
        hslToHex(baseHue, 60, 40),
        hslToHex(baseHue, 75, 55),
        hslToHex(220, 80, 55), // Blue
        hslToHex(160, 70, 40), // Teal
      ];
    case 'accent':
      // Accent - medium saturation, lighter
      return [
        hslToHex(baseHue, 30, 80),
        hslToHex(baseHue, 25, 85),
        hslToHex(baseHue, 35, 75),
        hslToHex(baseHue, 40, 70),
        hslToHex(40, 35, 78), // Warm beige
        hslToHex(200, 30, 82), // Cool gray-blue
      ];
    case 'white':
      // Pure whites and near whites
      return [
        '#ffffff',
        '#fafafa',
        '#f5f5f5',
        '#faf7f5',
        '#f5f0e8',
        '#f0f9ff',
      ];
    case 'text':
      // Text colors - readable contrasts
      return [
        '#000000',
        '#1a1a1a',
        '#333333',
        '#ffffff',
        '#f5f0e8',
        '#0f172a',
      ];
    case 'divider':
      // Divider colors - subtle
      return [
        hslToHex(baseHue, 15, 85),
        hslToHex(baseHue, 20, 80),
        hslToHex(baseHue, 10, 90),
        '#e5e7eb',
        '#d4c5b0',
        '#d6d3d1',
      ];
    default:
      return [
        '#1a1a1a',
        '#f5f0e8',
        '#3b82f6',
        '#d4c5b0',
        '#ffffff',
        '#000000',
      ];
  }
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'monochromatic';

interface HarmonyColors {
  type: HarmonyType;
  label: string;
  colors: string[];
}

function getColorHarmonies(h: number, s: number, l: number): HarmonyColors[] {
  return [
    {
      type: 'monochromatic',
      label: 'Monochromatic',
      colors: [
        hslToHex(h, s, 15),
        hslToHex(h, s, 30),
        hslToHex(h, s, 50),
        hslToHex(h, s, 70),
        hslToHex(h, s, 85),
      ],
    },
    {
      type: 'complementary',
      label: 'Complementary',
      colors: [
        hslToHex(h, s, l),
        hslToHex((h + 180) % 360, s, l),
      ],
    },
    {
      type: 'analogous',
      label: 'Analogous',
      colors: [
        hslToHex((h - 30 + 360) % 360, s, l),
        hslToHex(h, s, l),
        hslToHex((h + 30) % 360, s, l),
      ],
    },
    {
      type: 'triadic',
      label: 'Triadic',
      colors: [
        hslToHex(h, s, l),
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l),
      ],
    },
    {
      type: 'split-complementary',
      label: 'Split-Comp',
      colors: [
        hslToHex(h, s, l),
        hslToHex((h + 150) % 360, s, l),
        hslToHex((h + 210) % 360, s, l),
      ],
    },
  ];
}

export function ColorWheelPicker({ value, onChange, colorType = 'primary', label }: ColorWheelPickerProps) {
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hsl, setHsl] = useState(() => hexToHsl(value || '#3b82f6'));
  const [hexInput, setHexInput] = useState(value || '#3b82f6');

  // Update internal state when value prop changes
  useEffect(() => {
    if (value && value !== 'transparent') {
      const newHsl = hexToHsl(value);
      setHsl(newHsl);
      setHexInput(value);
    }
  }, [value]);

  // Draw the color wheel
  useEffect(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * (Math.PI / 180);
      const endAngle = (angle + 1) * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, `hsl(${angle}, 10%, ${hsl.l}%)`);
      gradient.addColorStop(0.5, `hsl(${angle}, 50%, ${hsl.l}%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, ${hsl.l}%)`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw selection indicator
    const selectedAngle = hsl.h * (Math.PI / 180);
    const selectedRadius = (hsl.s / 100) * radius;
    const indicatorX = centerX + Math.cos(selectedAngle) * selectedRadius;
    const indicatorY = centerY + Math.sin(selectedAngle) * selectedRadius;

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsl]);

  const handleWheelInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = wheelRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvas.width / 2;
    const y = e.clientY - rect.top - canvas.height / 2;

    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const distance = Math.sqrt(x * x + y * y);
    const radius = canvas.width / 2 - 4;

    const newH = (angle + 360) % 360;
    const newS = Math.min(100, (distance / radius) * 100);

    const newHsl = { ...hsl, h: newH, s: newS };
    setHsl(newHsl);
    const newHex = hslToHex(newH, newS, hsl.l);
    setHexInput(newHex);
    onChange(newHex);
  }, [hsl, onChange]);

  const handleLightnessChange = useCallback((newL: number) => {
    const newHsl = { ...hsl, l: newL };
    setHsl(newHsl);
    const newHex = hslToHex(hsl.h, hsl.s, newL);
    setHexInput(newHex);
    onChange(newHex);
  }, [hsl, onChange]);

  const handleHexChange = (newHex: string) => {
    setHexInput(newHex);
    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
      const newHsl = hexToHsl(newHex);
      setHsl(newHsl);
      onChange(newHex);
    }
  };

  const recommendedColors = getRecommendedColors(colorType, hsl.h);
  const harmonies = getColorHarmonies(hsl.h, hsl.s, hsl.l);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-10 h-10 rounded-lg border-2 border-border shadow-sm transition-all hover:scale-105 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          style={{ backgroundColor: value === 'transparent' ? '#fff' : value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          {label && <Label className="text-xs font-medium">{label}</Label>}
          
          {/* Recommended colors */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Recommended for {colorType}
            </Label>
            <div className="flex gap-1.5">
              {recommendedColors.map((color, i) => (
                <button
                  key={i}
                  className={cn(
                    'w-7 h-7 rounded-md border-2 transition-all hover:scale-110',
                    value === color ? 'border-foreground shadow-md' : 'border-border'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setHexInput(color);
                    setHsl(hexToHsl(color));
                    onChange(color);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Color Harmonies */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Color Harmonies
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {harmonies.map((harmony) => (
                <div 
                  key={harmony.type}
                  className="flex flex-col gap-1 p-1.5 rounded-md border border-border/50 bg-muted/30"
                >
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {harmony.label}
                  </span>
                  <div className="flex gap-0.5">
                    {harmony.colors.map((color, i) => (
                      <button
                        key={i}
                        className={cn(
                          'flex-1 h-5 rounded transition-all hover:scale-y-125 first:rounded-l last:rounded-r',
                          value === color ? 'ring-1 ring-foreground ring-offset-1' : ''
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setHexInput(color);
                          setHsl(hexToHsl(color));
                          onChange(color);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color wheel */}
          <div className="flex justify-center">
            <canvas
              ref={wheelRef}
              width={160}
              height={160}
              className="rounded-full cursor-crosshair"
              onMouseDown={(e) => {
                setIsDragging(true);
                handleWheelInteraction(e);
              }}
              onMouseMove={(e) => {
                if (isDragging) handleWheelInteraction(e);
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            />
          </div>

          {/* Lightness slider */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Lightness</Label>
            <div className="relative h-4 rounded-full overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, 
                    ${hslToHex(hsl.h, hsl.s, 0)}, 
                    ${hslToHex(hsl.h, hsl.s, 50)}, 
                    ${hslToHex(hsl.h, hsl.s, 100)})`
                }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.l}
                onChange={(e) => handleLightnessChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md pointer-events-none"
                style={{ 
                  left: `calc(${hsl.l}% - 6px)`,
                  backgroundColor: hslToHex(hsl.h, hsl.s, hsl.l)
                }}
              />
            </div>
          </div>

          {/* Hex input */}
          <div className="flex gap-2">
            <div 
              className="w-10 h-8 rounded border border-border flex-shrink-0"
              style={{ backgroundColor: value === 'transparent' ? '#fff' : value }}
            />
            <Input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              className="h-8 text-xs font-mono flex-1"
            />
          </div>

          {/* Transparent option */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 w-full" 
            onClick={() => {
              setHexInput('transparent');
              onChange('transparent');
            }}
          >
            Transparent
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
