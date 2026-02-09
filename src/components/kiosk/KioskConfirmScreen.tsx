import { motion } from 'framer-motion';
import { ArrowLeft, Clock, User, AlertCircle, Sparkles } from 'lucide-react';
import { useKiosk } from './KioskProvider';
import { DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';
import { format, parse } from 'date-fns';

export function KioskConfirmScreen() {
  const { 
    settings, 
    session, 
    resetToIdle, 
    selectAppointment,
    startWalkIn,
    idleTimeRemaining,
  } = useKiosk();

  const backgroundColor = settings?.background_color || DEFAULT_KIOSK_SETTINGS.background_color;
  const textColor = settings?.text_color || DEFAULT_KIOSK_SETTINGS.text_color;
  const accentColor = settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color;
  const backgroundImageUrl = settings?.background_image_url;
  const logoUrl = settings?.logo_url;
  const showStylistPhoto = settings?.show_stylist_photo ?? DEFAULT_KIOSK_SETTINGS.show_stylist_photo;
  const enableWalkIns = settings?.enable_walk_ins ?? DEFAULT_KIOSK_SETTINGS.enable_walk_ins;

  const appointments = session?.appointments || [];
  const client = session?.client;

  const clientFirstName = client?.name?.split(' ')[0] || '';

  const formatTime = (timeStr: string) => {
    try {
      const parsed = parse(timeStr, 'HH:mm:ss', new Date());
      return format(parsed, 'h:mm a');
    } catch {
      return timeStr;
    }
  };

  const handleSelectAppointment = (appointment: any) => {
    selectAppointment(appointment);
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

      {/* Ambient glow effect */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center top, ${accentColor}20 0%, transparent 50%)`,
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
          <span className="text-lg font-medium">Start Over</span>
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
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8 overflow-auto">
        {appointments.length > 0 ? (
          <>
            {/* Welcome message */}
            {client && (
              <motion.div
                className="text-center mb-10"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <motion.h1 
                  className="text-4xl md:text-5xl font-semibold mb-3 tracking-tight"
                  style={{ color: textColor }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Welcome, {clientFirstName}!
                </motion.h1>
                <motion.p 
                  className="text-xl md:text-2xl opacity-70"
                  style={{ color: textColor }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.2 }}
                >
                  {appointments.length === 1 
                    ? 'Tap to confirm your appointment'
                    : 'Select your appointment to check in'}
                </motion.p>
              </motion.div>
            )}

            {/* Appointments list */}
            <div className="w-full max-w-2xl space-y-4">
              {appointments.map((appointment, index) => (
                <motion.button
                  key={appointment.id}
                  className="w-full p-6 rounded-3xl text-left backdrop-blur-md transition-all"
                  style={{
                    backgroundColor: `${textColor}08`,
                    border: `2px solid ${textColor}15`,
                    boxShadow: `0 8px 32px ${backgroundColor}40`,
                  }}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                  whileHover={{ 
                    scale: 1.01,
                    borderColor: `${accentColor}50`,
                    boxShadow: `0 12px 40px ${accentColor}20`,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectAppointment(appointment)}
                >
                  <div className="flex items-center gap-6">
                    {/* Stylist photo */}
                    {showStylistPhoto && (
                      <div 
                        className="relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{ 
                          backgroundColor: `${accentColor}20`,
                          border: `2px solid ${accentColor}30`,
                        }}
                      >
                        {appointment.stylist_photo ? (
                          <img 
                            src={appointment.stylist_photo} 
                            alt={appointment.stylist_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10" style={{ color: accentColor }} />
                        )}
                        {/* Status ring */}
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{ 
                            border: `2px solid ${accentColor}40`,
                            animation: 'pulse 2s ease-in-out infinite',
                          }}
                        />
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-2xl font-semibold mb-2 truncate"
                        style={{ color: textColor }}
                      >
                        {appointment.service_name || 'Appointment'}
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        <div 
                          className="flex items-center gap-2"
                          style={{ color: `${textColor}90` }}
                        >
                          <Clock className="w-5 h-5" />
                          <span className="text-lg font-medium">{formatTime(appointment.start_time)}</span>
                        </div>
                        
                        {appointment.stylist_name && (
                          <div 
                            className="flex items-center gap-2"
                            style={{ color: `${textColor}90` }}
                          >
                            <User className="w-5 h-5" />
                            <span className="text-lg">with {appointment.stylist_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Check-in button */}
                    <motion.div 
                      className="px-6 py-4 rounded-2xl font-semibold text-lg shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                        color: '#FFFFFF',
                        boxShadow: `0 8px 24px ${accentColor}40`,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Check In
                    </motion.div>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          /* No appointments found - Enhanced UI */
          <motion.div
            className="text-center max-w-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Animated icon with pulsing rings */}
            <motion.div
              className="relative mb-10 mx-auto w-32 h-32"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            >
              {/* Outer pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${accentColor}` }}
                animate={{
                  scale: [1, 1.3, 1.3],
                  opacity: [0.6, 0, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
              {/* Inner pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${accentColor}` }}
                animate={{
                  scale: [1, 1.2, 1.2],
                  opacity: [0.4, 0, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 0.3,
                }}
              />
              {/* Icon container */}
              <div 
                className="absolute inset-0 rounded-full flex items-center justify-center backdrop-blur-sm"
                style={{ 
                  backgroundColor: `${accentColor}15`,
                  border: `2px solid ${accentColor}30`,
                }}
              >
                <AlertCircle 
                  className="w-16 h-16"
                  style={{ color: accentColor }}
                />
              </div>
            </motion.div>

            {/* Message */}
            <motion.h1 
              className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight"
              style={{ color: textColor }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              No Appointment Found
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl mb-10 leading-relaxed"
              style={{ color: `${textColor}90` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              We couldn't find an appointment for today with that phone number.
            </motion.p>

            {/* Action buttons */}
            <motion.div 
              className="flex flex-col gap-4 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {enableWalkIns && (
                <motion.button
                  className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-xl font-semibold min-w-[280px] shadow-xl transition-shadow"
                  style={{ 
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                    color: '#FFFFFF',
                    boxShadow: `0 8px 32px ${accentColor}40`,
                  }}
                  onClick={startWalkIn}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -2,
                    boxShadow: `0 12px 40px ${accentColor}50`,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="w-6 h-6" />
                  Continue as Walk-In
                </motion.button>
              )}

              <motion.button
                className="px-10 py-5 rounded-2xl text-xl font-medium min-w-[280px] backdrop-blur-md transition-all"
                style={{ 
                  backgroundColor: `${textColor}08`,
                  border: `1px solid ${textColor}15`,
                  color: textColor,
                }}
                onClick={resetToIdle}
                whileHover={{ 
                  backgroundColor: `${textColor}15`,
                  scale: 1.02,
                }}
                whileTap={{ scale: 0.98 }}
              >
                Try Different Number
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
