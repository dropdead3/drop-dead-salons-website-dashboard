import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { isColorDark } from '@/lib/colorUtils';

interface BusinessSettings {
  logo_light_url?: string | null;
  logo_dark_url?: string | null;
  business_name?: string | null;
}

interface KioskPreviewSettings {
  background_color: string;
  accent_color: string;
  text_color: string;
  welcome_title: string;
  display_orientation: 'portrait' | 'landscape';
  welcome_subtitle: string | null;
  button_style: 'rounded' | 'pill' | 'square';
  logo_url: string | null;
  logo_color: string | null;
  theme_mode: 'dark' | 'light' | 'auto';
  logo_size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface KioskPreviewPanelProps {
  settings: KioskPreviewSettings;
  businessSettings?: BusinessSettings | null;
  className?: string;
}

export function KioskPreviewPanel({ settings, businessSettings, className }: KioskPreviewPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Determine if we're in dark mode based on theme_mode and background color
  const isDarkMode = settings.theme_mode === 'dark' || 
    (settings.theme_mode === 'auto' && isColorDark(settings.background_color)) ||
    (settings.theme_mode === 'light' ? false : isColorDark(settings.background_color));
  
  // Logo selection logic (same as KioskIdleScreen)
  const logoUrl = settings.logo_url 
    || (isDarkMode ? businessSettings?.logo_light_url : businessSettings?.logo_dark_url)
    || null;
  
  const businessName = businessSettings?.business_name;

  const buttonRadiusClass = {
    rounded: 'rounded-xl',
    pill: 'rounded-full',
    square: 'rounded-md',
  }[settings.button_style];

  // Logo size classes for preview (scaled down from actual)
  const logoSizeClass = {
    xs: 'h-5 max-w-[80px]',
    sm: 'h-6 max-w-[100px]',
    md: 'h-8 max-w-[120px]',
    lg: 'h-10 max-w-[140px]',
    xl: 'h-12 max-w-[160px]',
  }[settings.logo_size];

  return (
    <Card className={cn("sticky top-6", className)}>
      <CardHeader>
        <CardTitle className="font-display text-lg">LIVE PREVIEW</CardTitle>
        <CardDescription>See how your kiosk will appear on devices</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tablet frame mockup */}
        <div className={cn(
          "relative mx-auto",
          settings.display_orientation === 'landscape' ? "max-w-[360px]" : "max-w-[280px]"
        )}>
          {/* Device frame */}
          <div className="rounded-[2rem] border-[8px] border-slate-800 bg-slate-800 p-1 shadow-xl">
            {/* Screen - matching actual kiosk structure */}
            <div 
              className={cn(
                "rounded-[1.5rem] overflow-hidden relative",
                settings.display_orientation === 'landscape' ? "aspect-[4/3]" : "aspect-[3/4]"
              )}
              style={{ backgroundColor: settings.background_color }}
            >
              {/* Ambient gradient overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, ${settings.accent_color}15 0%, transparent 60%)`,
                }}
              />
              
              {/* Content - centered like actual kiosk */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center -mt-4">
                {/* Logo with float animation or business name fallback */}
                {logoUrl ? (
                  <div className="relative mb-4">
                    <motion.img 
                      src={logoUrl} 
                      alt={businessName || 'Logo'} 
                      className={`${logoSizeClass} w-auto object-contain`}
                      style={{
                        filter: isDarkMode 
                          ? 'drop-shadow(0 1px 4px rgba(255,255,255,0.1))' 
                          : 'drop-shadow(0 1px 4px rgba(0,0,0,0.1))',
                      }}
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      onError={(e) => { 
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {/* Color overlay for logo */}
                    {settings.logo_color && (
                      <motion.div 
                        className="absolute inset-0 mix-blend-multiply pointer-events-none"
                        style={{ 
                          backgroundColor: settings.logo_color,
                          maskImage: `url(${logoUrl})`,
                          WebkitMaskImage: `url(${logoUrl})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                        }}
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </div>
                ) : businessName ? (
                  <motion.p
                    className="text-xs font-light tracking-widest uppercase mb-4"
                    style={{ color: settings.text_color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                  >
                    {businessName}
                  </motion.p>
                ) : null}
                
                {/* Time display */}
                <motion.div 
                  className="text-2xl font-extralight tracking-tight mb-1"
                  style={{ color: settings.text_color }}
                >
                  {formatTime(currentTime)}
                </motion.div>
                <motion.div 
                  className="text-[10px] font-light tracking-wide mb-6"
                  style={{ color: `${settings.text_color}90` }}
                >
                  {formatDate(currentTime)}
                </motion.div>
                
                {/* Welcome text */}
                <h1 
                  style={{ color: settings.text_color }} 
                  className="text-base font-medium mb-1 tracking-tight"
                >
                  {settings.welcome_title || 'Welcome'}
                </h1>
                
                {settings.welcome_subtitle && (
                  <p 
                    style={{ color: settings.text_color }} 
                    className="text-[10px] opacity-70 mb-6 font-light"
                  >
                    {settings.welcome_subtitle}
                  </p>
                )}
                
                {/* Tap to check in - with glow */}
                <div className="relative mt-2">
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full blur-md"
                    style={{ backgroundColor: settings.accent_color }}
                    animate={{
                      opacity: [0.2, 0.4, 0.2],
                      scale: [1, 1.03, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  
                  <div 
                    className={cn("relative px-4 py-2 backdrop-blur-sm", buttonRadiusClass)}
                    style={{ 
                      backgroundColor: `${settings.accent_color}20`,
                      border: `1px solid ${settings.accent_color}60`,
                    }}
                  >
                    <span 
                      className="text-[10px] font-medium" 
                      style={{ color: settings.text_color }}
                    >
                      Tap to check in
                    </span>
                  </div>
                </div>
                
                {/* Bottom pulse indicators */}
                <div className="absolute bottom-4 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: settings.accent_color }}
                      animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Mode indicator */}
        <div className="mt-8 text-center">
          <span className="text-xs text-muted-foreground">
            Mode: <span className="font-medium capitalize">{settings.theme_mode}</span>
            {settings.theme_mode === 'auto' && (
              <span className="ml-1 opacity-70">
                (currently {isDarkMode ? 'dark' : 'light'})
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
