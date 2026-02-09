import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useKioskSettingsByLocation, KioskSettings, DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';
import { useKioskCheckin, KioskState, KioskSession } from '@/hooks/useKioskCheckin';
import { useBusinessSettings, BusinessSettings } from '@/hooks/useBusinessSettings';

interface KioskContextType {
  // Settings
  settings: KioskSettings | null;
  isLoadingSettings: boolean;
  organizationId: string | null;
  locationId: string;
  
  // Business settings for logo fallback
  businessSettings: BusinessSettings | null;
  
  // State machine
  state: KioskState;
  session: KioskSession | null;
  error: string | null;
  
  // Actions
  startSession: () => void;
  resetToIdle: () => void;
  lookupByPhone: (phone: string) => void;
  isLookingUp: boolean;
  selectAppointment: (appointment: any) => void;
  completeCheckin: () => void;
  isCheckingIn: boolean;
  startWalkIn: () => void;
  
  // Idle timer
  idleTimeRemaining: number;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

interface KioskProviderProps {
  children: ReactNode;
  locationId: string;
}

export function KioskProvider({ children, locationId }: KioskProviderProps) {
  const { data: settingsData, isLoading: isLoadingSettings } = useKioskSettingsByLocation(locationId);
  const { data: businessSettings } = useBusinessSettings();
  const organizationId = settingsData?.organizationId || null;
  
  const checkin = useKioskCheckin(locationId, organizationId || '');
  
  const [idleTimeRemaining, setIdleTimeRemaining] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const settings = settingsData?.settings || null;
  const idleTimeout = settings?.idle_timeout_seconds || DEFAULT_KIOSK_SETTINGS.idle_timeout_seconds;

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  // Idle timer
  useEffect(() => {
    if (checkin.state === 'idle') {
      setIdleTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivity) / 1000);
      const remaining = Math.max(0, idleTimeout - elapsed);
      setIdleTimeRemaining(remaining);

      if (remaining === 0 && checkin.state !== 'idle') {
        checkin.resetToIdle();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, idleTimeout, checkin.state, checkin.resetToIdle]);

  // Auto-return to idle after success
  useEffect(() => {
    if (checkin.state === 'success') {
      const timer = setTimeout(() => {
        checkin.resetToIdle();
      }, 5000); // Return to idle after 5 seconds on success screen

      return () => clearTimeout(timer);
    }
  }, [checkin.state, checkin.resetToIdle]);

  return (
    <KioskContext.Provider
      value={{
        settings,
        isLoadingSettings,
        organizationId,
        locationId,
        businessSettings: businessSettings || null,
        state: checkin.state,
        session: checkin.session,
        error: checkin.error,
        startSession: checkin.startSession,
        resetToIdle: checkin.resetToIdle,
        lookupByPhone: checkin.lookupByPhone,
        isLookingUp: checkin.isLookingUp,
        selectAppointment: checkin.selectAppointment,
        completeCheckin: checkin.completeCheckin,
        isCheckingIn: checkin.isCheckingIn,
        startWalkIn: checkin.startWalkIn,
        idleTimeRemaining,
      }}
    >
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const context = useContext(KioskContext);
  if (context === undefined) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return context;
}
