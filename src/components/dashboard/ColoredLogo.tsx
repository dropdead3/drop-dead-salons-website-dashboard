import { useState, useEffect } from 'react';
import DD75Logo from '@/assets/dd75-logo.svg';

interface ColoredLogoProps {
  logoUrl?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}

export function ColoredLogo({ 
  logoUrl, 
  color, 
  size = 64, 
  className = '',
  alt = 'Logo'
}: ColoredLogoProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const displayUrl = logoUrl || DD75Logo;
  
  // For SVG files that we want to colorize, fetch and inline them
  useEffect(() => {
    if (color && displayUrl.endsWith('.svg')) {
      fetch(displayUrl)
        .then(res => res.text())
        .then(text => {
          // Add fill color to the SVG and set proper sizing
          let coloredSvg = text;
          
          // Remove any existing width/height attributes and add our own
          // Also add fill color to the root svg element
          coloredSvg = coloredSvg.replace(
            /<svg([^>]*)>/,
            (match, attrs) => {
              // Remove existing width/height if present
              let cleanAttrs = attrs
                .replace(/width="[^"]*"/g, '')
                .replace(/height="[^"]*"/g, '');
              return `<svg${cleanAttrs} fill="${color}" style="height: ${size}px; width: auto;">`;
            }
          );
          
          // For paths with fill="currentColor", replace it
          coloredSvg = coloredSvg.replace(/fill="currentColor"/g, `fill="${color}"`);
          
          setSvgContent(coloredSvg);
        })
        .catch(() => {
          setSvgContent(null);
        });
    } else {
      setSvgContent(null);
    }
  }, [displayUrl, color, size]);

  // If we have inline SVG content with color applied
  if (svgContent && color) {
    return (
      <div 
        className={`inline-flex ${className}`}
        dangerouslySetInnerHTML={{ __html: svgContent }}
        aria-label={alt}
      />
    );
  }

  // Fallback to regular img tag
  return (
    <img 
      src={displayUrl} 
      alt={alt}
      className={className}
      style={{ height: size, width: 'auto' }}
    />
  );
}
