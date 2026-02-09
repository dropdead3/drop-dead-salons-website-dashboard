import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKiosk } from './KioskProvider';
import { DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';

export function KioskIdleScreen() {
  const { settings, startSession } = useKiosk();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const welcomeTitle = settings?.welcome_title || DEFAULT_KIOSK_SETTINGS.welcome_title;
  const welcomeSubtitle = settings?.welcome_subtitle;
  const slideshowImages = settings?.idle_slideshow_images || [];
  const logoUrl = settings?.logo_url;
  const backgroundColor = settings?.background_color || DEFAULT_KIOSK_SETTINGS.background_color;
  const textColor = settings?.text_color || DEFAULT_KIOSK_SETTINGS.text_color;
  const accentColor = settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color;
  const backgroundImageUrl = settings?.background_image_url;

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

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
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
      {/* Overlay for background image */}
      {backgroundImageUrl && (
        <div 
          className="absolute inset-0 bg-black/50"
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Slideshow */}
      {slideshowImages.length > 0 && !backgroundImageUrl && (
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={slideshowImages[currentImageIndex]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
          </AnimatePresence>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Logo */}
        {logoUrl && (
          <motion.img
            src={logoUrl}
            alt="Logo"
            className="h-24 md:h-32 mb-8 object-contain"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
        )}

        {/* Time */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div 
            className="text-7xl md:text-8xl font-light tracking-tight"
            style={{ color: textColor }}
          >
            {formatTime(currentTime)}
          </div>
          <div 
            className="text-xl md:text-2xl mt-2 opacity-80"
            style={{ color: textColor }}
          >
            {formatDate(currentTime)}
          </div>
        </motion.div>

        {/* Welcome message */}
        <motion.div
          className="mb-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1 
            className="text-4xl md:text-5xl font-semibold mb-4"
            style={{ color: textColor }}
          >
            {welcomeTitle}
          </h1>
          {welcomeSubtitle && (
            <p 
              className="text-xl md:text-2xl opacity-80"
              style={{ color: textColor }}
            >
              {welcomeSubtitle}
            </p>
          )}
        </motion.div>

        {/* Tap to check in */}
        <motion.div
          className="px-12 py-6 rounded-2xl"
          style={{ 
            backgroundColor: `${accentColor}20`,
            borderColor: accentColor,
            borderWidth: 2,
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
        >
          <span 
            className="text-2xl md:text-3xl font-medium"
            style={{ color: textColor }}
          >
            Tap anywhere to check in
          </span>
        </motion.div>
      </div>

      {/* Subtle pulse animation indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </motion.div>
    </motion.div>
  );
}
