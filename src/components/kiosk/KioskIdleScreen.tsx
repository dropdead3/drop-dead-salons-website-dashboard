import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useKiosk } from './KioskProvider';
import { DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';
import { KioskSettingsDialog } from './KioskSettingsDialog';

export function KioskIdleScreen() {
  const { settings, businessSettings, startSession } = useKiosk();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTapCount, setSettingsTapCount] = useState(0);
  const settingsTapTimeout = useRef<NodeJS.Timeout | null>(null);

  const welcomeTitle = settings?.welcome_title || DEFAULT_KIOSK_SETTINGS.welcome_title;
  const welcomeSubtitle = settings?.welcome_subtitle;
  const slideshowImages = settings?.idle_slideshow_images || [];
  const backgroundColor = settings?.background_color || DEFAULT_KIOSK_SETTINGS.background_color;
  const textColor = settings?.text_color || DEFAULT_KIOSK_SETTINGS.text_color;
  const accentColor = settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color;
  const backgroundImageUrl = settings?.background_image_url;

  // Theme-aware logo fallback: kiosk logo → business logo (theme-aware) → business name
  const themeMode = settings?.theme_mode || 'dark';
  const isDarkTheme = themeMode === 'dark' || 
    (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const logoUrl = settings?.logo_url 
    || (isDarkTheme ? businessSettings?.logo_light_url : businessSettings?.logo_dark_url)
    || null;
  
  const businessName = businessSettings?.business_name;

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Slideshow rotation
  useEffect(() => {
    if (slideshowImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slideshowImages.length]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle settings icon tap (requires 5 taps within 3 seconds)
  const handleSettingsTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (settingsTapTimeout.current) {
      clearTimeout(settingsTapTimeout.current);
    }
    
    const newCount = settingsTapCount + 1;
    setSettingsTapCount(newCount);
    
    if (newCount >= 5) {
      setShowSettings(true);
      setSettingsTapCount(0);
    } else {
      settingsTapTimeout.current = setTimeout(() => {
        setSettingsTapCount(0);
      }, 3000);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
      style={{
        backgroundColor,
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={startSession}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Settings icon - hidden in corner, requires 5 taps */}
      <motion.button
        className="absolute top-4 right-4 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all"
        style={{ 
          backgroundColor: settingsTapCount > 0 ? `${textColor}15` : `${textColor}08`,
          opacity: settingsTapCount > 0 ? 1 : 0.3,
        }}
        onClick={handleSettingsTap}
        whileTap={{ scale: 0.95 }}
      >
        <Settings 
          className="w-5 h-5" 
          style={{ color: textColor }}
        />
        {settingsTapCount > 0 && (
          <span 
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium"
            style={{ backgroundColor: accentColor, color: '#fff' }}
          >
            {5 - settingsTapCount}
          </span>
        )}
      </motion.button>

      {/* Settings Dialog */}
      <KioskSettingsDialog 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Overlay for background image */}
      {backgroundImageUrl && (
        <div 
          className="absolute inset-0 bg-black/50"
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Ambient gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}15 0%, transparent 60%)`,
        }}
      />

      {/* Slideshow */}
      {slideshowImages.length > 0 && !backgroundImageUrl && (
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={slideshowImages[currentImageIndex]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.3, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            />
          </AnimatePresence>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 -mt-12">
        {/* Logo with floating animation - or business name text fallback */}
        {logoUrl ? (
          <motion.div
            className="mb-12 flex items-center justify-center"
            initial={{ y: -30, opacity: 0 }}
            animate={{ 
              y: [0, -8, 0],
              opacity: 1,
            }}
            transition={{ 
              y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 0.5 },
            }}
          >
            <img
              src={logoUrl}
              alt={businessName || 'Logo'}
              className="max-h-20 md:max-h-28 max-w-[280px] md:max-w-[400px] w-auto h-auto object-contain"
              style={{
                // Add drop shadow for dark logos on dark backgrounds
                filter: isDarkTheme ? 'drop-shadow(0 2px 8px rgba(255,255,255,0.1))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))',
              }}
              onError={(e) => {
                // Hide broken images
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </motion.div>
        ) : businessName ? (
          <motion.h2
            className="text-3xl md:text-4xl font-light tracking-widest uppercase mb-12"
            style={{ color: textColor }}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {businessName}
          </motion.h2>
        ) : null}

        {/* Time - Enhanced typography */}
        <motion.div
          className="mb-16"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="text-5xl md:text-7xl font-extralight tracking-tight"
            style={{ color: textColor }}
          >
            {formatTime(currentTime)}
          </motion.div>
          <motion.div 
            className="text-lg md:text-xl mt-2 font-light tracking-wide"
            style={{ color: `${textColor}90` }}
          >
            {formatDate(currentTime)}
          </motion.div>
        </motion.div>

        {/* Welcome message */}
        <motion.div
          className="mb-20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 
            className="text-3xl md:text-5xl font-medium mb-4 tracking-tight"
            style={{ color: textColor }}
          >
            {welcomeTitle}
          </h1>
          {welcomeSubtitle && (
            <p 
              className="text-xl md:text-2xl font-light"
              style={{ color: `${textColor}80` }}
            >
              {welcomeSubtitle}
            </p>
          )}
        </motion.div>

        {/* Tap to check in - Enhanced with glow */}
        <motion.div
          className="relative"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl blur-xl"
            style={{ backgroundColor: accentColor }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <motion.div
            className="relative px-14 py-7 rounded-3xl backdrop-blur-md"
            style={{ 
              backgroundColor: `${accentColor}20`,
              border: `2px solid ${accentColor}60`,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span 
              className="text-2xl md:text-3xl font-medium"
              style={{ color: textColor }}
            >
              Tap anywhere to check in
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom pulse indicator - Enhanced */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: accentColor }}
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
      </motion.div>
    </motion.div>
  );
}
