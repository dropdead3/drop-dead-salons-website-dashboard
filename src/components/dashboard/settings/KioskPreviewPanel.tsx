import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KioskPreviewSettings {
  background_color: string;
  accent_color: string;
  text_color: string;
  welcome_title: string;
  welcome_subtitle: string | null;
  button_style: 'rounded' | 'pill' | 'square';
  logo_url: string | null;
}

interface KioskPreviewPanelProps {
  settings: KioskPreviewSettings;
  className?: string;
}

export function KioskPreviewPanel({ settings, className }: KioskPreviewPanelProps) {
  const buttonRadiusClass = {
    rounded: 'rounded-xl',
    pill: 'rounded-full',
    square: 'rounded-md',
  }[settings.button_style];

  return (
    <Card className={cn("sticky top-6", className)}>
      <CardHeader>
        <CardTitle className="font-display text-lg">LIVE PREVIEW</CardTitle>
        <CardDescription>See how your kiosk will appear on devices</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tablet frame mockup */}
        <div className="relative mx-auto max-w-[280px]">
          {/* Device frame */}
          <div className="rounded-[2rem] border-[8px] border-slate-800 bg-slate-800 p-1 shadow-xl">
            {/* Screen */}
            <div 
              className="aspect-[3/4] rounded-[1.5rem] overflow-hidden flex flex-col items-center justify-center p-6 text-center"
              style={{ backgroundColor: settings.background_color }}
            >
              {/* Logo */}
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="h-12 w-auto mb-6 object-contain"
                />
              )}

              {/* Welcome text */}
              <h1 
                style={{ color: settings.text_color }} 
                className="text-xl font-medium mb-2"
              >
                {settings.welcome_title || 'Welcome'}
              </h1>
              
              {settings.welcome_subtitle && (
                <p 
                  style={{ color: settings.text_color }} 
                  className="text-sm opacity-70 mb-8"
                >
                  {settings.welcome_subtitle}
                </p>
              )}

              {/* Check-in button */}
              <button 
                className={cn(
                  "px-8 py-3 text-sm font-medium text-white transition-transform hover:scale-105",
                  buttonRadiusClass
                )}
                style={{ backgroundColor: settings.accent_color }}
              >
                Check In
              </button>

              {/* Simulated phone input hint */}
              <div 
                className="mt-8 w-full max-w-[200px] border-b-2 pb-2 text-sm opacity-40"
                style={{ borderColor: settings.text_color, color: settings.text_color }}
              >
                Enter phone number
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-600 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
