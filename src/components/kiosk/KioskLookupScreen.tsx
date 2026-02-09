import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Phone, Settings } from 'lucide-react';
import { useKiosk } from './KioskProvider';
import { KioskNumberPad } from './KioskNumberPad';
import { DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';
import { KioskSettingsDialog } from './KioskSettingsDialog';

export function KioskLookupScreen() {
  const { settings, resetToIdle, lookupByPhone, isLookingUp, idleTimeRemaining } = useKiosk();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTapCount, setSettingsTapCount] = useState(0);
  const settingsTapTimeout = useRef<NodeJS.Timeout | null>(null);

  const checkInPrompt = settings?.check_in_prompt || DEFAULT_KIOSK_SETTINGS.check_in_prompt;
  const backgroundColor = settings?.background_color || DEFAULT_KIOSK_SETTINGS.background_color;
  const textColor = settings?.text_color || DEFAULT_KIOSK_SETTINGS.text_color;
  const accentColor = settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color;
  const backgroundImageUrl = settings?.background_image_url;
  const logoUrl = settings?.logo_url;

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

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleSubmit = () => {
    if (phoneNumber.length >= 4) {
      lookupByPhone(phoneNumber);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col select-none"
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
      {/* Settings icon - hidden in corner */}
      <motion.button
        className="absolute top-4 right-4 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all"
        style={{ 
          backgroundColor: settingsTapCount > 0 ? `${textColor}15` : `${textColor}08`,
          opacity: settingsTapCount > 0 ? 1 : 0.3,
        }}
        onClick={handleSettingsTap}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className="w-5 h-5" style={{ color: textColor }} />
        {settingsTapCount > 0 && (
          <span 
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium"
            style={{ backgroundColor: accentColor, color: '#fff' }}
          >
            {5 - settingsTapCount}
          </span>
        )}
      </motion.button>

      <KioskSettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Overlay */}
      {backgroundImageUrl && (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Ambient glow */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}30 0%, transparent 60%)`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <motion.button
          className="flex items-center gap-2 px-5 py-3 rounded-2xl backdrop-blur-md transition-all"
          style={{ 
            backgroundColor: `${textColor}08`,
            border: `1px solid ${textColor}15`,
            color: textColor,
          }}
          onClick={resetToIdle}
          whileHover={{ backgroundColor: `${textColor}15` }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-lg font-medium">Cancel</span>
        </motion.button>

        {logoUrl && (
          <motion.img 
            src={logoUrl} 
            alt="Logo" 
            className="h-12 object-contain"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          />
        )}

        {/* Idle timer */}
        {idleTimeRemaining > 0 && idleTimeRemaining < 30 && (
          <motion.div 
            className="px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-md"
            style={{ 
              backgroundColor: `${accentColor}20`,
              border: `1px solid ${accentColor}30`,
              color: accentColor,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {idleTimeRemaining}s
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8">
        {/* Prompt with animated icon */}
        <motion.div
          className="text-center mb-10"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <motion.div 
            className="relative w-20 h-20 mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          >
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-50"
              style={{ backgroundColor: accentColor }}
            />
            {/* Icon container */}
            <div 
              className="relative w-full h-full rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: `${accentColor}20`,
                border: `2px solid ${accentColor}40`,
              }}
            >
              <Phone className="w-10 h-10" style={{ color: accentColor }} />
            </div>
          </motion.div>
          
          <h1 
            className="text-3xl md:text-4xl font-medium tracking-tight"
            style={{ color: textColor }}
          >
            {checkInPrompt}
          </h1>
        </motion.div>

        {/* Phone display - Enhanced */}
        <motion.div
          className="mb-10 px-10 py-6 rounded-3xl min-w-[340px] text-center backdrop-blur-md"
          style={{ 
            backgroundColor: `${textColor}05`,
            border: `2px solid ${phoneNumber ? accentColor : `${textColor}15`}`,
            boxShadow: phoneNumber ? `0 0 40px ${accentColor}20` : 'none',
            transition: 'all 0.3s ease',
          }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <span 
            className="text-4xl md:text-5xl font-light tracking-widest"
            style={{ color: phoneNumber ? textColor : `${textColor}40` }}
          >
            {phoneNumber ? formatPhoneDisplay(phoneNumber) : '(___) ___-____'}
          </span>
        </motion.div>

        {/* Number pad or loading */}
        {isLookingUp ? (
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="relative w-24 h-24"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              {/* Spinner glow */}
              <div 
                className="absolute inset-0 rounded-full blur-xl opacity-40"
                style={{ backgroundColor: accentColor }}
              />
              <Loader2 
                className="w-24 h-24"
                style={{ color: accentColor }}
              />
            </motion.div>
            <span 
              className="text-xl font-medium"
              style={{ color: textColor }}
            >
              Looking up your appointment...
            </span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 20 }}
          >
            <KioskNumberPad
              value={phoneNumber}
              onChange={setPhoneNumber}
              onSubmit={handleSubmit}
              accentColor={accentColor}
              textColor={textColor}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
