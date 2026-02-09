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

  const errorColor = '#EF4444';

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

      {/* Error ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${errorColor}15 0%, transparent 50%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg">
        {/* Logo */}
        {logoUrl && (
          <motion.img
            src={logoUrl}
            alt="Logo"
            className="h-16 mb-10 object-contain"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          />
        )}

        {/* Error icon - Enhanced with pulsing rings */}
        <motion.div
          className="relative w-28 h-28 mb-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${errorColor}` }}
            animate={{
              scale: [1, 1.3],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          
          {/* Icon container */}
          <div 
            className="absolute inset-0 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ 
              backgroundColor: `${errorColor}15`,
              border: `2px solid ${errorColor}30`,
            }}
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <AlertTriangle className="w-14 h-14" style={{ color: errorColor }} />
            </motion.div>
          </div>
        </motion.div>

        {/* Error message */}
        <motion.h1
          className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight"
          style={{ color: textColor }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Something Went Wrong
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl mb-10 font-light leading-relaxed"
          style={{ color: `${textColor}90` }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {error || 'We encountered an issue. Please try again or ask for assistance.'}
        </motion.p>

        {/* Actions */}
        <motion.div
          className="flex flex-col gap-4 w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-xl font-semibold shadow-xl transition-all"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
              color: '#FFFFFF',
              boxShadow: `0 8px 32px ${accentColor}40`,
            }}
            onClick={resetToIdle}
            whileHover={{ 
              scale: 1.02, 
              y: -2,
              boxShadow: `0 12px 40px ${accentColor}50`,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-6 h-6" />
            </motion.div>
            Try Again
          </motion.button>

          <motion.div 
            className="flex items-center justify-center gap-3 py-4 rounded-2xl backdrop-blur-md"
            style={{ 
              backgroundColor: `${textColor}05`,
              border: `1px solid ${textColor}10`,
              color: `${textColor}70`,
            }}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-lg">Or ask the front desk for help</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
