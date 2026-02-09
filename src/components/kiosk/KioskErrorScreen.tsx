import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';
import { useKiosk } from './KioskProvider';
import { DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';

export function KioskErrorScreen() {
  const { settings, error, resetToIdle } = useKiosk();

  const backgroundColor = settings?.background_color || DEFAULT_KIOSK_SETTINGS.background_color;
  const textColor = settings?.text_color || DEFAULT_KIOSK_SETTINGS.text_color;
  const accentColor = settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color;
  const backgroundImageUrl = settings?.background_image_url;
  const logoUrl = settings?.logo_url;

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center select-none"
      style={{
        backgroundColor,
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Overlay */}
      {backgroundImageUrl && (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Logo */}
        {logoUrl && (
          <motion.img
            src={logoUrl}
            alt="Logo"
            className="h-16 mb-8 object-contain"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          />
        )}

        {/* Error icon */}
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
          style={{ backgroundColor: '#EF444420' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <AlertTriangle className="w-14 h-14 text-red-500" />
        </motion.div>

        {/* Error message */}
        <motion.h1
          className="text-3xl md:text-4xl font-semibold mb-4"
          style={{ color: textColor }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Something Went Wrong
        </motion.h1>

        <motion.p
          className="text-xl opacity-80 mb-8 max-w-md"
          style={{ color: textColor }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {error || 'We encountered an issue. Please try again or ask for assistance.'}
        </motion.p>

        {/* Actions */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-xl font-semibold"
            style={{ 
              backgroundColor: accentColor,
              color: '#FFFFFF',
            }}
            onClick={resetToIdle}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-6 h-6" />
            Try Again
          </motion.button>

          <div 
            className="flex items-center justify-center gap-2 text-lg"
            style={{ color: `${textColor}80` }}
          >
            <HelpCircle className="w-5 h-5" />
            <span>Or ask the front desk for help</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
