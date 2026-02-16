import { createContext, useContext, ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { useKioskSettingsByLocation, KioskSettings, DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';
import { useKioskCheckin, KioskState, KioskSession } from '@/hooks/useKioskCheckin';
import { useBusinessSettings, BusinessSettings } from '@/hooks/useBusinessSettings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface KioskContextType {
  // Settings
  settings: KioskSettings | null;
  isLoadingSettings: boolean;
  organizationId: string | null;
  locationId: string;
  
  // Business settings for logo fallback
  businessSettings: BusinessSettings | null;
  
  // Location info for badge
  locationName: string | null;
  
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
  startBooking: () => void;
  startBrowse: () => void;
  isBrowsing: boolean;
  
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
  
  // Fetch location name for badge
  const { data: locationData } = useQuery({
    queryKey: ['location-details', locationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('locations')
        .select('name')
        .eq('id', locationId)
        .single();
      return data;
    },
    enabled: !!locationId,
  });
  
  const checkin = useKioskCheckin(locationId, organizationId || '');
  
  const [idleTimeRemaining, setIdleTimeRemaining] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Heartbeat logic ---
  useEffect(() => {
    if (!organizationId || !locationId) return;

    // Generate or retrieve stable device token
    const STORAGE_KEY = 'zura-kiosk-device-token';
    let deviceToken = localStorage.getItem(STORAGE_KEY);
    if (!deviceToken) {
      deviceToken = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, deviceToken);
    }

    // Derive device name from User-Agent
    const ua = navigator.userAgent;
    const deviceName = ua.includes('iPad') ? 'iPad' 
      : ua.includes('iPhone') ? 'iPhone'
      : ua.includes('Android') ? 'Android Tablet'
      : 'Browser';
    const browserMatch = ua.match(/(Safari|Chrome|Firefox|Edge)\//);
    const browser = browserMatch ? browserMatch[1] : '';
    const fullDeviceName = browser ? `${deviceName} - ${browser}` : deviceName;

    // Upsert device registration
    const registerDevice = async () => {
      // Try to find existing device
      const { data: existing } = await supabase
        .from('kiosk_devices')
        .select('id')
        .eq('device_token', deviceToken!)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('kiosk_devices')
          .update({
            location_id: locationId,
            organization_id: organizationId,
            device_name: fullDeviceName,
            last_heartbeat_at: new Date().toISOString(),
            is_active: true,
          })
          .eq('device_token', deviceToken!);
      } else {
        await supabase
          .from('kiosk_devices')
          .insert({
            device_token: deviceToken!,
            location_id: locationId,
            organization_id: organizationId,
            device_name: fullDeviceName,
            last_heartbeat_at: new Date().toISOString(),
            is_active: true,
          });
      }
    };

    registerDevice();

    // Send heartbeat every 60 seconds
    const sendHeartbeat = async (active = true) => {
      await supabase.rpc('kiosk_heartbeat_update', {
        p_device_token: deviceToken!,
        p_is_active: active,
      });
    };

    heartbeatIntervalRef.current = setInterval(() => sendHeartbeat(true), 60_000);

    // Visibility change handler
    const handleVisibility = () => {
      if (document.hidden) {
        sendHeartbeat(false);
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      } else {
        sendHeartbeat(true);
        heartbeatIntervalRef.current = setInterval(() => sendHeartbeat(true), 60_000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      // Final heartbeat marking inactive
      sendHeartbeat(false);
    };
  }, [organizationId, locationId]);

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
        locationName: locationData?.name || null,
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
        startBooking: checkin.startBooking,
        startBrowse: checkin.startBrowse,
        isBrowsing: checkin.isBrowsing,
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
