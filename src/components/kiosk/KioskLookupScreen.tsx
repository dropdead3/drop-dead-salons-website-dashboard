import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Phone } from 'lucide-react';
import { useKiosk } from './KioskProvider';
import { KioskNumberPad } from './KioskNumberPad';
import { DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';

export function KioskLookupScreen() {
  const { settings, resetToIdle, lookupByPhone, isLookingUp, idleTimeRemaining } = useKiosk();
  const [phoneNumber, setPhoneNumber] = useState('');

  const checkInPrompt = settings?.check_in_prompt || DEFAULT_KIOSK_SETTINGS.check_in_prompt;
  const backgroundColor = settings?.background_color || DEFAULT_KIOSK_SETTINGS.background_color;
  const textColor = settings?.text_color || DEFAULT_KIOSK_SETTINGS.text_color;
  const accentColor = settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color;
  const backgroundImageUrl = settings?.background_image_url;
  const logoUrl = settings?.logo_url;

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
      {/* Overlay */}
      {backgroundImageUrl && (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <motion.button
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ 
            backgroundColor: `${textColor}10`,
            color: textColor,
          }}
          onClick={resetToIdle}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-lg">Cancel</span>
        </motion.button>

        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
        )}

        {/* Idle timer */}
        {idleTimeRemaining > 0 && idleTimeRemaining < 30 && (
          <div 
            className="px-4 py-2 rounded-lg text-sm"
            style={{ 
              backgroundColor: `${accentColor}30`,
              color: accentColor,
            }}
          >
            Session expires in {idleTimeRemaining}s
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8">
        {/* Prompt */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div 
            className="flex items-center justify-center gap-3 mb-4"
            style={{ color: accentColor }}
          >
            <Phone className="w-8 h-8" />
          </div>
          <h1 
            className="text-2xl md:text-3xl font-medium"
            style={{ color: textColor }}
          >
            {checkInPrompt}
          </h1>
        </motion.div>

        {/* Phone display */}
        <motion.div
          className="mb-8 px-8 py-4 rounded-2xl min-w-[300px] text-center"
          style={{ 
            backgroundColor: `${textColor}05`,
            borderColor: phoneNumber ? accentColor : `${textColor}20`,
            borderWidth: 2,
          }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span 
            className="text-4xl md:text-5xl font-light tracking-wider"
            style={{ color: phoneNumber ? textColor : `${textColor}40` }}
          >
            {phoneNumber ? formatPhoneDisplay(phoneNumber) : '(___) ___-____'}
          </span>
        </motion.div>

        {/* Number pad or loading */}
        {isLookingUp ? (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 
              className="w-16 h-16 animate-spin"
              style={{ color: accentColor }}
            />
            <span 
              className="text-xl"
              style={{ color: textColor }}
            >
              Looking up your appointment...
            </span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
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
