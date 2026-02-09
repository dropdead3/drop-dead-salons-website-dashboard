import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, User } from 'lucide-react';
import { useKiosk } from './KioskProvider';
import { DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';
import { format, parse } from 'date-fns';

export function KioskSuccessScreen() {
  const { settings, session, completeCheckin, isCheckingIn } = useKiosk();
  const [hasCompleted, setHasCompleted] = useState(false);

  const successMessage = settings?.success_message || DEFAULT_KIOSK_SETTINGS.success_message;
  const backgroundColor = settings?.background_color || DEFAULT_KIOSK_SETTINGS.background_color;
  const textColor = settings?.text_color || DEFAULT_KIOSK_SETTINGS.text_color;
  const accentColor = settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color;
  const backgroundImageUrl = settings?.background_image_url;
  const logoUrl = settings?.logo_url;
  const showWaitTime = settings?.show_wait_time_estimate ?? DEFAULT_KIOSK_SETTINGS.show_wait_time_estimate;

  const appointment = session?.selectedAppointment;
  const client = session?.client;
  const clientFirstName = client?.name?.split(' ')[0] || '';

  // Complete check-in on mount
  useEffect(() => {
    if (!hasCompleted && !isCheckingIn) {
      setHasCompleted(true);
      completeCheckin();
    }
  }, [hasCompleted, isCheckingIn, completeCheckin]);

  const formatTime = (timeStr: string) => {
    try {
      const parsed = parse(timeStr, 'HH:mm:ss', new Date());
      return format(parsed, 'h:mm a');
    } catch {
      return timeStr;
    }
  };

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

        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
        >
          <motion.div
            className="w-32 h-32 rounded-full flex items-center justify-center mb-8"
            style={{ backgroundColor: `${accentColor}20` }}
            animate={{
              boxShadow: [
                `0 0 0 0 ${accentColor}40`,
                `0 0 0 30px ${accentColor}00`,
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: 2,
              ease: 'easeOut',
            }}
          >
            <CheckCircle2 
              className="w-20 h-20"
              style={{ color: accentColor }}
            />
          </motion.div>
        </motion.div>

        {/* Welcome message */}
        <motion.h1
          className="text-4xl md:text-5xl font-semibold mb-4"
          style={{ color: textColor }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {clientFirstName ? `Thanks, ${clientFirstName}!` : 'Check-In Complete!'}
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl opacity-80 mb-8 max-w-lg"
          style={{ color: textColor }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {successMessage}
        </motion.p>

        {/* Appointment details */}
        {appointment && (
          <motion.div
            className="p-6 rounded-2xl max-w-md w-full"
            style={{ 
              backgroundColor: `${textColor}10`,
              borderColor: `${textColor}20`,
              borderWidth: 1,
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="space-y-3">
              <div 
                className="text-2xl font-semibold"
                style={{ color: textColor }}
              >
                {appointment.service_name}
              </div>
              
              <div className="flex items-center justify-center gap-6">
                <div 
                  className="flex items-center gap-2"
                  style={{ color: `${textColor}B0` }}
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-lg">{formatTime(appointment.start_time)}</span>
                </div>
                
                {appointment.stylist_name && (
                  <div 
                    className="flex items-center gap-2"
                    style={{ color: `${textColor}B0` }}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-lg">{appointment.stylist_name}</span>
                  </div>
                )}
              </div>

              {showWaitTime && (
                <div 
                  className="text-lg mt-4 pt-4"
                  style={{ 
                    color: accentColor,
                    borderTopColor: `${textColor}20`,
                    borderTopWidth: 1,
                  }}
                >
                  Please have a seat. Your stylist will be with you shortly.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Auto-return indicator */}
        <motion.p
          className="mt-8 text-sm opacity-60"
          style={{ color: textColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1 }}
        >
          This screen will reset automatically
        </motion.p>
      </div>
    </motion.div>
  );
}
