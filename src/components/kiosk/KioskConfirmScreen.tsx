import { motion } from 'framer-motion';
import { ArrowLeft, Clock, User, AlertCircle } from 'lucide-react';
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

  // Parse client name into first name
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
          <span className="text-lg">Start Over</span>
        </motion.button>

        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
        )}

        {idleTimeRemaining > 0 && idleTimeRemaining < 30 && (
          <div 
            className="px-4 py-2 rounded-lg text-sm"
            style={{ 
              backgroundColor: `${accentColor}30`,
              color: accentColor,
            }}
          >
            {idleTimeRemaining}s
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8 overflow-auto">
        {appointments.length > 0 ? (
          <>
            {/* Welcome message */}
            {client && (
              <motion.div
                className="text-center mb-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <h1 
                  className="text-3xl md:text-4xl font-semibold mb-2"
                  style={{ color: textColor }}
                >
                  Welcome, {clientFirstName}!
                </h1>
                <p 
                  className="text-xl opacity-80"
                  style={{ color: textColor }}
                >
                  {appointments.length === 1 
                    ? 'Tap to confirm your appointment'
                    : 'Select your appointment to check in'}
                </p>
              </motion.div>
            )}

            {/* Appointments list */}
            <div className="w-full max-w-2xl space-y-4">
              {appointments.map((appointment, index) => (
                <motion.button
                  key={appointment.id}
                  className="w-full p-6 rounded-2xl text-left"
                  style={{
                    backgroundColor: `${textColor}10`,
                    borderColor: `${textColor}20`,
                    borderWidth: 2,
                  }}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectAppointment(appointment)}
                >
                  <div className="flex items-center gap-6">
                    {/* Stylist photo */}
                    {showStylistPhoto && (
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{ backgroundColor: `${accentColor}30` }}
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
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1">
                      <div 
                        className="text-2xl font-semibold mb-2"
                        style={{ color: textColor }}
                      >
                        {appointment.service_name || 'Appointment'}
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap">
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
                            <span className="text-lg">with {appointment.stylist_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Check-in button indicator */}
                    <div 
                      className="px-6 py-3 rounded-xl font-semibold"
                      style={{ 
                        backgroundColor: accentColor,
                        color: '#FFFFFF',
                      }}
                    >
                      Check In
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          /* No appointments found */
          <motion.div
            className="text-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <AlertCircle 
              className="w-20 h-20 mx-auto mb-6"
              style={{ color: accentColor }}
            />
            <h1 
              className="text-3xl md:text-4xl font-semibold mb-4"
              style={{ color: textColor }}
            >
              No Appointment Found
            </h1>
            <p 
              className="text-xl opacity-80 mb-8 max-w-md"
              style={{ color: textColor }}
            >
              We couldn't find an appointment for today with that phone number.
            </p>

            <div className="flex flex-col gap-4 items-center">
              {enableWalkIns && (
                <motion.button
                  className="px-8 py-4 rounded-xl text-xl font-semibold"
                  style={{ 
                    backgroundColor: accentColor,
                    color: '#FFFFFF',
                  }}
                  onClick={startWalkIn}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue as Walk-In
                </motion.button>
              )}

              <motion.button
                className="px-8 py-4 rounded-xl text-xl"
                style={{ 
                  backgroundColor: `${textColor}10`,
                  color: textColor,
                }}
                onClick={resetToIdle}
                whileTap={{ scale: 0.98 }}
              >
                Try Different Number
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
