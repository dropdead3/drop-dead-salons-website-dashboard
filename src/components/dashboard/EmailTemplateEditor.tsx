import { useState, useCallback, useEffect } from 'react';
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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUndoRedo } from '@/hooks/useUndoRedo';

// Import brand logos
import dropDeadLogo from '@/assets/drop-dead-logo.svg';
import ddSecondaryLogo from '@/assets/dd-secondary-logo.svg';
import dd75Icon from '@/assets/dd75-icon.svg';
import dd75Logo from '@/assets/dd75-logo.svg';

// Brand logo presets
interface BrandLogo {
  id: string;
  name: string;
  src: string;
  description: string;
}

const brandLogos: BrandLogo[] = [
  {
    id: 'drop-dead-main',
    name: 'Drop Dead Logo',
    src: dropDeadLogo,
    description: 'Primary wordmark logo',
  },
  {
    id: 'dd-secondary',
    name: 'DD Secondary',
    src: ddSecondaryLogo,
    description: 'Secondary icon logo',
  },
  {
    id: 'dd75-icon',
    name: 'DD75 Icon',
    src: dd75Icon,
    description: 'Circular icon mark',
  },
  {
    id: 'dd75-logo',
    name: 'DD75 Logo',
    src: dd75Logo,
    description: 'DD75 wordmark',
  },
];

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
    showSocialIcons: boolean;
    copyrightText: string;
  };
  headerConfig?: {
    showLogo: boolean;
    logoId: string;
    showNavLinks: boolean;
  };
  navLinks?: NavLink[];
}

interface EmailTemplateEditorProps {
  initialHtml: string;
  variables: string[];
  onHtmlChange: (html: string) => void;
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
interface EmailTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    headerBg: string;
    headerText: string;
    bodyBg: string;
    bodyText: string;
    buttonBg: string;
    buttonText: string;
    accentColor: string;
    dividerColor: string;
  };
}

const emailThemes: EmailTheme[] = [
  {
    id: 'drop-dead',
    name: 'Drop Dead Standard',
    description: 'Cream, oat & black luxury palette',
    colors: {
      headerBg: '#1a1a1a',
      headerText: '#f5f0e8',
      bodyBg: '#f5f0e8',
      bodyText: '#1a1a1a',
      buttonBg: '#1a1a1a',
      buttonText: '#f5f0e8',
      accentColor: '#d4c5b0',
      dividerColor: '#d4c5b0',
    },
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean black & white',
    colors: {
      headerBg: '#000000',
      headerText: '#ffffff',
      bodyBg: '#ffffff',
      bodyText: '#000000',
      buttonBg: '#000000',
      buttonText: '#ffffff',
      accentColor: '#f3f4f6',
      dividerColor: '#e5e7eb',
    },
  },
  {
    id: 'warm-neutral',
    name: 'Warm Neutral',
    description: 'Soft beige & warm tones',
    colors: {
      headerBg: '#292524',
      headerText: '#faf7f5',
      bodyBg: '#faf7f5',
      bodyText: '#292524',
      buttonBg: '#78716c',
      buttonText: '#faf7f5',
      accentColor: '#e7e5e4',
      dividerColor: '#d6d3d1',
    },
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Fresh blue tones',
    colors: {
      headerBg: '#0f172a',
      headerText: '#f0f9ff',
      bodyBg: '#f0f9ff',
      bodyText: '#0f172a',
      buttonBg: '#3b82f6',
      buttonText: '#ffffff',
      accentColor: '#dbeafe',
      dividerColor: '#bfdbfe',
    },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Earthy green palette',
    colors: {
      headerBg: '#14532d',
      headerText: '#f0fdf4',
      bodyBg: '#f0fdf4',
      bodyText: '#14532d',
      buttonBg: '#16a34a',
      buttonText: '#ffffff',
      accentColor: '#dcfce7',
      dividerColor: '#bbf7d0',
    },
  },
  {
    id: 'rose-blush',
    name: 'Rose Blush',
    description: 'Soft pink elegance',
    colors: {
      headerBg: '#831843',
      headerText: '#fdf2f8',
      bodyBg: '#fdf2f8',
      bodyText: '#831843',
      buttonBg: '#db2777',
      buttonText: '#ffffff',
      accentColor: '#fce7f3',
      dividerColor: '#fbcfe8',
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

    switch (block.type) {
      case 'heading':
        return `<h1 style="${baseStyles}; margin: 0;">${block.content}</h1>`;
      case 'text':
        return `<p style="${baseStyles}; margin: 0; line-height: 1.6;">${block.content}</p>`;
      case 'image':
        return `<div style="text-align: ${block.styles.textAlign || 'center'}; ${block.styles.padding ? `padding: ${block.styles.padding};` : ''}">
          <img src="${block.imageUrl || 'https://via.placeholder.com/400x200'}" alt="${block.content || 'Email image'}" style="max-width: 100%; ${block.styles.width ? `width: ${block.styles.width};` : ''} ${block.styles.borderRadius ? `border-radius: ${block.styles.borderRadius};` : ''}" />
        </div>`;
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
        const footerConfig = block.footerConfig || { showLogo: true, logoId: 'drop-dead-main', showSocialIcons: true, copyrightText: '© 2025 Drop Dead Gorgeous. All rights reserved.' };
        const logo = brandLogos.find(l => l.id === footerConfig.logoId) || brandLogos[0];
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
        const headerConfig = block.headerConfig || { showLogo: true, logoId: 'drop-dead-main', showNavLinks: true };
        const logo = brandLogos.find(l => l.id === headerConfig.logoId) || brandLogos[0];
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

export function EmailTemplateEditor({ initialHtml, variables, onHtmlChange }: EmailTemplateEditorProps) {
  const defaultTheme = emailThemes[0]; // Drop Dead Standard
  
  const getInitialBlocks = (): EmailBlock[] => {
    const parsed = parseHtmlToBlocks(initialHtml);
    return parsed.length > 0 ? parsed : [
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
          borderRadius: '12px 12px 0 0' 
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
  const [isUploading, setIsUploading] = useState(false);
  const [rawHtml, setRawHtml] = useState(initialHtml);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('drop-dead');
  const [customThemes, setCustomThemes] = useState<EmailTheme[]>([]);
  const [isCreateThemeOpen, setIsCreateThemeOpen] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [newTheme, setNewTheme] = useState<Omit<EmailTheme, 'id'>>({
    name: '',
    description: '',
    colors: {
      headerBg: '#1a1a1a',
      headerText: '#f5f0e8',
      bodyBg: '#f5f0e8',
      bodyText: '#1a1a1a',
      buttonBg: '#1a1a1a',
      buttonText: '#f5f0e8',
      accentColor: '#d4c5b0',
      dividerColor: '#d4c5b0',
    },
  });

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
        colors: {
          headerBg: t.header_bg,
          headerText: t.header_text,
          bodyBg: t.body_bg,
          bodyText: t.body_text,
          buttonBg: t.button_bg,
          buttonText: t.button_text,
          accentColor: t.accent_color,
          dividerColor: t.divider_color,
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
        colors: {
          headerBg: data.header_bg,
          headerText: data.header_text,
          bodyBg: data.body_bg,
          bodyText: data.body_text,
          buttonBg: data.button_bg,
          buttonText: data.button_text,
          accentColor: data.accent_color,
          dividerColor: data.divider_color,
        },
      };

      setCustomThemes(prev => [...prev, newCustomTheme]);
      setIsCreateThemeOpen(false);
      setNewTheme({
        name: '',
        description: '',
        colors: {
          headerBg: '#1a1a1a',
          headerText: '#f5f0e8',
          bodyBg: '#f5f0e8',
          bodyText: '#1a1a1a',
          buttonBg: '#1a1a1a',
          buttonText: '#f5f0e8',
          accentColor: '#d4c5b0',
          dividerColor: '#d4c5b0',
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

  // Combined themes (built-in + custom)
  const allThemes = [...emailThemes, ...customThemes];

  const updateBlocksAndHtml = useCallback((newBlocks: EmailBlock[]) => {
    setBlocks(newBlocks);
    const html = blocksToHtml(newBlocks);
    setRawHtml(html);
    onHtmlChange(html);
  }, [onHtmlChange, setBlocks]);

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
          { platform: 'instagram' as const, url: 'https://instagram.com/dropdeadhair', enabled: true },
          { platform: 'tiktok' as const, url: 'https://tiktok.com/@dropdeadhair', enabled: true },
          { platform: 'email' as const, url: 'hello@dropdeadhair.com', enabled: true },
        ],
        footerConfig: {
          showLogo: true,
          logoId: 'drop-dead-main',
          showSocialIcons: true,
          copyrightText: '© 2025 Drop Dead Gorgeous. All rights reserved.',
        }
      }),
      ...(type === 'header' && {
        navLinks: [
          { label: 'Home', url: 'https://dropdeadhair.com', enabled: true },
          { label: 'Services', url: 'https://dropdeadhair.com/services', enabled: true },
          { label: 'Book Now', url: 'https://dropdeadhair.com/booking', enabled: true },
        ],
        headerConfig: {
          showLogo: true,
          logoId: 'drop-dead-main',
          showNavLinks: true,
        }
      }),
    };
    updateBlocksAndHtml([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const addLogoBlock = (logo: BrandLogo) => {
    const currentTheme = allThemes.find(t => t.id === selectedTheme) || emailThemes[0];
    
    const newBlock: EmailBlock = {
      id: crypto.randomUUID(),
      type: 'image',
      content: logo.name,
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
    toast.success(`Added ${logo.name}`);
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
      {/* Variables toolbar */}
      {variables.length > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Variable className="w-4 h-4" />
            <span className="text-sm font-medium">Click to insert variable:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {variables.map((variable) => (
              <Badge
                key={variable}
                variant="secondary"
                className="text-xs font-mono cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => insertVariable(variable)}
              >
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

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

        <TabsContent value="visual" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Block palette and theme selector */}
            <div className="space-y-4">
              {/* Theme Selector */}
              <div>
                <div className="font-medium text-sm mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Color Theme
                  </div>
                  <Dialog open={isCreateThemeOpen} onOpenChange={setIsCreateThemeOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                        <Plus className="w-3 h-3" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Create Custom Theme
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
                        
                        {/* Color preview */}
                        <div className="p-3 rounded-lg border">
                          <div className="text-xs font-medium mb-2">Preview</div>
                          <div className="rounded-lg overflow-hidden shadow-sm">
                            <div 
                              className="p-3 text-center text-sm font-medium"
                              style={{ backgroundColor: newTheme.colors.headerBg, color: newTheme.colors.headerText }}
                            >
                              Header Preview
                            </div>
                            <div 
                              className="p-3 text-sm"
                              style={{ backgroundColor: newTheme.colors.bodyBg, color: newTheme.colors.bodyText }}
                            >
                              Body content preview text
                              <div className="mt-2 flex justify-center">
                                <span
                                  className="px-4 py-1 rounded text-xs font-medium"
                                  style={{ backgroundColor: newTheme.colors.buttonBg, color: newTheme.colors.buttonText }}
                                >
                                  Button
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Color pickers grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Header BG</Label>
                            <ColorPicker
                              value={newTheme.colors.headerBg}
                              onChange={(v) => setNewTheme(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, headerBg: v } 
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Header Text</Label>
                            <ColorPicker
                              value={newTheme.colors.headerText}
                              onChange={(v) => setNewTheme(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, headerText: v } 
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Body BG</Label>
                            <ColorPicker
                              value={newTheme.colors.bodyBg}
                              onChange={(v) => setNewTheme(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, bodyBg: v } 
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Body Text</Label>
                            <ColorPicker
                              value={newTheme.colors.bodyText}
                              onChange={(v) => setNewTheme(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, bodyText: v } 
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Button BG</Label>
                            <ColorPicker
                              value={newTheme.colors.buttonBg}
                              onChange={(v) => setNewTheme(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, buttonBg: v } 
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Button Text</Label>
                            <ColorPicker
                              value={newTheme.colors.buttonText}
                              onChange={(v) => setNewTheme(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, buttonText: v } 
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Accent</Label>
                            <ColorPicker
                              value={newTheme.colors.accentColor}
                              onChange={(v) => setNewTheme(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, accentColor: v } 
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Divider</Label>
                            <ColorPicker
                              value={newTheme.colors.dividerColor}
                              onChange={(v) => setNewTheme(prev => ({ 
                                ...prev, 
                                colors: { ...prev.colors, dividerColor: v } 
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateThemeOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveCustomTheme} disabled={isSavingTheme}>
                          {isSavingTheme ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Theme
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="grid grid-cols-1 gap-2 pr-2">
                    {/* Built-in themes */}
                    {emailThemes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => applyTheme(theme.id)}
                        className={cn(
                          "p-2 rounded-lg border-2 text-left transition-all",
                          selectedTheme === theme.id 
                            ? "border-foreground bg-accent/50" 
                            : "border-transparent bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            <div 
                              className="w-3 h-3 rounded-full border border-border" 
                              style={{ backgroundColor: theme.colors.headerBg }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full border border-border" 
                              style={{ backgroundColor: theme.colors.bodyBg }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full border border-border" 
                              style={{ backgroundColor: theme.colors.buttonBg }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full border border-border" 
                              style={{ backgroundColor: theme.colors.accentColor }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{theme.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{theme.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* Custom themes */}
                    {customThemes.length > 0 && (
                      <>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide pt-2 pb-1 font-medium">
                          Custom Themes
                        </div>
                        {customThemes.map((theme) => (
                          <div
                            key={theme.id}
                            className={cn(
                              "p-2 rounded-lg border-2 text-left transition-all group relative",
                              selectedTheme === theme.id 
                                ? "border-foreground bg-accent/50" 
                                : "border-transparent bg-muted/30 hover:bg-muted/50"
                            )}
                          >
                            <button
                              onClick={() => applyTheme(theme.id)}
                              className="w-full text-left"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                  <div 
                                    className="w-3 h-3 rounded-full border border-border" 
                                    style={{ backgroundColor: theme.colors.headerBg }}
                                  />
                                  <div 
                                    className="w-3 h-3 rounded-full border border-border" 
                                    style={{ backgroundColor: theme.colors.bodyBg }}
                                  />
                                  <div 
                                    className="w-3 h-3 rounded-full border border-border" 
                                    style={{ backgroundColor: theme.colors.buttonBg }}
                                  />
                                  <div 
                                    className="w-3 h-3 rounded-full border border-border" 
                                    style={{ backgroundColor: theme.colors.accentColor }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                    {theme.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">{theme.description}</div>
                                </div>
                              </div>
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomTheme(theme.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="border-t pt-4">
                <div className="font-medium text-sm mb-2">Add Block</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => addBlock('heading')} className="justify-start gap-2">
                    <Type className="w-4 h-4" />
                    Heading
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock('text')} className="justify-start gap-2">
                    <AlignLeft className="w-4 h-4" />
                    Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock('image')} className="justify-start gap-2">
                    <Image className="w-4 h-4" />
                    Image
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addBlock('button', 'primary')} 
                    className="justify-start gap-2 h-auto py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="px-2 py-1 text-[8px] font-bold rounded"
                        style={{ backgroundColor: '#1a1a1a', color: '#f5f0e8' }}
                      >
                        Aa
                      </div>
                      <span className="text-xs">Primary Button</span>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addBlock('button', 'secondary')} 
                    className="justify-start gap-2 h-auto py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="px-2 py-1 text-[8px] font-bold rounded border-2"
                        style={{ backgroundColor: '#f5f0e8', color: '#1a1a1a', borderColor: '#1a1a1a' }}
                      >
                        Aa
                      </div>
                      <span className="text-xs">Secondary Button</span>
                    </div>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock('link')} className="justify-start gap-2">
                    <Link className="w-4 h-4" />
                    Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock('divider')} className="justify-start gap-2">
                    <Minus className="w-4 h-4" />
                    Divider
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock('spacer')} className="justify-start gap-2">
                    <Square className="w-4 h-4" />
                    Spacer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock('social')} className="justify-start gap-2">
                    <Share2 className="w-4 h-4" />
                    Social Icons
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock('footer')} className="justify-start gap-2">
                    <LayoutTemplate className="w-4 h-4" />
                    Footer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock('header')} className="justify-start gap-2 col-span-2">
                    <LayoutTemplate className="w-4 h-4" />
                    Header
                  </Button>
                </div>
              </div>
              
              {/* Brand Logo Shortcuts */}
              <div className="border-t pt-4">
                <div className="font-medium text-sm mb-2">Brand Logos</div>
                <div className="grid grid-cols-2 gap-2">
                  {brandLogos.map((logo) => (
                    <Button
                      key={logo.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addLogoBlock(logo)}
                      className="justify-start gap-2 h-auto py-2"
                    >
                      <div className="w-6 h-6 flex items-center justify-center bg-muted rounded">
                        <img src={logo.src} alt={logo.name} className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs truncate">{logo.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Block properties panel */}
              {selectedBlock && (
                <Card className="mt-4">
                  <CardContent className="p-4 space-y-4">
                    <div className="font-medium text-sm capitalize">{selectedBlock.type} Settings</div>
                    
                    {(selectedBlock.type === 'heading' || selectedBlock.type === 'text') && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs">Content</Label>
                          <Textarea
                            value={selectedBlock.content}
                            onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                            className="min-h-[80px] text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Font Size</Label>
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
                        <div className="flex gap-2">
                          <Button
                            variant={selectedBlock.styles.fontWeight === 'bold' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateBlockStyles(selectedBlock.id, { 
                              fontWeight: selectedBlock.styles.fontWeight === 'bold' ? 'normal' : 'bold' 
                            })}
                          >
                            <Bold className="w-4 h-4" />
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
                            <ColorPicker
                              value={selectedBlock.styles.buttonColor || '#3b82f6'}
                              onChange={(v) => updateBlockStyles(selectedBlock.id, { buttonColor: v })}
                            />
                          </div>
                          {selectedBlock.styles.buttonVariant !== 'secondary' && (
                            <div className="space-y-2">
                              <Label className="text-xs">Text Color</Label>
                              <ColorPicker
                                value={selectedBlock.styles.buttonTextColor || '#ffffff'}
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
                          <ColorPicker
                            value={selectedBlock.styles.buttonColor || '#3b82f6'}
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
                          <div className="grid grid-cols-2 gap-1">
                            {brandLogos.map((logo) => (
                              <button
                                key={logo.id}
                                onClick={() => {
                                  updateBlock(selectedBlock.id, { 
                                    imageUrl: logo.src,
                                    content: logo.name
                                  });
                                }}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded border text-left transition-all hover:border-primary",
                                  selectedBlock.imageUrl === logo.src && "border-primary bg-primary/5"
                                )}
                              >
                                <div className="w-8 h-8 flex items-center justify-center bg-muted rounded">
                                  <img src={logo.src} alt={logo.name} className="w-6 h-6 object-contain" />
                                </div>
                                <span className="text-[10px] truncate flex-1">{logo.name}</span>
                              </button>
                            ))}
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
                          <ColorPicker
                            value={selectedBlock.styles.buttonColor || '#1a1a1a'}
                            onChange={(v) => updateBlockStyles(selectedBlock.id, { buttonColor: v })}
                          />
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'footer' && (
                      <>
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">Footer Options</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedBlock.footerConfig?.showLogo ?? true}
                                onChange={(e) => {
                                  updateBlock(selectedBlock.id, {
                                    footerConfig: {
                                      ...selectedBlock.footerConfig!,
                                      showLogo: e.target.checked,
                                    }
                                  });
                                }}
                                className="h-4 w-4 rounded border-border"
                              />
                              <span className="text-xs">Show Logo</span>
                            </div>
                            {selectedBlock.footerConfig?.showLogo && (
                              <Select
                                value={selectedBlock.footerConfig?.logoId || 'drop-dead-main'}
                                onValueChange={(v) => {
                                  updateBlock(selectedBlock.id, {
                                    footerConfig: {
                                      ...selectedBlock.footerConfig!,
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
                                    <SelectItem key={logo.id} value={logo.id}>{logo.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedBlock.footerConfig?.showSocialIcons ?? true}
                              onChange={(e) => {
                                updateBlock(selectedBlock.id, {
                                  footerConfig: {
                                    ...selectedBlock.footerConfig!,
                                    showSocialIcons: e.target.checked,
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-border"
                            />
                            <span className="text-xs">Show Social Icons</span>
                          </div>
                        </div>

                        {selectedBlock.footerConfig?.showSocialIcons && (
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
                            <div className="space-y-2">
                              <Label className="text-xs">Icon Color</Label>
                              <ColorPicker
                                value={selectedBlock.styles.buttonColor || '#f5f0e8'}
                                onChange={(v) => updateBlockStyles(selectedBlock.id, { buttonColor: v })}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs">Copyright Text</Label>
                          <Input
                            value={selectedBlock.footerConfig?.copyrightText || ''}
                            onChange={(e) => {
                              updateBlock(selectedBlock.id, {
                                footerConfig: {
                                  ...selectedBlock.footerConfig!,
                                  copyrightText: e.target.value,
                                }
                              });
                            }}
                            placeholder="© 2025 Company Name"
                            className="h-8 text-sm"
                          />
                        </div>
                      </>
                    )}

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
                              <Select
                                value={selectedBlock.headerConfig?.logoId || 'drop-dead-main'}
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
                                    <SelectItem key={logo.id} value={logo.id}>{logo.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
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
                        <div className="space-y-2">
                          <Label className="text-xs">Alignment</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map(align => (
                              <Button
                                key={align}
                                variant={selectedBlock.styles.textAlign === align ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateBlockStyles(selectedBlock.id, { textAlign: align })}
                              >
                                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                {align === 'right' && <AlignRight className="w-4 h-4" />}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label className="text-xs">Background</Label>
                            <ColorPicker
                              value={selectedBlock.styles.backgroundColor || 'transparent'}
                              onChange={(v) => updateBlockStyles(selectedBlock.id, { backgroundColor: v })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Text Color</Label>
                            <ColorPicker
                              value={selectedBlock.styles.textColor || '#000000'}
                              onChange={(v) => updateBlockStyles(selectedBlock.id, { textColor: v })}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Canvas */}
            <div className="lg:col-span-2">
              <div className="font-medium text-sm mb-2">Email Canvas</div>
              <ScrollArea className="h-[500px] border rounded-lg bg-muted/50 p-4">
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
                          <h1 style={{ margin: 0, fontSize: block.styles.fontSize }}>{block.content}</h1>
                        )}
                        {block.type === 'text' && (
                          <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{block.content}</p>
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
                          const footerConfig = block.footerConfig || { showLogo: true, logoId: 'drop-dead-main', showSocialIcons: true, copyrightText: '© 2025 Drop Dead Gorgeous. All rights reserved.' };
                          const logo = brandLogos.find(l => l.id === footerConfig.logoId) || brandLogos[0];
                          const enabledLinks = (block.socialLinks || []).filter(l => l.enabled);
                          
                          return (
                            <div className="text-center">
                              {footerConfig.showLogo && (
                                <div className="mb-3">
                                  <img 
                                    src={logo.src} 
                                    alt={logo.name} 
                                    style={{ maxWidth: '120px', height: 'auto', margin: '0 auto', filter: block.styles.textColor === '#f5f0e8' || block.styles.textColor === '#ffffff' ? 'invert(1)' : 'none' }}
                                  />
                                </div>
                              )}
                              {footerConfig.showSocialIcons && enabledLinks.length > 0 && (
                                <div className="flex items-center justify-center gap-3 mb-3">
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
                          const headerConfig = block.headerConfig || { showLogo: true, logoId: 'drop-dead-main', showNavLinks: true };
                          const logo = brandLogos.find(l => l.id === headerConfig.logoId) || brandLogos[0];
                          const enabledLinks = (block.navLinks || []).filter(l => l.enabled);
                          
                          return (
                            <div className="flex items-center justify-between">
                              {headerConfig.showLogo && (
                                <div>
                                  <img 
                                    src={logo.src} 
                                    alt={logo.name} 
                                    style={{ maxWidth: '100px', height: 'auto', filter: block.styles.textColor === '#f5f0e8' || block.styles.textColor === '#ffffff' ? 'invert(1)' : 'none' }}
                                  />
                                </div>
                              )}
                              {headerConfig.showNavLinks && enabledLinks.length > 0 && (
                                <div className="flex items-center gap-3">
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
                              )}
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

// Simple color picker component
function ColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-full justify-start gap-2">
          <div 
            className="w-4 h-4 rounded border" 
            style={{ backgroundColor: value === 'transparent' ? '#fff' : value }}
          />
          <span className="text-xs font-mono truncate">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="grid grid-cols-5 gap-1 mb-2">
          {colorPresets.map(color => (
            <button
              key={color.value}
              className={cn(
                'w-6 h-6 rounded border transition-transform hover:scale-110',
                value === color.value && 'ring-2 ring-primary ring-offset-1'
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => onChange(color.value)}
              title={color.name}
            />
          ))}
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-7 text-xs font-mono"
        />
        <div className="flex gap-1 mt-1">
          <Button variant="ghost" size="sm" className="text-xs h-6 flex-1" onClick={() => onChange('transparent')}>
            Transparent
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
