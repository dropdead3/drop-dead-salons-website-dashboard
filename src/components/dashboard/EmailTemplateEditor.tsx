import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Type,
  Image,
  Square,
  Minus,
  MousePointerClick,
  Trash2,
  GripVertical,
  Plus,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  ChevronDown,
  Code,
  Eye,
  Palette,
  Variable,
  Upload,
  Loader2,
  Save,
  Sparkles,
  Link,
  Copy,
  Undo2,
  Redo2,
  Share2,
  Instagram,
  Mail,
  LayoutTemplate,
  Pencil,
  Crown,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { ColorWheelPicker } from '@/components/ui/color-wheel-picker';

// Import brand logos - black versions
import dropDeadLogo from '@/assets/drop-dead-logo.svg';
import ddSecondaryLogo from '@/assets/dd-secondary-logo.svg';
import dd75Icon from '@/assets/dd75-icon.svg';
import dd75Logo from '@/assets/dd75-logo.svg';
// Import brand logos - white versions
import dropDeadLogoWhite from '@/assets/drop-dead-logo-white.svg';
import ddSecondaryLogoWhite from '@/assets/dd-secondary-logo-white.svg';
import dd75IconWhite from '@/assets/dd75-icon-white.svg';
import dd75LogoWhite from '@/assets/dd75-logo-white.svg';

// Brand logo presets
type LogoVariant = 'black' | 'white';

interface BrandLogo {
  id: string;
  name: string;
  src: string;
  description: string;
  variant: LogoVariant;
  baseId: string; // Used to group variants together
}

const brandLogos: BrandLogo[] = [
  // Drop Dead Logo variants
  {
    id: 'drop-dead-main-black',
    baseId: 'drop-dead-main',
    name: 'Drop Dead Logo',
    src: dropDeadLogo,
    description: 'Primary wordmark logo',
    variant: 'black',
  },
  {
    id: 'drop-dead-main-white',
    baseId: 'drop-dead-main',
    name: 'Drop Dead Logo',
    src: dropDeadLogoWhite,
    description: 'Primary wordmark logo',
    variant: 'white',
  },
  // DD Secondary variants
  {
    id: 'dd-secondary-black',
    baseId: 'dd-secondary',
    name: 'DD Secondary',
    src: ddSecondaryLogo,
    description: 'Secondary icon logo',
    variant: 'black',
  },
  {
    id: 'dd-secondary-white',
    baseId: 'dd-secondary',
    name: 'DD Secondary',
    src: ddSecondaryLogoWhite,
    description: 'Secondary icon logo',
    variant: 'white',
  },
  // DD75 Icon variants
  {
    id: 'dd75-icon-black',
    baseId: 'dd75-icon',
    name: 'DD75 Icon',
    src: dd75Icon,
    description: 'Circular icon mark',
    variant: 'black',
  },
  {
    id: 'dd75-icon-white',
    baseId: 'dd75-icon',
    name: 'DD75 Icon',
    src: dd75IconWhite,
    description: 'Circular icon mark',
    variant: 'white',
  },
  // DD75 Logo variants
  {
    id: 'dd75-logo-black',
    baseId: 'dd75-logo',
    name: 'DD75 Logo',
    src: dd75Logo,
    description: 'DD75 wordmark',
    variant: 'black',
  },
  {
    id: 'dd75-logo-white',
    baseId: 'dd75-logo',
    name: 'DD75 Logo',
    src: dd75LogoWhite,
    description: 'DD75 wordmark',
    variant: 'white',
  },
];

// Get unique logos (by baseId) for display
const uniqueLogos = brandLogos.filter((logo, index, self) =>
  index === self.findIndex((l) => l.baseId === logo.baseId)
);

// Helper to get logo by id (with fallback for legacy ids without variant)
const getLogoById = (id: string): BrandLogo | undefined => {
  // First try exact match
  let logo = brandLogos.find(l => l.id === id);
  if (logo) return logo;
  
  // Fallback for legacy ids (without -black/-white suffix)
  logo = brandLogos.find(l => l.baseId === id && l.variant === 'black');
  return logo;
};

// Block types for the email editor
type BlockType = 'text' | 'heading' | 'image' | 'button' | 'divider' | 'spacer' | 'link' | 'social' | 'footer' | 'header';

interface SocialLink {
  platform: 'instagram' | 'tiktok' | 'email';
  url: string;
  enabled: boolean;
}

interface NavLink {
  label: string;
  url: string;
  enabled: boolean;
}

interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  styles: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    padding?: string;
    borderRadius?: string;
    width?: string;
    height?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    buttonVariant?: 'primary' | 'secondary';
  };
  imageUrl?: string;
  linkUrl?: string;
  socialLinks?: SocialLink[];
  footerConfig?: {
    showLogo: boolean;
    logoId: string;
    logoSize?: 'small' | 'medium' | 'large';
    logoPosition?: 'left' | 'center' | 'right';
    showSocialIcons: boolean;
    copyrightText: string;
  };
  headerConfig?: {
    showLogo: boolean;
    logoId: string;
    logoSize?: 'small' | 'medium' | 'large';
    logoPosition?: 'left' | 'center' | 'right';
    showNavLinks: boolean;
    navLinksPosition?: 'left' | 'center' | 'right';
  };
  navLinks?: NavLink[];
}

interface EmailTemplateEditorProps {
  initialHtml: string;
  initialBlocks?: EmailBlock[] | null;
  variables: string[];
  onHtmlChange: (html: string) => void;
  onBlocksChange?: (blocks: EmailBlock[]) => void;
}

const colorPresets = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];

// Email color themes
type ThemeCategory = 'all' | 'luxury' | 'dark' | 'light' | 'pastel' | 'warm';

const themeCategories: { id: ThemeCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'warm', label: 'Warm' },
];

interface EmailTheme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory[];
  colors: {
    headerBg: string;
    headerText: string;
    bodyBg: string;
    bodyText: string;
    buttonBg: string;
    buttonText: string;
    accentColor: string;
    dividerColor: string;
    white: string;
  };
}

const emailThemes: EmailTheme[] = [
  {
    id: 'drop-dead-premium',
    name: 'Drop Dead Premium',
    description: 'Signature black, cream & oat luxury palette',
    category: ['luxury', 'dark', 'warm'],
    colors: {
      headerBg: '#000000',
      headerText: '#f5f0e8',
      bodyBg: '#f5f0e8',
      bodyText: '#1a1a1a',
      buttonBg: '#000000',
      buttonText: '#ffffff',
      accentColor: '#d4c5b0',
      dividerColor: '#d4c5b0',
      white: '#ffffff',
    },
  },
  {
    id: 'noir-gold',
    name: 'Noir & Gold',
    description: 'Luxurious black with gold accents',
    category: ['luxury', 'dark'],
    colors: {
      headerBg: '#0a0a0a',
      headerText: '#d4af37',
      bodyBg: '#1a1a1a',
      bodyText: '#f5f5f5',
      buttonBg: '#d4af37',
      buttonText: '#0a0a0a',
      accentColor: '#c9a227',
      dividerColor: '#3d3d3d',
      white: '#ffffff',
    },
  },
  {
    id: 'black-gold-elegance',
    name: 'Black Gold Elegance',
    description: 'Classic black with champagne gold',
    category: ['luxury', 'dark', 'light'],
    colors: {
      headerBg: '#000000',
      headerText: '#e8d5a3',
      bodyBg: '#faf8f5',
      bodyText: '#1a1a1a',
      buttonBg: '#1a1a1a',
      buttonText: '#e8d5a3',
      accentColor: '#e8d5a3',
      dividerColor: '#d4c5a3',
      white: '#ffffff',
    },
  },
  {
    id: 'blush-tan',
    name: 'Blush & Tan',
    description: 'Soft pink with warm tan accents',
    category: ['warm', 'light'],
    colors: {
      headerBg: '#d4a59a',
      headerText: '#ffffff',
      bodyBg: '#fdf6f3',
      bodyText: '#5c4033',
      buttonBg: '#c9967a',
      buttonText: '#ffffff',
      accentColor: '#e8c4b8',
      dividerColor: '#e8d5cf',
      white: '#ffffff',
    },
  },
  {
    id: 'rose-sand',
    name: 'Rose & Sand',
    description: 'Dusty rose with sandy neutrals',
    category: ['warm', 'light'],
    colors: {
      headerBg: '#b8838c',
      headerText: '#fff9f5',
      bodyBg: '#f5ebe0',
      bodyText: '#4a3728',
      buttonBg: '#a67c84',
      buttonText: '#ffffff',
      accentColor: '#d5b9a3',
      dividerColor: '#d4c4b0',
      white: '#ffffff',
    },
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    description: 'Soft lavender & mint pastels',
    category: ['pastel', 'light'],
    colors: {
      headerBg: '#c7b8ea',
      headerText: '#2d2a3e',
      bodyBg: '#f8f6fc',
      bodyText: '#3d3a4d',
      buttonBg: '#a8d8c8',
      buttonText: '#2d3a35',
      accentColor: '#f0e6ff',
      dividerColor: '#e0d6f0',
      white: '#ffffff',
    },
  },
  {
    id: 'pastel-peach',
    name: 'Pastel Peach',
    description: 'Soft peach & cream tones',
    category: ['pastel', 'light', 'warm'],
    colors: {
      headerBg: '#f5c6aa',
      headerText: '#3d2c24',
      bodyBg: '#fef9f6',
      bodyText: '#4a3830',
      buttonBg: '#e8a88c',
      buttonText: '#ffffff',
      accentColor: '#fce8dd',
      dividerColor: '#f0ddd2',
      white: '#ffffff',
    },
  },
  {
    id: 'pastel-sky',
    name: 'Pastel Sky',
    description: 'Soft blue & coral pastels',
    category: ['pastel', 'light'],
    colors: {
      headerBg: '#a8c8dc',
      headerText: '#2a3a45',
      bodyBg: '#f5f9fc',
      bodyText: '#3a4a55',
      buttonBg: '#f5a896',
      buttonText: '#ffffff',
      accentColor: '#d8e8f0',
      dividerColor: '#c8dce8',
      white: '#ffffff',
    },
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean black & white',
    category: ['dark', 'light'],
    colors: {
      headerBg: '#000000',
      headerText: '#ffffff',
      bodyBg: '#ffffff',
      bodyText: '#000000',
      buttonBg: '#000000',
      buttonText: '#ffffff',
      accentColor: '#f3f4f6',
      dividerColor: '#e5e7eb',
      white: '#ffffff',
    },
  },
  {
    id: 'warm-neutral',
    name: 'Warm Neutral',
    description: 'Soft beige & warm tones',
    category: ['warm', 'light'],
    colors: {
      headerBg: '#292524',
      headerText: '#faf7f5',
      bodyBg: '#faf7f5',
      bodyText: '#292524',
      buttonBg: '#78716c',
      buttonText: '#ffffff',
      accentColor: '#e7e5e4',
      dividerColor: '#d6d3d1',
      white: '#ffffff',
    },
  },
];

// Parse existing HTML into blocks (simplified parser)
function parseHtmlToBlocks(html: string): EmailBlock[] {
  // For complex HTML, we'll just create a single HTML block
  // In a real implementation, you'd parse the HTML properly
  if (!html || html.trim() === '') {
    return [
      {
        id: crypto.randomUUID(),
        type: 'heading',
        content: 'Email Title',
        styles: { textAlign: 'center', fontSize: '24px', textColor: '#ffffff', backgroundColor: '#3b82f6', padding: '24px' },
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        content: 'Add your email content here...',
        styles: { textAlign: 'left', fontSize: '16px', padding: '16px' },
      },
    ];
  }
  
  // Return empty to let user start fresh or import
  return [];
}

// Generate HTML from blocks
function blocksToHtml(blocks: EmailBlock[]): string {
  const blockHtml = blocks.map(block => {
    const baseStyles = `
      ${block.styles.backgroundColor ? `background-color: ${block.styles.backgroundColor};` : ''}
      ${block.styles.textColor ? `color: ${block.styles.textColor};` : ''}
      ${block.styles.fontSize ? `font-size: ${block.styles.fontSize};` : ''}
      ${block.styles.fontWeight ? `font-weight: ${block.styles.fontWeight};` : ''}
      ${block.styles.textAlign ? `text-align: ${block.styles.textAlign};` : ''}
      ${block.styles.padding ? `padding: ${block.styles.padding};` : ''}
      ${block.styles.borderRadius ? `border-radius: ${block.styles.borderRadius};` : ''}
    `.trim();

    // Convert newlines to <br/> for proper email rendering
    const formatContent = (content: string) => content.replace(/\n/g, '<br/>');
    
    switch (block.type) {
      case 'heading':
        return `<h1 style="${baseStyles}; margin: 0;">${formatContent(block.content)}</h1>`;
      case 'text':
        return `<p style="${baseStyles}; margin: 0; line-height: 1.6;">${formatContent(block.content)}</p>`;
      case 'image': {
        return `<div style="text-align: ${block.styles.textAlign || 'center'}; ${block.styles.padding ? `padding: ${block.styles.padding};` : ''}">
          <img src="${block.imageUrl || 'https://via.placeholder.com/400x200'}" alt="${block.content || 'Email image'}" style="max-width: 100%; ${block.styles.width ? `width: ${block.styles.width};` : ''} ${block.styles.borderRadius ? `border-radius: ${block.styles.borderRadius};` : ''}" />
        </div>`;
      }
      case 'button': {
        const isSecondary = block.styles.buttonVariant === 'secondary';
        const buttonStyles = isSecondary
          ? `display: inline-block; background-color: ${block.styles.backgroundColor || '#f5f0e8'}; color: ${block.styles.buttonColor || '#1a1a1a'}; padding: 16px 32px; text-decoration: none; font-weight: bold; border: 2px solid ${block.styles.buttonColor || '#1a1a1a'}; ${block.styles.borderRadius ? `border-radius: ${block.styles.borderRadius};` : 'border-radius: 8px;'}`
          : `display: inline-block; background-color: ${block.styles.buttonColor || '#3b82f6'}; color: ${block.styles.buttonTextColor || '#ffffff'}; padding: 16px 32px; text-decoration: none; font-weight: bold; ${block.styles.borderRadius ? `border-radius: ${block.styles.borderRadius};` : 'border-radius: 8px;'}`;
        return `<div style="text-align: ${block.styles.textAlign || 'center'}; ${block.styles.padding ? `padding: ${block.styles.padding};` : ''}">
          <a href="${block.linkUrl || '{{dashboard_url}}'}" style="${buttonStyles}">${block.content}</a>
        </div>`;
      }
      case 'link':
        return `<p style="${baseStyles}; margin: 0; line-height: 1.6;">
          <a href="${block.linkUrl || '#'}" style="color: ${block.styles.buttonColor || '#3b82f6'}; text-decoration: underline;">${block.content}</a>
        </p>`;
      case 'divider':
        return `<hr style="border: none; border-top: 1px solid ${block.styles.textColor || '#e5e7eb'}; margin: ${block.styles.padding || '16px 0'};" />`;
      case 'spacer':
        return `<div style="height: ${block.styles.height || '24px'};"></div>`;
      case 'social': {
        const enabledLinks = (block.socialLinks || []).filter(link => link.enabled);
        if (enabledLinks.length === 0) return '';
        
        const iconStyle = `display: inline-block; width: 32px; height: 32px; margin: 0 8px; text-decoration: none;`;
        const socialIcons = enabledLinks.map(link => {
          const iconColor = block.styles.buttonColor || '#1a1a1a';
          let svg = '';
          let href = link.url;
          
          switch (link.platform) {
            case 'instagram':
              svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`;
              break;
            case 'tiktok':
              svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`;
              break;
            case 'email':
              svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
              if (!href.startsWith('mailto:')) href = `mailto:${href}`;
              break;
          }
          
          return `<a href="${href}" style="${iconStyle}" target="_blank" rel="noopener">${svg}</a>`;
        }).join('');
        
        return `<div style="text-align: ${block.styles.textAlign || 'center'}; ${block.styles.padding ? `padding: ${block.styles.padding};` : ''} ${block.styles.backgroundColor ? `background-color: ${block.styles.backgroundColor};` : ''}">
          ${socialIcons}
        </div>`;
      }
      case 'footer': {
        const footerConfig = block.footerConfig || { showLogo: true, logoId: 'drop-dead-main-black', showSocialIcons: true, copyrightText: '© 2026 Drop Dead Salons. All rights reserved.' };
        const logo = getLogoById(footerConfig.logoId) || brandLogos[0];
        const bgColor = block.styles.backgroundColor || '#1a1a1a';
        const textColor = block.styles.textColor || '#f5f0e8';
        const iconColor = block.styles.buttonColor || '#f5f0e8';
        
        let logoHtml = '';
        if (footerConfig.showLogo) {
          logoHtml = `<div style="margin-bottom: 16px;">
            <img src="${logo.src}" alt="${logo.name}" style="max-width: 150px; height: auto;" />
          </div>`;
        }
        
        let socialHtml = '';
        if (footerConfig.showSocialIcons) {
          const enabledLinks = (block.socialLinks || []).filter(link => link.enabled);
          if (enabledLinks.length > 0) {
            const iconStyle = `display: inline-block; width: 24px; height: 24px; margin: 0 8px; text-decoration: none;`;
            socialHtml = `<div style="margin-bottom: 16px;">` + enabledLinks.map(link => {
              let svg = '';
              let href = link.url;
              
              switch (link.platform) {
                case 'instagram':
                  svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`;
                  break;
                case 'tiktok':
                  svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`;
                  break;
                case 'email':
                  svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
                  if (!href.startsWith('mailto:')) href = `mailto:${href}`;
                  break;
              }
              
              return `<a href="${href}" style="${iconStyle}" target="_blank" rel="noopener">${svg}</a>`;
            }).join('') + `</div>`;
          }
        }
        
        return `<div style="text-align: center; background-color: ${bgColor}; color: ${textColor}; padding: ${block.styles.padding || '32px 24px'}; border-radius: ${block.styles.borderRadius || '0 0 12px 12px'};">
          ${logoHtml}
          ${socialHtml}
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">${footerConfig.copyrightText}</p>
        </div>`;
      }
      case 'header': {
        const headerConfig = block.headerConfig || { showLogo: true, logoId: 'drop-dead-main-black', showNavLinks: true };
        const logo = getLogoById(headerConfig.logoId) || brandLogos[0];
        const bgColor = block.styles.backgroundColor || '#1a1a1a';
        const textColor = block.styles.textColor || '#f5f0e8';
        
        let logoHtml = '';
        if (headerConfig.showLogo) {
          logoHtml = `<img src="${logo.src}" alt="${logo.name}" style="max-width: 150px; height: auto;" />`;
        }
        
        let navHtml = '';
        if (headerConfig.showNavLinks) {
          const enabledLinks = (block.navLinks || []).filter(link => link.enabled);
          if (enabledLinks.length > 0) {
            navHtml = enabledLinks.map(link => 
              `<a href="${link.url}" style="color: ${textColor}; text-decoration: none; font-size: 14px; font-weight: 500; margin: 0 12px;">${link.label}</a>`
            ).join('');
          }
        }
        
        return `<div style="display: flex; align-items: center; justify-content: space-between; background-color: ${bgColor}; color: ${textColor}; padding: ${block.styles.padding || '20px 24px'}; border-radius: ${block.styles.borderRadius || '12px 12px 0 0'};">
          <div>${logoHtml}</div>
          <div>${navHtml}</div>
        </div>`;
      }
      default:
        return '';
    }
  }).join('\n');

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
${blockHtml}
</div>`;
}

export function EmailTemplateEditor({ initialHtml, initialBlocks, variables, onHtmlChange, onBlocksChange }: EmailTemplateEditorProps) {
  const defaultTheme = emailThemes[0]; // Drop Dead Standard
  
  const getInitialBlocks = (): EmailBlock[] => {
    // If we have saved blocks, use them directly
    if (initialBlocks && Array.isArray(initialBlocks) && initialBlocks.length > 0) {
      return initialBlocks;
    }
    
    // Otherwise fall back to default blocks with header pre-added
    return [
      {
        id: crypto.randomUUID(),
        type: 'header',
        content: '',
        styles: { 
          textAlign: 'center', 
          fontSize: '16px', 
          padding: '20px 24px', 
          backgroundColor: defaultTheme.colors.headerBg,
          textColor: defaultTheme.colors.headerText,
          borderRadius: '12px 12px 0 0'
        },
        navLinks: [
          { label: 'Dashboard Login', url: 'https://www.dropdeadsalon.com/staff-login', enabled: true },
        ],
        headerConfig: {
          showLogo: true,
          logoId: 'dd-secondary-white',
          logoSize: 'small' as const,
          logoPosition: 'left' as const,
          showNavLinks: true,
          navLinksPosition: 'right' as const,
        }
      },
      {
        id: crypto.randomUUID(),
        type: 'heading',
        content: '📧 Email Title',
        styles: { 
          textAlign: 'center', 
          fontSize: '24px', 
          textColor: defaultTheme.colors.headerText, 
          backgroundColor: defaultTheme.colors.headerBg, 
          padding: '24px', 
        },
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        content: 'Hi {{employee_name}},\n\nAdd your email content here...',
        styles: { 
          textAlign: 'left', 
          fontSize: '16px', 
          padding: '24px', 
          backgroundColor: defaultTheme.colors.bodyBg,
          textColor: defaultTheme.colors.bodyText
        },
      },
      {
        id: crypto.randomUUID(),
        type: 'button',
        content: 'Take Action',
        styles: { 
          textAlign: 'center', 
          padding: '24px', 
          buttonColor: defaultTheme.colors.buttonBg, 
          buttonTextColor: defaultTheme.colors.buttonText, 
          borderRadius: '8px',
          backgroundColor: defaultTheme.colors.bodyBg
        },
        linkUrl: '{{dashboard_url}}',
      },
      {
        id: crypto.randomUUID(),
        type: 'footer',
        content: '',
        styles: { 
          textAlign: 'center', 
          fontSize: '12px', 
          padding: '32px 24px', 
          backgroundColor: defaultTheme.colors.headerBg,
          textColor: defaultTheme.colors.headerText,
          buttonColor: defaultTheme.colors.headerText,
          borderRadius: '0 0 12px 12px'
        },
        socialLinks: [
          { platform: 'instagram' as const, url: 'https://instagram.com/dropdeadsalon', enabled: true },
          { platform: 'tiktok' as const, url: '', enabled: false },
          { platform: 'email' as const, url: 'contact@dropdeadsalon.com', enabled: true },
        ],
        footerConfig: {
          showLogo: true,
          logoId: 'drop-dead-main-white',
          logoSize: 'large' as const,
          logoPosition: 'center' as const,
          showSocialIcons: true,
          copyrightText: '© 2026 Drop Dead Salons. All rights reserved.',
        }
      },
    ];
  };

  const { 
    state: blocks, 
    setState: setBlocks, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useUndoRedo<EmailBlock[]>(getInitialBlocks());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview'>('visual');
  const [toolbarPanel, setToolbarPanel] = useState<'themes' | 'blocks' | 'logos' | 'variables' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [rawHtml, setRawHtml] = useState(initialHtml);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('drop-dead-premium');
  const [customThemes, setCustomThemes] = useState<EmailTheme[]>([]);
  const [isCreateThemeOpen, setIsCreateThemeOpen] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [newTheme, setNewTheme] = useState<Omit<EmailTheme, 'id'>>({
    name: '',
    description: '',
    category: [],
    colors: {
      headerBg: '#1a1a1a',
      headerText: '#f5f0e8',
      bodyBg: '#f5f0e8',
      bodyText: '#1a1a1a',
      buttonBg: '#1a1a1a',
      buttonText: '#ffffff',
      accentColor: '#d4c5b0',
      dividerColor: '#d4c5b0',
      white: '#ffffff',
    },
  });
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<ThemeCategory>('all');

  const { user } = useAuth();
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Fetch custom themes on mount
  useEffect(() => {
    const fetchCustomThemes = async () => {
      const { data, error } = await supabase
        .from('email_themes')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching custom themes:', error);
        return;
      }

      const themes: EmailTheme[] = (data || []).map(t => ({
        id: `custom-${t.id}`,
        name: t.name,
        description: t.description || 'Custom theme',
        category: [] as ThemeCategory[],
        colors: {
          headerBg: t.header_bg,
          headerText: t.header_text,
          bodyBg: t.body_bg,
          bodyText: t.body_text,
          buttonBg: t.button_bg,
          buttonText: '#ffffff',
          accentColor: t.accent_color,
          dividerColor: t.divider_color,
          white: '#ffffff',
        },
      }));
      setCustomThemes(themes);
    };

    fetchCustomThemes();
  }, []);

  const handleSaveCustomTheme = async () => {
    if (!newTheme.name.trim()) {
      toast.error('Please enter a theme name');
      return;
    }
    if (!user?.id) {
      toast.error('You must be logged in to save themes');
      return;
    }

    setIsSavingTheme(true);
    try {
      const { data, error } = await supabase
        .from('email_themes')
        .insert({
          name: newTheme.name,
          description: newTheme.description,
          header_bg: newTheme.colors.headerBg,
          header_text: newTheme.colors.headerText,
          body_bg: newTheme.colors.bodyBg,
          body_text: newTheme.colors.bodyText,
          button_bg: newTheme.colors.buttonBg,
          button_text: newTheme.colors.buttonText,
          accent_color: newTheme.colors.accentColor,
          divider_color: newTheme.colors.dividerColor,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newCustomTheme: EmailTheme = {
        id: `custom-${data.id}`,
        name: data.name,
        description: data.description || 'Custom theme',
        category: [],
        colors: {
          headerBg: data.header_bg,
          headerText: data.header_text,
          bodyBg: data.body_bg,
          bodyText: data.body_text,
          buttonBg: data.button_bg,
          buttonText: '#ffffff',
          accentColor: data.accent_color,
          dividerColor: data.divider_color,
          white: '#ffffff',
        },
      };

      setCustomThemes(prev => [...prev, newCustomTheme]);
      setIsCreateThemeOpen(false);
      setNewTheme({
        name: '',
        description: '',
        category: [],
        colors: {
          headerBg: '#1a1a1a',
          headerText: '#f5f0e8',
          bodyBg: '#f5f0e8',
          bodyText: '#1a1a1a',
          buttonBg: '#1a1a1a',
          buttonText: '#ffffff',
          accentColor: '#d4c5b0',
          dividerColor: '#d4c5b0',
          white: '#ffffff',
        },
      });
      toast.success('Custom theme saved!');
    } catch (error: any) {
      console.error('Error saving theme:', error);
      toast.error('Failed to save theme');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleDeleteCustomTheme = async (themeId: string) => {
    const dbId = themeId.replace('custom-', '');
    
    try {
      const { error } = await supabase
        .from('email_themes')
        .delete()
        .eq('id', dbId);

      if (error) throw error;

      setCustomThemes(prev => prev.filter(t => t.id !== themeId));
      if (selectedTheme === themeId) {
        setSelectedTheme('drop-dead');
      }
      toast.success('Theme deleted');
    } catch (error: any) {
      console.error('Error deleting theme:', error);
      toast.error('Failed to delete theme');
    }
  };

  const handleEditTheme = (theme: EmailTheme) => {
    setEditingThemeId(theme.id);
    setNewTheme({
      name: theme.name,
      description: theme.description,
      category: theme.category,
      colors: { ...theme.colors },
    });
    setIsCreateThemeOpen(true);
  };

  const handleEditCustomTheme = (themeId: string) => {
    const theme = customThemes.find(t => t.id === themeId);
    if (theme) {
      handleEditTheme(theme);
    }
  };

  const handleUpdateCustomTheme = async () => {
    if (!editingThemeId) return;
    if (!newTheme.name.trim()) {
      toast.error('Please enter a theme name');
      return;
    }

    const dbId = editingThemeId.replace('custom-', '');
    setIsSavingTheme(true);
    
    try {
      const { data, error } = await supabase
        .from('email_themes')
        .update({
          name: newTheme.name,
          description: newTheme.description,
          header_bg: newTheme.colors.headerBg,
          header_text: newTheme.colors.headerText,
          body_bg: newTheme.colors.bodyBg,
          body_text: newTheme.colors.bodyText,
          button_bg: newTheme.colors.buttonBg,
          button_text: newTheme.colors.buttonText,
          accent_color: newTheme.colors.accentColor,
          divider_color: newTheme.colors.dividerColor,
        })
        .eq('id', dbId)
        .select()
        .single();

      if (error) throw error;

      const updatedTheme: EmailTheme = {
        id: editingThemeId,
        name: data.name,
        description: data.description || 'Custom theme',
        category: newTheme.category || [],
        colors: {
          headerBg: data.header_bg,
          headerText: data.header_text,
          bodyBg: data.body_bg,
          bodyText: data.body_text,
          buttonBg: data.button_bg,
          buttonText: data.button_text || '#ffffff',
          accentColor: data.accent_color,
          dividerColor: data.divider_color,
          white: newTheme.colors.white || '#ffffff',
        },
      };

      setCustomThemes(prev => prev.map(t => t.id === editingThemeId ? updatedTheme : t));
      handleCloseThemeDialog();
      toast.success('Theme updated!');
    } catch (error: any) {
      console.error('Error updating theme:', error);
      toast.error('Failed to update theme');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleCloseThemeDialog = () => {
    setIsCreateThemeOpen(false);
    setEditingThemeId(null);
    setNewTheme({
      name: '',
      description: '',
      category: [],
      colors: {
        headerBg: '#1a1a1a',
        headerText: '#f5f0e8',
        bodyBg: '#f5f0e8',
        bodyText: '#1a1a1a',
        buttonBg: '#1a1a1a',
        buttonText: '#ffffff',
        accentColor: '#d4c5b0',
        dividerColor: '#d4c5b0',
        white: '#ffffff',
      },
    });
  };

  // Combined themes (built-in + custom)
  const allThemes = [...emailThemes, ...customThemes];

  const updateBlocksAndHtml = useCallback((newBlocks: EmailBlock[]) => {
    setBlocks(newBlocks);
    const html = blocksToHtml(newBlocks);
    setRawHtml(html);
    onHtmlChange(html);
    onBlocksChange?.(newBlocks);
  }, [onHtmlChange, onBlocksChange, setBlocks]);

  const handleUndo = useCallback(() => {
    const previousBlocks = undo();
    if (previousBlocks) {
      const html = blocksToHtml(previousBlocks);
      setRawHtml(html);
      onHtmlChange(html);
    }
  }, [undo, onHtmlChange]);

  const handleRedo = useCallback(() => {
    const nextBlocks = redo();
    if (nextBlocks) {
      const html = blocksToHtml(nextBlocks);
      setRawHtml(html);
      onHtmlChange(html);
    }
  }, [redo, onHtmlChange]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const addBlock = (type: BlockType, buttonVariant?: 'primary' | 'secondary') => {
    // Prevent duplicate header or footer blocks
    if (type === 'header' && blocks.some(b => b.type === 'header')) {
      toast.error('Only one header block allowed per template');
      return;
    }
    if (type === 'footer' && blocks.some(b => b.type === 'footer')) {
      toast.error('Only one footer block allowed per template');
      return;
    }
    
    // Get the current theme colors for new blocks
    const currentTheme = allThemes.find(t => t.id === selectedTheme) || emailThemes[0];
    
    const newBlock: EmailBlock = {
      id: crypto.randomUUID(),
      type,
      content: type === 'heading' ? 'New Heading' : type === 'text' ? 'New text block...' : type === 'button' ? 'Click Here' : type === 'link' ? 'Click here to learn more' : '',
      styles: {
        textAlign: type === 'link' ? 'left' : 'center',
        fontSize: type === 'heading' ? '24px' : '16px',
        padding: '16px',
        // Apply theme colors based on block type
        ...(type === 'heading' && { 
          backgroundColor: currentTheme.colors.headerBg, 
          textColor: currentTheme.colors.headerText 
        }),
        ...(type === 'text' && { 
          backgroundColor: currentTheme.colors.bodyBg, 
          textColor: currentTheme.colors.bodyText 
        }),
        ...(type === 'button' && { 
          buttonColor: currentTheme.colors.buttonBg, 
          buttonTextColor: currentTheme.colors.buttonText, 
          borderRadius: '8px',
          backgroundColor: currentTheme.colors.bodyBg,
          buttonVariant: buttonVariant || 'primary'
        }),
        ...(type === 'link' && { 
          backgroundColor: currentTheme.colors.bodyBg, 
          textColor: currentTheme.colors.bodyText,
          buttonColor: currentTheme.colors.buttonBg
        }),
        ...(type === 'image' && { 
          backgroundColor: currentTheme.colors.bodyBg 
        }),
        ...(type === 'divider' && { 
          textColor: currentTheme.colors.dividerColor 
        }),
        ...(type === 'spacer' && { height: '24px' }),
        ...(type === 'social' && { 
          backgroundColor: currentTheme.colors.bodyBg,
          buttonColor: currentTheme.colors.buttonBg
        }),
        ...(type === 'footer' && {
          backgroundColor: currentTheme.colors.headerBg,
          textColor: currentTheme.colors.headerText,
          buttonColor: currentTheme.colors.headerText,
          padding: '32px 24px',
          borderRadius: '0 0 12px 12px'
        }),
        ...(type === 'header' && {
          backgroundColor: currentTheme.colors.headerBg,
          textColor: currentTheme.colors.headerText,
          padding: '20px 24px',
          borderRadius: '12px 12px 0 0'
        }),
      },
      ...(type === 'button' && { linkUrl: '{{dashboard_url}}' }),
      ...(type === 'link' && { linkUrl: '{{dashboard_url}}' }),
      ...(type === 'social' && { 
        socialLinks: [
          { platform: 'instagram' as const, url: 'https://instagram.com/dropdeadhair', enabled: true },
          { platform: 'tiktok' as const, url: 'https://tiktok.com/@dropdeadhair', enabled: true },
          { platform: 'email' as const, url: 'hello@dropdeadhair.com', enabled: true },
        ]
      }),
      ...(type === 'footer' && {
        socialLinks: [
          { platform: 'instagram' as const, url: 'https://instagram.com/dropdeadsalon', enabled: true },
          { platform: 'tiktok' as const, url: '', enabled: false },
          { platform: 'email' as const, url: 'contact@dropdeadsalon.com', enabled: true },
        ],
        footerConfig: {
          showLogo: true,
          logoId: 'drop-dead-main-white',
          logoSize: 'large' as const,
          logoPosition: 'center' as const,
          showSocialIcons: true,
          copyrightText: '© 2026 Drop Dead Salons. All rights reserved.',
        }
      }),
      ...(type === 'header' && {
        navLinks: [
          { label: 'Dashboard Login', url: 'https://www.dropdeadsalon.com/staff-login', enabled: true },
        ],
        headerConfig: {
          showLogo: true,
          logoId: 'dd-secondary-white',
          logoSize: 'small' as const,
          logoPosition: 'left' as const,
          showNavLinks: true,
          navLinksPosition: 'right' as const,
        }
      }),
    };
    
    // Insert header at the beginning, footer at the end, others at the end
    if (type === 'header') {
      updateBlocksAndHtml([newBlock, ...blocks]);
    } else if (type === 'footer') {
      updateBlocksAndHtml([...blocks, newBlock]);
    } else {
      // Insert other blocks before any existing footer, or at the end
      const footerIndex = blocks.findIndex(b => b.type === 'footer');
      if (footerIndex !== -1) {
        const newBlocks = [...blocks];
        newBlocks.splice(footerIndex, 0, newBlock);
        updateBlocksAndHtml(newBlocks);
      } else {
        updateBlocksAndHtml([...blocks, newBlock]);
      }
    }
    setSelectedBlockId(newBlock.id);
  };

  const addLogoBlock = (logo: BrandLogo) => {
    const currentTheme = allThemes.find(t => t.id === selectedTheme) || emailThemes[0];
    const variantLabel = logo.variant === 'white' ? '(White)' : '(Black)';
    
    const newBlock: EmailBlock = {
      id: crypto.randomUUID(),
      type: 'image',
      content: `${logo.name} ${variantLabel}`,
      styles: {
        backgroundColor: currentTheme.colors.headerBg,
        textAlign: 'center',
        padding: '24px',
        width: '180px',
      },
      imageUrl: logo.src,
    };
    updateBlocksAndHtml([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    toast.success(`Added ${logo.name} ${variantLabel}`);
  };

  const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
    const newBlocks = blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    );
    updateBlocksAndHtml(newBlocks);
  };

  const updateBlockStyles = (id: string, styleUpdates: Partial<EmailBlock['styles']>) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    updateBlock(id, { styles: { ...block.styles, ...styleUpdates } });
  };

  // Apply inline formatting to selected text
  const applyInlineFormat = useCallback((blockId: string, tag: 'strong' | 'em') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const content = block.content;
    
    // If no selection, do nothing
    if (start === end) return;
    
    const selectedText = content.substring(start, end);
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;
    
    // Check if already wrapped - if so, unwrap
    const beforeSelection = content.substring(0, start);
    const afterSelection = content.substring(end);
    
    // Check if selection is already wrapped
    if (beforeSelection.endsWith(openTag) && afterSelection.startsWith(closeTag)) {
      // Unwrap
      const newContent = beforeSelection.slice(0, -openTag.length) + selectedText + afterSelection.slice(closeTag.length);
      updateBlock(blockId, { content: newContent });
    } else {
      // Wrap the selected text
      const newContent = content.substring(0, start) + openTag + selectedText + closeTag + content.substring(end);
      updateBlock(blockId, { content: newContent });
    }
    
    // Restore focus to textarea
    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [blocks, updateBlock]);

  const applyLinkFormat = useCallback((blockId: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const content = block.content;
    
    // If no selection, do nothing
    if (start === end) {
      toast.error('Please select text to create a link');
      return;
    }
    
    const selectedText = content.substring(start, end);
    
    // Prompt for URL
    const url = window.prompt('Enter the URL for the link:', 'https://');
    if (!url || url === 'https://') return;
    
    // Wrap with anchor tag
    const linkTag = `<a href="${url}" style="color: inherit; text-decoration: underline;">${selectedText}</a>`;
    const newContent = content.substring(0, start) + linkTag + content.substring(end);
    updateBlock(blockId, { content: newContent });
    
    // Restore focus to textarea
    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [blocks, updateBlock]);

  const deleteBlock = (id: string) => {
    updateBlocksAndHtml(blocks.filter(block => block.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    
    const newBlocks = [...blocks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    updateBlocksAndHtml(newBlocks);
  };

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find(b => b.id === id);
    if (!blockToDuplicate) return;
    
    const duplicatedBlock: EmailBlock = {
      ...blockToDuplicate,
      id: crypto.randomUUID(),
      styles: { ...blockToDuplicate.styles },
    };
    
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicatedBlock);
    updateBlocksAndHtml(newBlocks);
    setSelectedBlockId(duplicatedBlock.id);
    toast.success('Block duplicated');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  };

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedBlockId && blockId !== draggedBlockId) {
      setDragOverBlockId(blockId);
    }
  };

  const handleDragLeave = () => {
    setDragOverBlockId(null);
  };

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetBlockId) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId);
    const targetIndex = blocks.findIndex(b => b.id === targetBlockId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    const newBlocks = [...blocks];
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);
    
    updateBlocksAndHtml(newBlocks);
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  const handleImageUpload = async (blockId: string, file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `email-images/${crypto.randomUUID()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('email-assets')
        .upload(fileName, file);

      if (error) {
        // Try to create the bucket if it doesn't exist
        if (error.message.includes('Bucket not found')) {
          toast.error('Storage bucket not configured. Please contact an administrator.');
          return;
        }
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('email-assets')
        .getPublicUrl(fileName);

      updateBlock(blockId, { imageUrl: urlData.publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const insertVariable = (variable: string) => {
    if (!selectedBlockId) {
      toast.error('Select a block first to insert a variable');
      return;
    }
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block) return;
    
    if (block.type === 'button') {
      updateBlock(selectedBlockId, { linkUrl: `{{${variable}}}` });
    } else {
      updateBlock(selectedBlockId, { content: block.content + `{{${variable}}}` });
    }
  };

  const handleRawHtmlChange = (html: string) => {
    setRawHtml(html);
    onHtmlChange(html);
  };

  const applyTheme = (themeId: string) => {
    const theme = allThemes.find(t => t.id === themeId);
    if (!theme) return;

    setSelectedTheme(themeId);
    
    const newBlocks = blocks.map(block => {
      const updatedStyles = { ...block.styles };
      
      if (block.type === 'heading') {
        updatedStyles.backgroundColor = theme.colors.headerBg;
        updatedStyles.textColor = theme.colors.headerText;
      } else if (block.type === 'text') {
        updatedStyles.backgroundColor = theme.colors.bodyBg;
        updatedStyles.textColor = theme.colors.bodyText;
      } else if (block.type === 'button') {
        updatedStyles.buttonColor = theme.colors.buttonBg;
        updatedStyles.buttonTextColor = theme.colors.buttonText;
        updatedStyles.backgroundColor = theme.colors.bodyBg;
      } else if (block.type === 'divider') {
        updatedStyles.textColor = theme.colors.dividerColor;
      } else if (block.type === 'image') {
        updatedStyles.backgroundColor = theme.colors.bodyBg;
      }
      
      return { ...block, styles: updatedStyles };
    });
    
    updateBlocksAndHtml(newBlocks);
    toast.success(`Applied "${theme.name}" theme`);
  };

  const renderPreviewHtml = (html: string) => {
    let preview = html;
    variables.forEach((variable) => {
      const placeholder = `<span style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">[${variable}]</span>`;
      preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), placeholder);
    });
    return preview;
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <TabsList className="flex-1">
            <TabsTrigger value="visual" className="flex-1 gap-2">
              <Palette className="w-4 h-4" />
              Visual Editor
            </TabsTrigger>
            <TabsTrigger value="code" className="flex-1 gap-2">
              <Code className="w-4 h-4" />
              HTML Code
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          {/* Undo/Redo buttons */}
          <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className="h-7 w-7 p-0"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className="h-7 w-7 p-0"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="visual" className="mt-4 space-y-4">
          {/* Horizontal Toolbar */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border shadow-sm">
            <Button
              variant={toolbarPanel === 'themes' ? 'default' : 'outline'}
              size="sm"
              className="gap-2 px-4 shadow-sm bg-background border-border/80"
              onClick={() => setToolbarPanel(toolbarPanel === 'themes' ? null : 'themes')}
            >
              <Palette className="w-4 h-4" />
              Themes
            </Button>
            <Button
              variant={toolbarPanel === 'blocks' ? 'default' : 'outline'}
              size="sm"
              className="gap-2 px-4 shadow-sm bg-background border-border/80"
              onClick={() => setToolbarPanel(toolbarPanel === 'blocks' ? null : 'blocks')}
            >
              <Plus className="w-4 h-4" />
              Add Block
            </Button>
            <Button
              variant={toolbarPanel === 'logos' ? 'default' : 'outline'}
              size="sm"
              className="gap-2 px-4 shadow-sm bg-background border-border/80"
              onClick={() => setToolbarPanel(toolbarPanel === 'logos' ? null : 'logos')}
            >
              <Image className="w-4 h-4" />
              Brand Logos
            </Button>
            {variables.length > 0 && (
              <Button
                variant={toolbarPanel === 'variables' ? 'default' : 'outline'}
                size="sm"
                className="gap-2 px-4 shadow-sm bg-background border-border/80"
                onClick={() => setToolbarPanel(toolbarPanel === 'variables' ? null : 'variables')}
              >
                <Variable className="w-4 h-4" />
                Variables
              </Button>
            )}
            
            <div className="flex-1" />
          </div>

          {/* Themes Panel */}
          {toolbarPanel === 'themes' && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                {/* Header with New Theme Button - Top Right */}
                <div className="flex items-center justify-end mb-3">
                  <Dialog open={isCreateThemeOpen} onOpenChange={(open) => {
                    if (!open) handleCloseThemeDialog();
                    else setIsCreateThemeOpen(true);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 px-3 shadow-sm">
                        <Plus className="w-3.5 h-3.5" />
                        New Custom Theme
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          {editingThemeId ? 'Edit Custom Theme' : 'Create Custom Theme'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Theme Name</Label>
                          <Input
                            value={newTheme.name}
                            onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="My Brand Theme"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={newTheme.description}
                            onChange={(e) => setNewTheme(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description..."
                          />
                        </div>
                        
                        {/* 5 Color Swatches */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium">Theme Colors (5)</div>
                          <div className="flex gap-2 justify-center p-3 rounded-lg border bg-muted/20">
                            {[
                              { key: 'headerBg', label: 'Dark', color: newTheme.colors.headerBg, colorType: 'dark' as const },
                              { key: 'bodyBg', label: 'Light', color: newTheme.colors.bodyBg, colorType: 'light' as const },
                              { key: 'buttonBg', label: 'Primary', color: newTheme.colors.buttonBg, colorType: 'primary' as const },
                              { key: 'accentColor', label: 'Accent', color: newTheme.colors.accentColor, colorType: 'accent' as const },
                              { key: 'dividerColor', label: 'Divider', color: newTheme.colors.dividerColor, colorType: 'divider' as const },
                            ].map((item) => (
                              <Popover key={item.key}>
                                <PopoverTrigger asChild>
                                  <button className="flex flex-col items-center gap-1 group">
                                    <div
                                      className="w-8 h-8 rounded-full border border-foreground/20 shadow-sm transition-transform group-hover:scale-110"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-[9px] text-muted-foreground">{item.label}</span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="center">
                                  <ColorWheelPicker
                                    value={item.color}
                                    onChange={(color) => setNewTheme(prev => ({
                                      ...prev,
                                      colors: { ...prev.colors, [item.key]: color }
                                    }))}
                                    colorType={item.colorType}
                                  />
                                </PopoverContent>
                              </Popover>
                            ))}
                          </div>
                        </div>
                        
                        {/* Theme Preview */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium">Preview</div>
                          <div className="rounded-lg overflow-hidden border shadow-sm" style={{ backgroundColor: newTheme.colors.bodyBg }}>
                            <div className="p-2 text-center" style={{ backgroundColor: newTheme.colors.headerBg, color: newTheme.colors.headerText }}>
                              <div className="text-[10px] font-medium">Header</div>
                            </div>
                            <div className="p-3" style={{ color: newTheme.colors.bodyText }}>
                              <div className="text-[10px]">Body text preview</div>
                              <button className="mt-2 px-3 py-1 rounded text-[9px] font-medium" style={{ backgroundColor: newTheme.colors.buttonBg, color: newTheme.colors.buttonText }}>
                                Button
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={handleCloseThemeDialog}>
                          Cancel
                        </Button>
                        <Button onClick={editingThemeId ? handleUpdateCustomTheme : handleSaveCustomTheme} disabled={isSavingTheme || !newTheme.name.trim()}>
                          {isSavingTheme ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {editingThemeId ? 'Update Theme' : 'Save Theme'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Tabs defaultValue="standard" className="w-full">
                  <div className="flex justify-center mb-4">
                    <TabsList className="h-10 p-1 rounded-full bg-muted/60">
                      <TabsTrigger value="standard" className="text-xs h-8 px-5 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Standard Themes</TabsTrigger>
                      <TabsTrigger value="custom" className="text-xs h-8 px-5 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Custom Themes {customThemes.length > 0 && `(${customThemes.length})`}</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="standard" className="mt-0">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {themeCategories.map((category) => (
                        <button key={category.id} onClick={() => setThemeCategoryFilter(category.id)} className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium transition-all", themeCategoryFilter === category.id ? "bg-foreground text-background" : "bg-muted hover:bg-muted/80 text-muted-foreground")}>{category.label}</button>
                      ))}
                    </div>
                    <ScrollArea className="h-[220px]">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1 pb-2">
                        {emailThemes.filter(theme => themeCategoryFilter === 'all' || theme.category.includes(themeCategoryFilter)).map((theme) => (
                          <div key={theme.id} className={cn('p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md', selectedTheme === theme.id ? 'ring-1 ring-foreground border-foreground bg-foreground/5' : 'border-border hover:border-foreground/30')} onClick={() => { setSelectedTheme(theme.id); applyTheme(theme.id); }}>
                            <div className="flex gap-0.5 mb-1.5">
                              <div className="w-4 h-4 rounded-full border border-foreground/20" style={{ backgroundColor: theme.colors.headerBg }} />
                              <div className="w-4 h-4 rounded-full border border-foreground/20" style={{ backgroundColor: theme.colors.bodyBg }} />
                              <div className="w-4 h-4 rounded-full border border-foreground/20" style={{ backgroundColor: theme.colors.buttonBg }} />
                            </div>
                            <div className="text-[10px] font-medium truncate flex items-center gap-1">
                              {theme.id === 'drop-dead-premium' && <Crown className="w-3 h-3 text-amber-500" />}
                              {theme.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="custom" className="mt-0">
                    <ScrollArea className="h-[220px]">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1 pb-2">
                        {customThemes.map((theme) => (
                          <div key={theme.id} className={cn('p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md group relative', selectedTheme === theme.id ? 'ring-1 ring-foreground border-foreground bg-foreground/5' : 'border-border hover:border-foreground/30')} onClick={() => { setSelectedTheme(theme.id); applyTheme(theme.id); }}>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleEditCustomTheme(theme.id); }}><Pencil className="w-2.5 h-2.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteCustomTheme(theme.id); }}><Trash2 className="w-2.5 h-2.5" /></Button>
                            </div>
                            <div className="flex gap-0.5 mb-1.5">
                              <div className="w-4 h-4 rounded-full border border-foreground/20" style={{ backgroundColor: theme.colors.headerBg }} />
                              <div className="w-4 h-4 rounded-full border border-foreground/20" style={{ backgroundColor: theme.colors.bodyBg }} />
                              <div className="w-4 h-4 rounded-full border border-foreground/20" style={{ backgroundColor: theme.colors.buttonBg }} />
                            </div>
                            <div className="text-[10px] font-medium truncate flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-primary" />{theme.name}</div>
                          </div>
                        ))}
                        {customThemes.length === 0 && <div className="col-span-full text-center py-6 text-muted-foreground"><Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30" /><p className="text-xs">No custom themes yet</p><p className="text-[10px] mt-1">Click "+ New Theme" above to create one</p></div>}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Blocks Panel */}
          {toolbarPanel === 'blocks' && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  <button onClick={() => { addBlock('heading'); setToolbarPanel(null); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all hover:shadow-sm">
                    <Type className="w-5 h-5 text-foreground/70" />
                    <span className="text-[11px] font-medium text-foreground/80">Heading</span>
                  </button>
                  <button onClick={() => { addBlock('text'); setToolbarPanel(null); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all hover:shadow-sm">
                    <AlignLeft className="w-5 h-5 text-foreground/70" />
                    <span className="text-[11px] font-medium text-foreground/80">Text</span>
                  </button>
                  <button onClick={() => { addBlock('image'); setToolbarPanel(null); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all hover:shadow-sm">
                    <Image className="w-5 h-5 text-foreground/70" />
                    <span className="text-[11px] font-medium text-foreground/80">Image</span>
                  </button>
                  <button onClick={() => { addBlock('button', 'primary'); setToolbarPanel(null); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all hover:shadow-sm">
                    <div className="px-2.5 py-1 text-[8px] font-bold rounded-md bg-foreground text-background">Aa</div>
                    <span className="text-[11px] font-medium text-foreground/80">Primary</span>
                  </button>
                  <button onClick={() => { addBlock('button', 'secondary'); setToolbarPanel(null); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all hover:shadow-sm">
                    <div className="px-2.5 py-1 text-[8px] font-bold rounded-md border-2 border-foreground/60">Aa</div>
                    <span className="text-[11px] font-medium text-foreground/80">Secondary</span>
                  </button>
                  <button onClick={() => { addBlock('link'); setToolbarPanel(null); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all hover:shadow-sm">
                    <Link className="w-5 h-5 text-foreground/70" />
                    <span className="text-[11px] font-medium text-foreground/80">Link</span>
                  </button>
                  <button onClick={() => { addBlock('divider'); setToolbarPanel(null); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all hover:shadow-sm">
                    <Minus className="w-5 h-5 text-foreground/70" />
                    <span className="text-[11px] font-medium text-foreground/80">Divider</span>
                  </button>
                  <button onClick={() => { addBlock('spacer'); setToolbarPanel(null); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all hover:shadow-sm">
                    <Square className="w-5 h-5 text-foreground/70" />
                    <span className="text-[11px] font-medium text-foreground/80">Spacer</span>
                  </button>
                  <button onClick={() => { addBlock('social'); setToolbarPanel(null); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all hover:shadow-sm">
                    <Share2 className="w-5 h-5 text-foreground/70" />
                    <span className="text-[11px] font-medium text-foreground/80">Social</span>
                  </button>
                  <button 
                    onClick={() => { addBlock('header'); setToolbarPanel(null); }} 
                    disabled={blocks.some(b => b.type === 'header')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                      blocks.some(b => b.type === 'header') 
                        ? "bg-muted/20 opacity-40 cursor-not-allowed" 
                        : "bg-muted/40 hover:bg-muted/70 hover:shadow-sm"
                    )}
                  >
                    <LayoutTemplate className="w-5 h-5 text-foreground/70" />
                    <span className="text-[11px] font-medium text-foreground/80">Header</span>
                  </button>
                  <button 
                    onClick={() => { addBlock('footer'); setToolbarPanel(null); }} 
                    disabled={blocks.some(b => b.type === 'footer')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                      blocks.some(b => b.type === 'footer') 
                        ? "bg-muted/20 opacity-40 cursor-not-allowed" 
                        : "bg-muted/40 hover:bg-muted/70 hover:shadow-sm"
                    )}
                  >
                    <LayoutTemplate className="w-5 h-5 text-foreground/70" />
                    <span className="text-[11px] font-medium text-foreground/80">Footer</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

{/* Logos Panel */}
          {toolbarPanel === 'logos' && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {uniqueLogos.map((baseLogo) => {
                    const blackVariant = brandLogos.find(l => l.baseId === baseLogo.baseId && l.variant === 'black')!;
                    const whiteVariant = brandLogos.find(l => l.baseId === baseLogo.baseId && l.variant === 'white')!;
                    return (
                      <div key={baseLogo.baseId} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40">
                        <div className="w-12 h-12 flex items-center justify-center bg-background rounded-lg shadow-sm">
                          <img src={baseLogo.src} alt={baseLogo.name} className="w-8 h-8 object-contain" />
                        </div>
                        <span className="text-[11px] font-medium text-foreground/80 truncate max-w-full">{baseLogo.name}</span>
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => { addLogoBlock(blackVariant); setToolbarPanel(null); }}
                            className="flex items-center justify-center w-8 h-6 rounded bg-foreground text-background text-[9px] font-medium hover:opacity-80 transition-opacity"
                            title="Black version"
                          >
                            Black
                          </button>
                          <button
                            onClick={() => { addLogoBlock(whiteVariant); setToolbarPanel(null); }}
                            className="flex items-center justify-center w-8 h-6 rounded bg-background text-foreground text-[9px] font-medium border border-border hover:bg-muted transition-colors"
                            title="White version"
                          >
                            White
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variables Panel */}
          {toolbarPanel === 'variables' && variables.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                {/* Variables Guide Header */}
                <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Variable className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Dynamic Variables Guide</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Variables are placeholders that get replaced with real data when the email is sent. 
                      Click any variable below to insert it at your cursor position in the editor.
                    </p>
                  </div>
                </div>

                {/* Categorized Variables */}
                <div className="space-y-4">
                  {(() => {
                    // Comprehensive variable metadata with categories and descriptions based on database schema
                    const variableMetadata: Record<string, { category: string; description: string; example?: string }> = {
                      // ═══════════════════════════════════════════════════════════════
                      // RECIPIENT / EMPLOYEE INFO
                      // ═══════════════════════════════════════════════════════════════
                      employee_name: { category: 'Recipient', description: 'Full name of the employee', example: 'Jane Smith' },
                      stylist_name: { category: 'Recipient', description: 'Name of the stylist', example: 'Jane Smith' },
                      full_name: { category: 'Recipient', description: 'Complete legal name', example: 'Jane Marie Smith' },
                      display_name: { category: 'Recipient', description: 'Preferred display name', example: 'Jane S.' },
                      first_name: { category: 'Recipient', description: 'First name only', example: 'Jane' },
                      last_name: { category: 'Recipient', description: 'Last name only', example: 'Smith' },
                      user_name: { category: 'Recipient', description: 'Username or handle', example: 'jsmith' },
                      recipient_email: { category: 'Recipient', description: 'Email address of recipient', example: 'jane@example.com' },
                      employee_email: { category: 'Recipient', description: 'Employee email address', example: 'jane@salon.com' },
                      phone: { category: 'Recipient', description: 'Phone number (XXX-XXX-XXXX)', example: '555-123-4567' },
                      bio: { category: 'Recipient', description: 'Employee bio/description', example: 'Colorist specializing in...' },
                      photo_url: { category: 'Recipient', description: 'Profile photo URL', example: 'https://...' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // EMPLOYEE DETAILS & STATUS
                      // ═══════════════════════════════════════════════════════════════
                      stylist_level: { category: 'Employee Details', description: 'Stylist experience level', example: 'Senior Stylist' },
                      stylist_type: { category: 'Employee Details', description: 'Employment type', example: 'commission' },
                      role: { category: 'Employee Details', description: 'Staff role/position', example: 'stylist' },
                      specialties: { category: 'Employee Details', description: 'List of specialties', example: 'Balayage, Extensions' },
                      highlighted_services: { category: 'Employee Details', description: 'Featured services', example: 'Color, Cuts' },
                      dd_certified: { category: 'Employee Details', description: 'DD certification status', example: 'Yes' },
                      is_booking: { category: 'Employee Details', description: 'Currently accepting bookings', example: 'true' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // DATES & ANNIVERSARIES
                      // ═══════════════════════════════════════════════════════════════
                      hire_date: { category: 'Dates', description: 'Employee hire date', example: 'March 15, 2023' },
                      hire_date_formatted: { category: 'Dates', description: 'Formatted hire date', example: 'Mar 15, 2023' },
                      years_employed: { category: 'Dates', description: 'Years at company', example: '3' },
                      tenure: { category: 'Dates', description: 'Employment duration', example: '2 years, 5 months' },
                      anniversary_date: { category: 'Dates', description: 'Work anniversary date', example: 'March 15th' },
                      days_until_anniversary: { category: 'Dates', description: 'Days until work anniversary', example: '12' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // BIRTHDAY RELATED
                      // ═══════════════════════════════════════════════════════════════
                      birthday: { category: 'Birthday', description: 'Employee birthday', example: 'January 25th' },
                      birthday_date: { category: 'Birthday', description: 'Formatted birthday date', example: 'January 25th' },
                      birthday_count: { category: 'Birthday', description: 'Number of upcoming birthdays', example: '3' },
                      birthday_list: { category: 'Birthday', description: 'HTML list of birthdays', example: '<li>Jane - Jan 25</li>' },
                      birthday_names: { category: 'Birthday', description: 'Comma-separated names', example: 'Jane, John, Mary' },
                      days_until: { category: 'Birthday', description: 'Days until birthday', example: '3' },
                      days_until_birthday: { category: 'Birthday', description: 'Days remaining to birthday', example: '5' },
                      age: { category: 'Birthday', description: 'Age (if calculated)', example: '28' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // LOCATION & SCHEDULE
                      // ═══════════════════════════════════════════════════════════════
                      location_name: { category: 'Location', description: 'Salon location name', example: 'Downtown Studio' },
                      location_address: { category: 'Location', description: 'Full street address', example: '123 Main St, Suite 100' },
                      location_city: { category: 'Location', description: 'City name', example: 'Los Angeles' },
                      location_phone: { category: 'Location', description: 'Location phone number', example: '555-987-6543' },
                      location_hours: { category: 'Location', description: 'Business hours', example: 'Mon-Sat 9am-7pm' },
                      booking_url: { category: 'Location', description: 'Online booking link', example: 'https://book...' },
                      google_maps_url: { category: 'Location', description: 'Google Maps link', example: 'https://maps...' },
                      work_days: { category: 'Location', description: 'Scheduled work days', example: 'Mon, Wed, Fri' },
                      next_shift: { category: 'Location', description: 'Next scheduled shift', example: 'Monday 9am' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // SOCIAL MEDIA
                      // ═══════════════════════════════════════════════════════════════
                      instagram: { category: 'Social', description: 'Instagram handle', example: '@janestyle' },
                      instagram_url: { category: 'Social', description: 'Instagram profile URL', example: 'https://instagram.com/...' },
                      tiktok: { category: 'Social', description: 'TikTok handle', example: '@janestyle' },
                      tiktok_url: { category: 'Social', description: 'TikTok profile URL', example: 'https://tiktok.com/...' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // HANDBOOK & TRAINING
                      // ═══════════════════════════════════════════════════════════════
                      handbook_title: { category: 'Handbook', description: 'Handbook document title', example: 'Employee Safety Guide' },
                      handbook_count: { category: 'Handbook', description: 'Number of pending handbooks', example: '2' },
                      handbook_list: { category: 'Handbook', description: 'HTML list of handbooks', example: '<li>Employee Guide</li>' },
                      handbook_names: { category: 'Handbook', description: 'Comma-separated names', example: 'Safety, HR Policy' },
                      training_title: { category: 'Handbook', description: 'Training video title', example: 'Color Techniques 101' },
                      training_count: { category: 'Handbook', description: 'Pending training videos', example: '3' },
                      training_progress: { category: 'Handbook', description: 'Training completion %', example: '75%' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // 75-DAY PROGRAM
                      // ═══════════════════════════════════════════════════════════════
                      current_day: { category: 'Program', description: 'Current program day', example: '15' },
                      program_day: { category: 'Program', description: 'Day number in program', example: '42' },
                      days_remaining: { category: 'Program', description: 'Days left in program', example: '33' },
                      program_status: { category: 'Program', description: 'Enrollment status', example: 'active' },
                      streak_count: { category: 'Program', description: 'Current completion streak', example: '7' },
                      restart_count: { category: 'Program', description: 'Number of restarts', example: '1' },
                      start_date: { category: 'Program', description: 'Program start date', example: 'Jan 1, 2026' },
                      completion_date: { category: 'Program', description: 'Expected completion', example: 'Mar 17, 2026' },
                      is_urgent: { category: 'Program', description: 'Urgent reminder flag', example: 'true' },
                      weekly_wins_due: { category: 'Program', description: 'Weekly wins due day', example: 'Friday' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // METRICS & STATS
                      // ═══════════════════════════════════════════════════════════════
                      total_leads: { category: 'Metrics', description: 'Total leads generated', example: '24' },
                      new_clients: { category: 'Metrics', description: 'New clients count', example: '8' },
                      revenue_booked: { category: 'Metrics', description: 'Revenue amount', example: '$2,450' },
                      services_booked: { category: 'Metrics', description: 'Services booked count', example: '12' },
                      consults_booked: { category: 'Metrics', description: 'Consultations booked', example: '5' },
                      consults_completed: { category: 'Metrics', description: 'Consultations done', example: '4' },
                      ticket_value: { category: 'Metrics', description: 'Average ticket value', example: '$185' },
                      reach: { category: 'Metrics', description: 'Social media reach', example: '1,250' },
                      profile_visits: { category: 'Metrics', description: 'Profile views', example: '340' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // MEETINGS & SCHEDULING
                      // ═══════════════════════════════════════════════════════════════
                      meeting_date: { category: 'Meetings', description: 'Scheduled meeting date', example: 'January 22, 2026' },
                      meeting_time: { category: 'Meetings', description: 'Meeting start time', example: '2:00 PM' },
                      meeting_type: { category: 'Meetings', description: 'Type of meeting', example: '1-on-1 Check-in' },
                      coach_name: { category: 'Meetings', description: 'Coach/manager name', example: 'Sarah Johnson' },
                      meeting_notes: { category: 'Meetings', description: 'Meeting notes/agenda', example: 'Discuss Q1 goals...' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // ANNOUNCEMENTS & NOTIFICATIONS
                      // ═══════════════════════════════════════════════════════════════
                      announcement_title: { category: 'Announcements', description: 'Announcement headline', example: 'New Policy Update' },
                      announcement_content: { category: 'Announcements', description: 'Announcement body text', example: 'Starting next week...' },
                      announcement_priority: { category: 'Announcements', description: 'Priority level', example: 'high' },
                      unread_count: { category: 'Announcements', description: 'Unread notifications', example: '3' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // STRIKES & HR
                      // ═══════════════════════════════════════════════════════════════
                      strike_count: { category: 'HR', description: 'Total strike count', example: '1' },
                      strike_type: { category: 'HR', description: 'Type of violation', example: 'Tardiness' },
                      strike_date: { category: 'HR', description: 'Date of incident', example: 'Jan 15, 2026' },
                      strike_title: { category: 'HR', description: 'Strike description', example: 'Late arrival' },
                      resolution_notes: { category: 'HR', description: 'Resolution details', example: 'Discussed with manager' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // LINKS & URLS
                      // ═══════════════════════════════════════════════════════════════
                      dashboard_url: { category: 'Links', description: 'Staff dashboard link', example: 'https://...' },
                      action_url: { category: 'Links', description: 'Primary CTA link', example: 'https://...' },
                      profile_url: { category: 'Links', description: 'View profile link', example: 'https://...' },
                      onboarding_url: { category: 'Links', description: 'Onboarding page link', example: 'https://...' },
                      training_url: { category: 'Links', description: 'Training page link', example: 'https://...' },
                      handbook_url: { category: 'Links', description: 'Handbook viewer link', example: 'https://...' },
                      unsubscribe_url: { category: 'Links', description: 'Email unsubscribe link', example: 'https://...' },
                      support_email: { category: 'Links', description: 'Support email address', example: 'help@salon.com' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // DATE & TIME
                      // ═══════════════════════════════════════════════════════════════
                      date: { category: 'Date & Time', description: 'Current date', example: 'January 20, 2026' },
                      date_short: { category: 'Date & Time', description: 'Short date format', example: '1/20/26' },
                      time: { category: 'Date & Time', description: 'Current time', example: '2:30 PM' },
                      day_of_week: { category: 'Date & Time', description: 'Day name', example: 'Monday' },
                      month: { category: 'Date & Time', description: 'Current month', example: 'January' },
                      year: { category: 'Date & Time', description: 'Current year', example: '2026' },
                      today: { category: 'Date & Time', description: 'Today\'s date', example: 'Monday, Jan 20' },
                      tomorrow: { category: 'Date & Time', description: 'Tomorrow\'s date', example: 'Tuesday, Jan 21' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // NUMBERS & GRAMMAR HELPERS
                      // ═══════════════════════════════════════════════════════════════
                      count: { category: 'Numbers', description: 'Generic count value', example: '5' },
                      total: { category: 'Numbers', description: 'Total amount', example: '10' },
                      plural: { category: 'Numbers', description: 'Pluralization (s or empty)', example: 's' },
                      hasHave: { category: 'Numbers', description: 'Grammar: has/have', example: 'have' },
                      isAre: { category: 'Numbers', description: 'Grammar: is/are', example: 'are' },
                      thisThese: { category: 'Numbers', description: 'Grammar: this/these', example: 'these' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // EMERGENCY CONTACTS
                      // ═══════════════════════════════════════════════════════════════
                      emergency_contact: { category: 'Emergency', description: 'Emergency contact name', example: 'John Smith' },
                      emergency_phone: { category: 'Emergency', description: 'Emergency contact phone', example: '555-999-8888' },
                      
                      // ═══════════════════════════════════════════════════════════════
                      // RING THE BELL / WINS
                      // ═══════════════════════════════════════════════════════════════
                      service_booked: { category: 'Wins', description: 'Service that was booked', example: 'Full Balayage' },
                      lead_source: { category: 'Wins', description: 'Where the lead came from', example: 'Instagram' },
                      closing_script: { category: 'Wins', description: 'Script used to close', example: 'Consultation close' },
                      win_amount: { category: 'Wins', description: 'Revenue from the win', example: '$350' },
                    };

                    // Group variables by category
                    const groupedVariables = variables.reduce((acc, variable) => {
                      const meta = variableMetadata[variable] || { category: 'Custom', description: 'Custom template variable' };
                      if (!acc[meta.category]) acc[meta.category] = [];
                      acc[meta.category].push({ name: variable, ...meta });
                      return acc;
                    }, {} as Record<string, Array<{ name: string; category: string; description: string; example?: string }>>);

                    // Category icons and colors
                    const categoryStyles: Record<string, { icon: string; color: string }> = {
                      'Recipient': { icon: '👤', color: 'bg-blue-500/10 text-blue-600' },
                      'Employee Details': { icon: '💼', color: 'bg-indigo-500/10 text-indigo-600' },
                      'Dates': { icon: '🗓️', color: 'bg-teal-500/10 text-teal-600' },
                      'Birthday': { icon: '🎂', color: 'bg-pink-500/10 text-pink-600' },
                      'Location': { icon: '📍', color: 'bg-red-500/10 text-red-600' },
                      'Social': { icon: '📱', color: 'bg-violet-500/10 text-violet-600' },
                      'Handbook': { icon: '📚', color: 'bg-amber-500/10 text-amber-600' },
                      'Program': { icon: '📈', color: 'bg-green-500/10 text-green-600' },
                      'Metrics': { icon: '📊', color: 'bg-emerald-500/10 text-emerald-600' },
                      'Meetings': { icon: '🤝', color: 'bg-sky-500/10 text-sky-600' },
                      'Announcements': { icon: '📢', color: 'bg-yellow-500/10 text-yellow-600' },
                      'HR': { icon: '⚠️', color: 'bg-rose-500/10 text-rose-600' },
                      'Links': { icon: '🔗', color: 'bg-purple-500/10 text-purple-600' },
                      'Date & Time': { icon: '🕐', color: 'bg-cyan-500/10 text-cyan-600' },
                      'Numbers': { icon: '🔢', color: 'bg-orange-500/10 text-orange-600' },
                      'Emergency': { icon: '🚨', color: 'bg-red-500/10 text-red-600' },
                      'Wins': { icon: '🔔', color: 'bg-lime-500/10 text-lime-600' },
                      'Custom': { icon: '⚡', color: 'bg-gray-500/10 text-gray-600' },
                    };

                    return Object.entries(groupedVariables).map(([category, vars]) => (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{categoryStyles[category]?.icon || '📦'}</span>
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category}</span>
                          <span className="text-[10px] text-muted-foreground/60">({vars.length})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {vars.map((v) => (
                            <button
                              key={v.name}
                              onClick={() => { insertVariable(v.name); setToolbarPanel(null); }}
                              className="group flex flex-col items-start p-3 rounded-lg bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all text-left"
                            >
                              <code className="text-xs font-mono font-semibold text-foreground group-hover:text-primary transition-colors">
                                {`{{${v.name}}}`}
                              </code>
                              <span className="text-[11px] text-muted-foreground mt-1 leading-snug">
                                {v.description}
                              </span>
                              {v.example && (
                                <span className="text-[10px] text-muted-foreground/60 mt-1 italic">
                                  e.g., "{v.example}"
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Editor Grid */}
          <div className={cn("grid gap-4", selectedBlock ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1")}>
            {/* Properties Panel - Only shown when a block is selected */}
            {selectedBlock && (
              <div className="lg:col-span-1">
                <Card className="mt-4 border-border/50 shadow-sm">
                  <CardContent className="p-3 space-y-3">
                    <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground">{selectedBlock.type} Settings</div>
                    
                    {(selectedBlock.type === 'heading' || selectedBlock.type === 'text') && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Content</Label>
                          <Textarea
                            ref={textareaRef}
                            value={selectedBlock.content}
                            onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                            className="min-h-[180px] text-sm resize-y font-mono"
                          />
                          <p className="text-[10px] text-muted-foreground">Tip: Select text and click B for bold or I for italic</p>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Font Size</Label>
                            <Select
                              value={selectedBlock.styles.fontSize || '16px'}
                              onValueChange={(v) => updateBlockStyles(selectedBlock.id, { fontSize: v })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fontSizes.map(size => (
                                  <SelectItem key={size} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyInlineFormat(selectedBlock.id, 'strong')}
                            title="Bold selected text"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyInlineFormat(selectedBlock.id, 'em')}
                            title="Italic selected text"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyLinkFormat(selectedBlock.id)}
                            title="Add link to selected text"
                          >
                            <Link className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'button' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs">Button Style</Label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateBlockStyles(selectedBlock.id, { buttonVariant: 'primary' })}
                              className={cn(
                                "flex-1 py-2 px-3 rounded-lg border-2 text-xs font-medium transition-all",
                                (!selectedBlock.styles.buttonVariant || selectedBlock.styles.buttonVariant === 'primary')
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border bg-transparent hover:bg-muted/50"
                              )}
                            >
                              Primary
                            </button>
                            <button
                              onClick={() => updateBlockStyles(selectedBlock.id, { buttonVariant: 'secondary' })}
                              className={cn(
                                "flex-1 py-2 px-3 rounded-lg border-2 text-xs font-medium transition-all",
                                selectedBlock.styles.buttonVariant === 'secondary'
                                  ? "border-foreground bg-background text-foreground"
                                  : "border-border bg-transparent hover:bg-muted/50"
                              )}
                            >
                              Secondary
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Button Text</Label>
                          <Input
                            value={selectedBlock.content}
                            onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Link URL</Label>
                          <Input
                            value={selectedBlock.linkUrl || ''}
                            onChange={(e) => updateBlock(selectedBlock.id, { linkUrl: e.target.value })}
                            placeholder="https://... or {{variable}}"
                            className="h-8 text-sm font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label className="text-xs">
                              {selectedBlock.styles.buttonVariant === 'secondary' ? 'Border/Text Color' : 'Button Color'}
                            </Label>
                            <ColorWheelPicker
                              value={selectedBlock.styles.buttonColor || '#3b82f6'}
                              colorType="primary"
                              onChange={(v) => updateBlockStyles(selectedBlock.id, { buttonColor: v })}
                            />
                          </div>
                          {selectedBlock.styles.buttonVariant !== 'secondary' && (
                            <div className="space-y-2">
                              <Label className="text-xs">Text Color</Label>
                              <ColorWheelPicker
                                value={selectedBlock.styles.buttonTextColor || '#ffffff'}
                                colorType="white"
                                onChange={(v) => updateBlockStyles(selectedBlock.id, { buttonTextColor: v })}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'link' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs">Link Text</Label>
                          <Input
                            value={selectedBlock.content}
                            onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Link URL</Label>
                          <Input
                            value={selectedBlock.linkUrl || ''}
                            onChange={(e) => updateBlock(selectedBlock.id, { linkUrl: e.target.value })}
                            placeholder="https://... or {{variable}}"
                            className="h-8 text-sm font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Link Color</Label>
                          <ColorWheelPicker
                            value={selectedBlock.styles.buttonColor || '#3b82f6'}
                            colorType="primary"
                            onChange={(v) => updateBlockStyles(selectedBlock.id, { buttonColor: v })}
                          />
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'image' && (
                      <>
                        {/* Brand Logos Quick Select */}
                        <div className="space-y-2">
                          <Label className="text-xs">Brand Logos</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {uniqueLogos.map((baseLogo) => {
                              const blackVariant = brandLogos.find(l => l.baseId === baseLogo.baseId && l.variant === 'black')!;
                              const whiteVariant = brandLogos.find(l => l.baseId === baseLogo.baseId && l.variant === 'white')!;
                              const isBlackSelected = selectedBlock.imageUrl === blackVariant.src && selectedBlock.content?.includes('Black');
                              const isWhiteSelected = selectedBlock.imageUrl === whiteVariant.src && selectedBlock.content?.includes('White');
                              return (
                                <div key={baseLogo.baseId} className="flex items-center gap-2 p-2 rounded border">
                                  <div className="w-8 h-8 flex items-center justify-center bg-muted rounded shrink-0">
                                    <img src={baseLogo.src} alt={baseLogo.name} className="w-6 h-6 object-contain" />
                                  </div>
                                  <span className="text-[10px] truncate flex-1">{baseLogo.name}</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => updateBlock(selectedBlock.id, { imageUrl: blackVariant.src, content: `${baseLogo.name} (Black)` })}
                                      className={cn(
                                        "px-2 py-1 rounded text-[9px] font-medium transition-all",
                                        isBlackSelected 
                                          ? "bg-foreground text-background" 
                                          : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                                      )}
                                    >
                                      Black
                                    </button>
                                    <button
                                      onClick={() => updateBlock(selectedBlock.id, { imageUrl: whiteVariant.src, content: `${baseLogo.name} (White)` })}
                                      className={cn(
                                        "px-2 py-1 rounded text-[9px] font-medium border transition-all",
                                        isWhiteSelected 
                                          ? "bg-background text-foreground border-foreground" 
                                          : "bg-background text-foreground/60 border-border hover:border-foreground/40"
                                      )}
                                    >
                                      White
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Custom Image</Label>
                          <div className="flex gap-2">
                            <Input
                              value={selectedBlock.imageUrl || ''}
                              onChange={(e) => updateBlock(selectedBlock.id, { imageUrl: e.target.value })}
                              placeholder="https://..."
                              className="h-8 text-sm flex-1"
                            />
                            <label className="cursor-pointer">
                              <Button variant="outline" size="sm" disabled={isUploading} asChild>
                                <span>
                                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                </span>
                              </Button>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(selectedBlock.id, file);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Alt Text</Label>
                          <Input
                            value={selectedBlock.content}
                            onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                            placeholder="Image description"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Max Width</Label>
                          <Select
                            value={selectedBlock.styles.width || 'auto'}
                            onValueChange={(v) => updateBlockStyles(selectedBlock.id, { width: v })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['auto', '100px', '120px', '150px', '180px', '200px', '250px', '300px', '100%'].map(size => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'spacer' && (
                      <div className="space-y-2">
                        <Label className="text-xs">Height</Label>
                        <Select
                          value={selectedBlock.styles.height || '24px'}
                          onValueChange={(v) => updateBlockStyles(selectedBlock.id, { height: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['8px', '16px', '24px', '32px', '48px', '64px'].map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedBlock.type === 'social' && (
                      <>
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">Social Platforms</Label>
                          {(['instagram', 'tiktok', 'email'] as const).map((platform) => {
                            const link = (selectedBlock.socialLinks || []).find(l => l.platform === platform);
                            const isEnabled = link?.enabled ?? false;
                            const url = link?.url ?? '';
                            
                            return (
                              <div key={platform} className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => {
                                      const newLinks = [...(selectedBlock.socialLinks || [])];
                                      const existingIndex = newLinks.findIndex(l => l.platform === platform);
                                      if (existingIndex >= 0) {
                                        newLinks[existingIndex] = { ...newLinks[existingIndex], enabled: e.target.checked };
                                      } else {
                                        newLinks.push({ platform, url: '', enabled: e.target.checked });
                                      }
                                      updateBlock(selectedBlock.id, { socialLinks: newLinks });
                                    }}
                                    className="h-4 w-4 rounded border-border"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    {platform === 'instagram' && <Instagram className="w-4 h-4" />}
                                    {platform === 'tiktok' && (
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                                      </svg>
                                    )}
                                    {platform === 'email' && <Mail className="w-4 h-4" />}
                                    <span className="text-xs capitalize">{platform === 'email' ? 'Email' : platform}</span>
                                  </div>
                                </div>
                                {isEnabled && (
                                  <Input
                                    value={url}
                                    onChange={(e) => {
                                      const newLinks = [...(selectedBlock.socialLinks || [])];
                                      const existingIndex = newLinks.findIndex(l => l.platform === platform);
                                      if (existingIndex >= 0) {
                                        newLinks[existingIndex] = { ...newLinks[existingIndex], url: e.target.value };
                                      } else {
                                        newLinks.push({ platform, url: e.target.value, enabled: true });
                                      }
                                      updateBlock(selectedBlock.id, { socialLinks: newLinks });
                                    }}
                                    placeholder={platform === 'email' ? 'email@example.com' : `https://${platform}.com/...`}
                                    className="h-7 text-xs"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Icon Color</Label>
                          <ColorWheelPicker
                            value={selectedBlock.styles.buttonColor || '#1a1a1a'}
                            colorType="dark"
                            onChange={(v) => updateBlockStyles(selectedBlock.id, { buttonColor: v })}
                          />
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'footer' && (() => {
                      // Ensure footerConfig always has proper defaults
                      const defaultConfig = { 
                        showLogo: true, 
                        logoId: 'drop-dead-main-white', 
                        logoSize: 'large' as const, 
                        logoPosition: 'center' as const, 
                        showSocialIcons: true, 
                        copyrightText: '© 2026 Drop Dead Salons. All rights reserved.' 
                      };
                      const footerConfig = { ...defaultConfig, ...selectedBlock.footerConfig };
                      
                      return (
                      <>
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">Footer Options</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={footerConfig.showLogo}
                                onChange={(e) => {
                                  updateBlock(selectedBlock.id, {
                                    footerConfig: {
                                      ...footerConfig,
                                      showLogo: e.target.checked,
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-border"
                              />
                              <span className="text-xs">Show Logo</span>
                            </div>
                            {footerConfig.showLogo && (
                              <div className="space-y-2">
                                <Select
                                  value={footerConfig.logoId}
                                  onValueChange={(v) => {
                                    updateBlock(selectedBlock.id, {
                                      footerConfig: {
                                        ...footerConfig,
                                        logoId: v,
                                      }
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {brandLogos.map((logo) => (
                                      <SelectItem key={logo.id} value={logo.id}>
                                        {logo.name} ({logo.variant === 'black' ? 'Black' : 'White'})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Size</span>
                                  <Select
                                    value={footerConfig.logoSize}
                                    onValueChange={(v) => {
                                      updateBlock(selectedBlock.id, {
                                        footerConfig: {
                                          ...footerConfig,
                                          logoSize: v as 'small' | 'medium' | 'large',
                                        }
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs flex-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="small">Small (80px)</SelectItem>
                                      <SelectItem value="medium">Medium (120px)</SelectItem>
                                      <SelectItem value="large">Large (160px)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Position</span>
                                  <div className="flex gap-1 flex-1">
                                    {(['left', 'center', 'right'] as const).map((pos) => (
                                      <Button
                                        key={pos}
                                        type="button"
                                        variant={footerConfig.logoPosition === pos ? 'default' : 'outline'}
                                        size="sm"
                                        className="flex-1 h-7 text-xs capitalize"
                                        onClick={() => {
                                          updateBlock(selectedBlock.id, {
                                            footerConfig: {
                                              ...footerConfig,
                                              logoPosition: pos,
                                            }
                                          });
                                        }}
                                      >
                                        {pos}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={footerConfig.showSocialIcons}
                              onChange={(e) => {
                                updateBlock(selectedBlock.id, {
                                  footerConfig: {
                                    ...footerConfig,
                                    showSocialIcons: e.target.checked,
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-border"
                            />
                            <span className="text-xs">Show Social Icons</span>
                          </div>
                        </div>

                        {footerConfig.showSocialIcons && (
                          <div className="space-y-3">
                            <Label className="text-xs font-medium">Social Platforms</Label>
                            {(['instagram', 'tiktok', 'email'] as const).map((platform) => {
                              const link = (selectedBlock.socialLinks || []).find(l => l.platform === platform);
                              const isEnabled = link?.enabled ?? false;
                              const url = link?.url ?? '';
                              
                              return (
                                <div key={platform} className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isEnabled}
                                      onChange={(e) => {
                                        const newLinks = [...(selectedBlock.socialLinks || [])];
                                        const existingIndex = newLinks.findIndex(l => l.platform === platform);
                                        if (existingIndex >= 0) {
                                          newLinks[existingIndex] = { ...newLinks[existingIndex], enabled: e.target.checked };
                                        } else {
                                          newLinks.push({ platform, url: '', enabled: e.target.checked });
                                        }
                                        updateBlock(selectedBlock.id, { socialLinks: newLinks });
                                      }}
                                      className="h-4 w-4 rounded border-border"
                                    />
                                    <div className="flex items-center gap-1.5">
                                      {platform === 'instagram' && <Instagram className="w-4 h-4" />}
                                      {platform === 'tiktok' && (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                                        </svg>
                                      )}
                                      {platform === 'email' && <Mail className="w-4 h-4" />}
                                      <span className="text-xs capitalize">{platform === 'email' ? 'Email' : platform}</span>
                                    </div>
                                  </div>
                                  {isEnabled && (
                                    <Input
                                      value={url}
                                      onChange={(e) => {
                                        const newLinks = [...(selectedBlock.socialLinks || [])];
                                        const existingIndex = newLinks.findIndex(l => l.platform === platform);
                                        if (existingIndex >= 0) {
                                          newLinks[existingIndex] = { ...newLinks[existingIndex], url: e.target.value };
                                        } else {
                                          newLinks.push({ platform, url: e.target.value, enabled: true });
                                        }
                                        updateBlock(selectedBlock.id, { socialLinks: newLinks });
                                      }}
                                      placeholder={platform === 'email' ? 'email@example.com' : `https://${platform}.com/...`}
                                      className="h-7 text-xs"
                                    />
                                  )}
                                </div>
                              );
                            })}
                            <div className="flex items-center gap-3 pt-2">
                              <Label className="text-xs whitespace-nowrap">Icon Color</Label>
                              <ColorWheelPicker
                                value={selectedBlock.styles.buttonColor || '#f5f0e8'}
                                colorType="light"
                                onChange={(v) => updateBlockStyles(selectedBlock.id, { buttonColor: v })}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs">Copyright Text</Label>
                          <Input
                            value={footerConfig.copyrightText}
                            onChange={(e) => {
                              updateBlock(selectedBlock.id, {
                                footerConfig: {
                                  ...footerConfig,
                                  copyrightText: e.target.value,
                                }
                              });
                            }}
                            placeholder="© 2025 Company Name"
                            className="h-8 text-sm"
                          />
                        </div>
                      </>
                    );
                    })()}

                    {selectedBlock.type === 'header' && (
                      <>
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">Header Options</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedBlock.headerConfig?.showLogo ?? true}
                                onChange={(e) => {
                                  updateBlock(selectedBlock.id, {
                                    headerConfig: {
                                      ...selectedBlock.headerConfig!,
                                      showLogo: e.target.checked,
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-border"
                              />
                              <span className="text-xs">Show Logo</span>
                            </div>
                            {selectedBlock.headerConfig?.showLogo && (
                              <div className="space-y-2">
                                <Select
                                  value={selectedBlock.headerConfig?.logoId || 'drop-dead-main-black'}
                                  onValueChange={(v) => {
                                    updateBlock(selectedBlock.id, {
                                      headerConfig: {
                                        ...selectedBlock.headerConfig!,
                                        logoId: v,
                                      }
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {brandLogos.map((logo) => (
                                      <SelectItem key={logo.id} value={logo.id}>
                                        {logo.name} ({logo.variant === 'black' ? 'Black' : 'White'})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Size</span>
                                  <Select
                                    value={selectedBlock.headerConfig?.logoSize || 'medium'}
                                    onValueChange={(v) => {
                                      updateBlock(selectedBlock.id, {
                                        headerConfig: {
                                          ...selectedBlock.headerConfig!,
                                          logoSize: v as 'small' | 'medium' | 'large',
                                        }
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs flex-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="small">Small (80px)</SelectItem>
                                      <SelectItem value="medium">Medium (120px)</SelectItem>
                                      <SelectItem value="large">Large (160px)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Position</span>
                                  <div className="flex gap-1 flex-1">
                                    {(['left', 'center', 'right'] as const).map((pos) => (
                                      <Button
                                        key={pos}
                                        type="button"
                                        variant={selectedBlock.headerConfig?.logoPosition === pos || (!selectedBlock.headerConfig?.logoPosition && pos === 'left') ? 'default' : 'outline'}
                                        size="sm"
                                        className="flex-1 h-7 text-xs capitalize"
                                        onClick={() => {
                                          updateBlock(selectedBlock.id, {
                                            headerConfig: {
                                              ...selectedBlock.headerConfig!,
                                              logoPosition: pos,
                                            }
                                          });
                                        }}
                                      >
                                        {pos}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedBlock.headerConfig?.showNavLinks ?? true}
                                onChange={(e) => {
                                  updateBlock(selectedBlock.id, {
                                    headerConfig: {
                                      ...selectedBlock.headerConfig!,
                                      showNavLinks: e.target.checked,
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-border"
                              />
                              <span className="text-xs">Show Navigation Links</span>
                            </div>
                            {selectedBlock.headerConfig?.showNavLinks && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Alignment</span>
                                <div className="flex gap-1 flex-1">
                                  {(['left', 'center', 'right'] as const).map((pos) => (
                                    <Button
                                      key={pos}
                                      type="button"
                                      variant={selectedBlock.headerConfig?.navLinksPosition === pos || (!selectedBlock.headerConfig?.navLinksPosition && pos === 'right') ? 'default' : 'outline'}
                                      size="sm"
                                      className="flex-1 h-7 text-xs capitalize"
                                      onClick={() => {
                                        updateBlock(selectedBlock.id, {
                                          headerConfig: {
                                            ...selectedBlock.headerConfig!,
                                            navLinksPosition: pos,
                                          }
                                        });
                                      }}
                                    >
                                      {pos}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedBlock.headerConfig?.showNavLinks && (
                          <div className="space-y-3">
                            <Label className="text-xs font-medium">Navigation Links</Label>
                            {(selectedBlock.navLinks || []).map((link, index) => (
                              <div key={index} className="space-y-1.5 p-2 border rounded-md bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={link.enabled}
                                    onChange={(e) => {
                                      const newLinks = [...(selectedBlock.navLinks || [])];
                                      newLinks[index] = { ...newLinks[index], enabled: e.target.checked };
                                      updateBlock(selectedBlock.id, { navLinks: newLinks });
                                    }}
                                    className="h-4 w-4 rounded border-border"
                                  />
                                  <Input
                                    value={link.label}
                                    onChange={(e) => {
                                      const newLinks = [...(selectedBlock.navLinks || [])];
                                      newLinks[index] = { ...newLinks[index], label: e.target.value };
                                      updateBlock(selectedBlock.id, { navLinks: newLinks });
                                    }}
                                    placeholder="Link label"
                                    className="h-7 text-xs flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                    onClick={() => {
                                      const newLinks = (selectedBlock.navLinks || []).filter((_, i) => i !== index);
                                      updateBlock(selectedBlock.id, { navLinks: newLinks });
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                {link.enabled && (
                                  <Input
                                    value={link.url}
                                    onChange={(e) => {
                                      const newLinks = [...(selectedBlock.navLinks || [])];
                                      newLinks[index] = { ...newLinks[index], url: e.target.value };
                                      updateBlock(selectedBlock.id, { navLinks: newLinks });
                                    }}
                                    placeholder="https://..."
                                    className="h-7 text-xs"
                                  />
                                )}
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                const newLinks = [...(selectedBlock.navLinks || []), { label: 'New Link', url: '#', enabled: true }];
                                updateBlock(selectedBlock.id, { navLinks: newLinks });
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Link
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Common settings */}
                    {selectedBlock.type !== 'divider' && selectedBlock.type !== 'spacer' && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Alignment</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map(align => (
                              <Button
                                key={align}
                                variant={selectedBlock.styles.textAlign === align ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateBlockStyles(selectedBlock.id, { textAlign: align })}
                              >
                                {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                                {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                                {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Background</Label>
                            <ColorWheelPicker
                              value={selectedBlock.styles.backgroundColor || 'transparent'}
                              colorType="light"
                              onChange={(v) => updateBlockStyles(selectedBlock.id, { backgroundColor: v })}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Text Color</Label>
                            <ColorWheelPicker
                              value={selectedBlock.styles.textColor || '#000000'}
                              colorType="text"
                              onChange={(v) => updateBlockStyles(selectedBlock.id, { textColor: v })}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Canvas */}
            <div className="lg:col-span-2">
              <div className="sticky top-4">
                <div className="font-medium text-sm mb-2">Email Canvas</div>
                <ScrollArea className="h-[calc(100vh-200px)] max-h-[700px] border rounded-lg bg-muted/50 p-4">
                <div className="bg-white rounded-lg shadow-lg max-w-[600px] mx-auto overflow-hidden">
                  {blocks.map((block, index) => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, block.id)}
                      onDragOver={(e) => handleDragOver(e, block.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, block.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'relative group cursor-pointer transition-all',
                        selectedBlockId === block.id && 'ring-2 ring-primary ring-offset-2',
                        draggedBlockId === block.id && 'opacity-50 scale-[0.98]',
                        dragOverBlockId === block.id && 'ring-2 ring-primary ring-dashed'
                      )}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      {/* Drag handle indicator */}
                      <div className={cn(
                        'absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing',
                        selectedBlockId === block.id && 'opacity-100'
                      )}>
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {/* Block toolbar - top right corner */}
                      <div className={cn(
                        'absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm rounded-md shadow-sm border p-0.5',
                        selectedBlockId === block.id && 'opacity-100'
                      )}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                          disabled={index === blocks.length - 1}
                        >
                        <ChevronDown className="w-3 h-3" />
                        </Button>
                        <div className="w-px h-4 bg-border" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                          title="Duplicate block"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" 
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Block content preview */}
                      <div 
                        style={{
                          backgroundColor: block.styles.backgroundColor,
                          color: block.styles.textColor,
                          fontSize: block.styles.fontSize,
                          fontWeight: block.styles.fontWeight,
                          textAlign: block.styles.textAlign,
                          padding: block.styles.padding,
                        }}
                      >
                        {block.type === 'heading' && (
                          <h1 
                            style={{ margin: 0, fontSize: block.styles.fontSize }}
                            dangerouslySetInnerHTML={{ __html: block.content.replace(/\n/g, '<br/>') }}
                          />
                        )}
                        {block.type === 'text' && (
                          <p 
                            style={{ margin: 0, lineHeight: 1.6 }}
                            dangerouslySetInnerHTML={{ __html: block.content.replace(/\n/g, '<br/>') }}
                          />
                        )}
                        {block.type === 'image' && (
                          <div style={{ textAlign: block.styles.textAlign }}>
                            {block.imageUrl ? (
                              <img 
                                src={block.imageUrl} 
                                alt={block.content || 'Email image'} 
                                style={{ maxWidth: '100%', borderRadius: block.styles.borderRadius }}
                              />
                            ) : (
                              <div className="bg-muted flex items-center justify-center h-32 rounded">
                                <Image className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        )}
                        {block.type === 'button' && (
                          <div style={{ textAlign: block.styles.textAlign }}>
                            {block.styles.buttonVariant === 'secondary' ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  backgroundColor: block.styles.backgroundColor || '#f5f0e8',
                                  color: block.styles.buttonColor || '#1a1a1a',
                                  padding: '16px 32px',
                                  fontWeight: 'bold',
                                  borderRadius: block.styles.borderRadius || '8px',
                                  border: `2px solid ${block.styles.buttonColor || '#1a1a1a'}`,
                                }}
                              >
                                {block.content}
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-block',
                                  backgroundColor: block.styles.buttonColor || '#3b82f6',
                                  color: block.styles.buttonTextColor || '#ffffff',
                                  padding: '16px 32px',
                                  fontWeight: 'bold',
                                  borderRadius: block.styles.borderRadius || '8px',
                                }}
                              >
                                {block.content}
                              </span>
                            )}
                          </div>
                        )}
                        {block.type === 'link' && (
                          <p style={{ margin: 0, lineHeight: 1.6 }}>
                            <a 
                              href="#" 
                              onClick={(e) => e.preventDefault()}
                              style={{ 
                                color: block.styles.buttonColor || '#3b82f6', 
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              }}
                            >
                              {block.content}
                            </a>
                          </p>
                        )}
                        {block.type === 'divider' && (
                          <hr style={{ border: 'none', borderTop: `1px solid ${block.styles.textColor || '#e5e7eb'}` }} />
                        )}
                        {block.type === 'spacer' && (
                          <div style={{ height: block.styles.height || '24px' }} className="border-dashed border opacity-50 bg-muted/30" />
                        )}
                        {block.type === 'social' && (
                          <div style={{ textAlign: block.styles.textAlign || 'center' }} className="flex items-center justify-center gap-4">
                            {(block.socialLinks || []).filter(link => link.enabled).map((link) => (
                              <div 
                                key={link.platform}
                                className="w-8 h-8 flex items-center justify-center"
                                style={{ color: block.styles.buttonColor || '#1a1a1a' }}
                              >
                                {link.platform === 'instagram' && <Instagram className="w-6 h-6" />}
                                {link.platform === 'tiktok' && (
                                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                                  </svg>
                                )}
                                {link.platform === 'email' && <Mail className="w-6 h-6" />}
                              </div>
                            ))}
                            {(block.socialLinks || []).filter(link => link.enabled).length === 0 && (
                              <span className="text-xs text-muted-foreground">No icons enabled</span>
                            )}
                          </div>
                        )}
                        {block.type === 'footer' && (() => {
                          const defaultFooterConfig = { showLogo: true, logoId: 'drop-dead-main-white', logoSize: 'large' as const, logoPosition: 'center' as const, showSocialIcons: true, copyrightText: '© 2026 Drop Dead Salons. All rights reserved.' };
                          const footerConfig = block.footerConfig ? { ...defaultFooterConfig, ...block.footerConfig } : defaultFooterConfig;
                          // Ensure logoId is never empty/undefined
                          const logoId = (footerConfig.logoId && footerConfig.logoId.length > 0) ? footerConfig.logoId : 'drop-dead-main-white';
                          const logo = getLogoById(logoId) || brandLogos.find(l => l.variant === 'white') || brandLogos[0];
                          const enabledLinks = (block.socialLinks || []).filter(l => l.enabled);
                          const logoSizeMap = { small: '80px', medium: '120px', large: '160px' };
                          const logoMaxWidth = logoSizeMap[footerConfig.logoSize || 'large'];
                          const logoPosition = footerConfig.logoPosition || 'center';
                          // Ensure showLogo defaults to true if undefined
                          const showLogo = footerConfig.showLogo !== false;
                          
                          const alignClass = logoPosition === 'left' ? 'items-start text-left' 
                            : logoPosition === 'right' ? 'items-end text-right' 
                            : 'items-center text-center';
                          
                          return (
                            <div className={`flex flex-col ${alignClass}`}>
                              {showLogo && logo && (
                                <div className="mb-3" style={{ minHeight: '30px' }}>
                                  <img 
                                    src={logo.src} 
                                    alt={logo.name} 
                                    style={{ maxWidth: logoMaxWidth, height: 'auto', display: 'block', minHeight: '20px' }}
                                  />
                                </div>
                              )}
                              {footerConfig.showSocialIcons && enabledLinks.length > 0 && (
                                <div className={`flex items-center gap-3 mb-3 ${logoPosition === 'center' ? 'justify-center' : logoPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
                                  {enabledLinks.map((link) => (
                                    <div 
                                      key={link.platform}
                                      className="w-6 h-6 flex items-center justify-center"
                                      style={{ color: block.styles.buttonColor || '#f5f0e8' }}
                                    >
                                      {link.platform === 'instagram' && <Instagram className="w-5 h-5" />}
                                      {link.platform === 'tiktok' && (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                                        </svg>
                                      )}
                                      {link.platform === 'email' && <Mail className="w-5 h-5" />}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>{footerConfig.copyrightText}</p>
                            </div>
                          );
                        })()}
                        {block.type === 'header' && (() => {
                          const headerConfig = block.headerConfig || { showLogo: true, logoId: 'drop-dead-main-white', showNavLinks: true };
                          const logo = getLogoById(headerConfig.logoId) || brandLogos[0];
                          const enabledLinks = (block.navLinks || []).filter(l => l.enabled);
                          const logoSizeMap = { small: '80px', medium: '120px', large: '160px' };
                          const logoMaxWidth = logoSizeMap[headerConfig.logoSize || 'medium'];
                          const logoPosition = headerConfig.logoPosition || 'left';
                          const navLinksPosition = headerConfig.navLinksPosition || 'right';
                          
                          const logoElement = headerConfig.showLogo && logo ? (
                            <img 
                              src={logo.src} 
                              alt={logo.name} 
                              style={{ maxWidth: logoMaxWidth, height: 'auto', display: 'block' }}
                            />
                          ) : null;
                          
                          const navElement = headerConfig.showNavLinks && enabledLinks.length > 0 ? (
                            <div className="flex items-center gap-4">
                              {enabledLinks.map((link, index) => (
                                <span 
                                  key={index}
                                  className="text-xs font-medium"
                                  style={{ color: block.styles.textColor || '#f5f0e8' }}
                                >
                                  {link.label}
                                </span>
                              ))}
                            </div>
                          ) : null;
                          
                          // Use 3-column grid for independent logo and nav positioning
                          return (
                            <div className="grid grid-cols-3 items-center w-full px-4">
                              {/* Left column */}
                              <div className="flex justify-start">
                                {logoPosition === 'left' && logoElement}
                                {navLinksPosition === 'left' && navElement}
                              </div>
                              {/* Center column */}
                              <div className="flex justify-center">
                                {logoPosition === 'center' && logoElement}
                                {navLinksPosition === 'center' && navElement}
                              </div>
                              {/* Right column */}
                              <div className="flex justify-end">
                                {logoPosition === 'right' && logoElement}
                                {navLinksPosition === 'right' && navElement}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                  
                  {blocks.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Add blocks to build your email</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Textarea
            value={rawHtml}
            onChange={(e) => handleRawHtmlChange(e.target.value)}
            className="font-mono text-xs min-h-[500px]"
            placeholder="HTML email body..."
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div className="border rounded-lg bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-[600px] mx-auto p-0 overflow-hidden">
              <div
                dangerouslySetInnerHTML={{
                  __html: renderPreviewHtml(blocksToHtml(blocks)),
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
