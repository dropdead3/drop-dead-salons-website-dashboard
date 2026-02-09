import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Lock, Eye, EyeOff, Check, Palette, Type, Clock, Users, Image, Loader2 } from 'lucide-react';
import { useKiosk } from './KioskProvider';
import { DEFAULT_KIOSK_SETTINGS } from '@/hooks/useKioskSettings';
import { useKioskValidatePin, useKioskSaveSettings } from '@/hooks/useKioskPinValidation';
import { toast } from 'sonner';

interface KioskSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PIN_TIMEOUT_SECONDS = 10;

type SettingsTab = 'appearance' | 'content' | 'behavior';

export function KioskSettingsDialog({ isOpen, onClose }: KioskSettingsDialogProps) {
  const { settings, organizationId, locationId } = useKiosk();
  const saveSettings = useKioskSaveSettings();
  
  // Use configured accent color from kiosk settings
  const accentColor = settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color;
  const validatePin = useKioskValidatePin(organizationId);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedPin, setAuthenticatedPin] = useState<string>(''); // Store PIN for later save
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [timeRemaining, setTimeRemaining] = useState(PIN_TIMEOUT_SECONDS);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to track latest state values - updated SYNCHRONOUSLY during render
  const isOpenRef = useRef(isOpen);
  const isAuthenticatedRef = useRef(isAuthenticated);
  
  // CRITICAL: Sync refs synchronously on every render (not in useEffect)
  // This ensures refs have current values before any effects run
  isOpenRef.current = isOpen;
  isAuthenticatedRef.current = isAuthenticated;
  
  // Reset the inactivity timeout on user interaction
  const resetTimeout = useCallback(() => {
    if (!isOpenRef.current || isAuthenticatedRef.current) return;
    
    // Clear and restart timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    setTimeRemaining(PIN_TIMEOUT_SECONDS);
    
    countdownRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    timeoutRef.current = setTimeout(() => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (isOpenRef.current && !isAuthenticatedRef.current) {
        setIsAuthenticated(false);
        setPinInput('');
        setPinError(false);
        setTimeRemaining(PIN_TIMEOUT_SECONDS);
        onClose();
      }
    }, PIN_TIMEOUT_SECONDS * 1000);
  }, [onClose]);
  
  // Initialize timers when dialog opens in unauthenticated state
  useEffect(() => {
    // Only run when dialog is open AND not authenticated
    if (!isOpen || isAuthenticated) {
      // Clean up if dialog closes or user authenticates
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }
    
    // Clear any existing timers first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    // Reset state
    setTimeRemaining(PIN_TIMEOUT_SECONDS);
    
    // Use a small delay to ensure refs are synced and component is mounted
    const initTimer = setTimeout(() => {
      // Double-check we should still run
      if (!isOpenRef.current || isAuthenticatedRef.current) return;
      
      // Start countdown interval
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newVal = prev - 1;
          if (newVal <= 0) {
            // Time's up - close the dialog
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            // Schedule close for next tick to avoid state update during render
            setTimeout(() => {
              if (isOpenRef.current && !isAuthenticatedRef.current) {
                setIsAuthenticated(false);
                setPinInput('');
                setPinError(false);
                setTimeRemaining(PIN_TIMEOUT_SECONDS);
                onClose();
              }
            }, 0);
            return 0;
          }
          return newVal;
        });
      }, 1000);
    }, 50);
    
    return () => {
      clearTimeout(initTimer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isOpen, isAuthenticated, onClose]);
  
  // Local settings state
  const [localSettings, setLocalSettings] = useState({
    welcome_title: settings?.welcome_title || DEFAULT_KIOSK_SETTINGS.welcome_title,
    welcome_subtitle: settings?.welcome_subtitle || '',
    check_in_prompt: settings?.check_in_prompt || DEFAULT_KIOSK_SETTINGS.check_in_prompt,
    success_message: settings?.success_message || DEFAULT_KIOSK_SETTINGS.success_message,
    background_color: settings?.background_color || DEFAULT_KIOSK_SETTINGS.background_color,
    accent_color: settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color,
    text_color: settings?.text_color || DEFAULT_KIOSK_SETTINGS.text_color,
    idle_timeout_seconds: settings?.idle_timeout_seconds || DEFAULT_KIOSK_SETTINGS.idle_timeout_seconds,
    enable_walk_ins: settings?.enable_walk_ins ?? DEFAULT_KIOSK_SETTINGS.enable_walk_ins,
    show_stylist_photo: settings?.show_stylist_photo ?? DEFAULT_KIOSK_SETTINGS.show_stylist_photo,
    show_wait_time_estimate: settings?.show_wait_time_estimate ?? DEFAULT_KIOSK_SETTINGS.show_wait_time_estimate,
  });

  const handlePinSubmit = async () => {
    if (pinInput.length < 4 || isValidating) return;
    
    setIsValidating(true);
    setPinError(false);
    setPinErrorMessage('');
    
    try {
      const result = await validatePin.mutateAsync(pinInput);
      
      if (result && (result.is_super_admin || result.is_primary_owner)) {
        setIsAuthenticated(true);
        setAuthenticatedPin(pinInput); // Store PIN for later save
        setPinError(false);
        setPinInput('');
      } else if (result) {
        // Valid PIN but not an admin
        setPinError(true);
        setPinErrorMessage('Admin access required');
        setPinInput('');
      } else {
        // No matching PIN
        setPinError(true);
        setPinErrorMessage('Incorrect PIN');
        setPinInput('');
      }
    } catch (error) {
      setPinError(true);
      setPinErrorMessage('Incorrect PIN');
      setPinInput('');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePinDigit = async (digit: string) => {
    // Reset timeout on any interaction
    resetTimeout();
    
    if (pinInput.length < 4 && !isValidating) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      setPinError(false);
      setPinErrorMessage('');
      
      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        setIsValidating(true);
        
        try {
          const result = await validatePin.mutateAsync(newPin);
          
          if (result && (result.is_super_admin || result.is_primary_owner)) {
            setIsAuthenticated(true);
            setAuthenticatedPin(newPin); // Store PIN for later save
            setPinError(false);
            setPinInput('');
          } else if (result) {
            // Valid PIN but not an admin
            setPinError(true);
            setPinErrorMessage('Admin access required');
            setPinInput('');
          } else {
            // No matching PIN
            setPinError(true);
            setPinErrorMessage('Incorrect PIN');
            setPinInput('');
          }
        } catch (error) {
          setPinError(true);
          setPinErrorMessage('Incorrect PIN');
          setPinInput('');
        } finally {
          setIsValidating(false);
        }
      }
    }
  };

  const handlePinDelete = () => {
    // Reset timeout on any interaction
    resetTimeout();
    
    setPinInput(pinInput.slice(0, -1));
    setPinError(false);
  };

  const handleSave = async () => {
    if (!organizationId) {
      toast.error('Unable to save: Organization not found');
      return;
    }
    
    if (!authenticatedPin) {
      toast.error('Session expired. Please re-enter your PIN.');
      setIsAuthenticated(false);
      return;
    }
    
    try {
      await saveSettings.mutateAsync({
        organizationId,
        locationId: locationId || null,
        settings: localSettings,
        adminPin: authenticatedPin,
      });
      toast.success('Changes saved successfully');
      handleClose();
    } catch (error) {
      console.error('Failed to save kiosk settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleClose = () => {
    // Clear timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setIsAuthenticated(false);
    setAuthenticatedPin(''); // Clear stored PIN
    setPinInput('');
    setPinError(false);
    setTimeRemaining(PIN_TIMEOUT_SECONDS);
    onClose();
  };

  const updateLocalSetting = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="relative w-full max-w-2xl max-h-[90vh] mx-4 rounded-3xl overflow-hidden"
          style={{ backgroundColor: '#1a1a1a' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Settings className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h2 className="text-xl font-medium text-white">Kiosk Settings</h2>
                <p className="text-sm text-white/60">
                  {isAuthenticated ? 'Configure your kiosk' : 'Enter PIN to access'}
                </p>
              </div>
            </div>
            <motion.button
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={handleClose}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {!isAuthenticated ? (
              /* PIN Entry */
              <div className="flex flex-col items-center py-8">
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${accentColor}20` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Lock className="w-10 h-10" style={{ color: accentColor }} />
                </motion.div>
                
                <h3 className="text-xl font-medium text-white mb-2">Enter Admin PIN</h3>
                <p className="text-white/60 mb-2 text-center">
                  Enter your 4 digit PIN to access settings
                </p>
                
                {/* Countdown timer */}
                <div className="flex items-center gap-2 mb-6 text-sm text-white/40">
                  <Clock className="w-4 h-4" />
                  <span>Closing in {timeRemaining}s</span>
                </div>

                {/* PIN display */}
                <div className="flex items-center gap-2 mb-6">
                  <div 
                    className="flex gap-3 px-6 py-4 rounded-2xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full transition-all"
                        style={{ 
                          backgroundColor: i < pinInput.length 
                            ? (pinError ? '#ef4444' : accentColor)
                            : 'rgba(255,255,255,0.2)'
                        }}
                      />
                    ))}
                  </div>
                  <button
                    className="p-2 text-white/40 hover:text-white/60"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {showPin && pinInput && (
                  <p className="text-white/60 mb-4 font-mono">{pinInput}</p>
                )}

                {pinError && (
                  <motion.p 
                    className="text-red-400 mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {pinErrorMessage || 'Incorrect PIN'}. Please try again.
                  </motion.p>
                )}

                {isValidating && (
                  <motion.div 
                    className="flex items-center gap-2 text-white/60 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating...</span>
                  </motion.div>
                )}

                {/* Number pad */}
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
                    <motion.button
                      key={key || 'empty'}
                      className={`w-16 h-16 rounded-xl text-xl font-medium transition-colors ${
                        key === '' 
                          ? 'invisible' 
                          : key === 'del'
                          ? 'bg-white/5 text-white/60 hover:bg-white/10'
                          : 'bg-white/10 text-white hover:bg-white/15'
                      } ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (key === 'del') handlePinDelete();
                        else if (key) handlePinDigit(key);
                      }}
                      whileTap={{ scale: 0.95 }}
                      disabled={key === '' || isValidating}
                    >
                      {key === 'del' ? '←' : key}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  className="mt-6 px-8 py-3 rounded-xl text-lg font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                  onClick={handlePinSubmit}
                  disabled={pinInput.length < 4 || isValidating}
                  whileTap={{ scale: 0.98 }}
                >
                  {isValidating ? 'Validating...' : 'Unlock Settings'}
                </motion.button>
              </div>
            ) : (
              /* Settings Panel */
              <div>
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  {[
                    { id: 'appearance', label: 'Appearance', icon: Palette },
                    { id: 'content', label: 'Content', icon: Type },
                    { id: 'behavior', label: 'Behavior', icon: Clock },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                      style={activeTab === tab.id ? { backgroundColor: accentColor } : undefined}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                {/* Settings content */}
                <div className="space-y-6">
                  {activeTab === 'appearance' && (
                    <>
                      <SettingGroup title="Colors">
                        <ColorSetting
                          label="Background Color"
                          value={localSettings.background_color}
                          onChange={(v) => updateLocalSetting('background_color', v)}
                          accentColor={accentColor}
                        />
                        <ColorSetting
                          label="Accent Color"
                          value={localSettings.accent_color}
                          onChange={(v) => updateLocalSetting('accent_color', v)}
                          accentColor={accentColor}
                        />
                        <ColorSetting
                          label="Text Color"
                          value={localSettings.text_color}
                          onChange={(v) => updateLocalSetting('text_color', v)}
                          accentColor={accentColor}
                        />
                      </SettingGroup>
                    </>
                  )}

                  {activeTab === 'content' && (
                    <>
                      <SettingGroup title="Welcome Screen">
                        <TextSetting
                          label="Welcome Title"
                          value={localSettings.welcome_title}
                          onChange={(v) => updateLocalSetting('welcome_title', v)}
                          accentColor={accentColor}
                        />
                        <TextSetting
                          label="Welcome Subtitle"
                          value={localSettings.welcome_subtitle}
                          onChange={(v) => updateLocalSetting('welcome_subtitle', v)}
                          placeholder="Optional subtitle"
                          accentColor={accentColor}
                        />
                      </SettingGroup>
                      <SettingGroup title="Check-In Flow">
                        <TextSetting
                          label="Check-In Prompt"
                          value={localSettings.check_in_prompt}
                          onChange={(v) => updateLocalSetting('check_in_prompt', v)}
                          accentColor={accentColor}
                        />
                        <TextSetting
                          label="Success Message"
                          value={localSettings.success_message}
                          onChange={(v) => updateLocalSetting('success_message', v)}
                          accentColor={accentColor}
                        />
                      </SettingGroup>
                    </>
                  )}

                  {activeTab === 'behavior' && (
                    <>
                      <SettingGroup title="Timeouts">
                        <NumberSetting
                          label="Idle Timeout (seconds)"
                          value={localSettings.idle_timeout_seconds}
                          onChange={(v) => updateLocalSetting('idle_timeout_seconds', v)}
                          min={30}
                          max={300}
                          accentColor={accentColor}
                        />
                      </SettingGroup>
                      <SettingGroup title="Features">
                        <ToggleSetting
                          label="Enable Walk-Ins"
                          description="Allow clients without appointments to check in"
                          value={localSettings.enable_walk_ins}
                          onChange={(v) => updateLocalSetting('enable_walk_ins', v)}
                          accentColor={accentColor}
                        />
                        <ToggleSetting
                          label="Show Stylist Photo"
                          description="Display stylist photos on appointment cards"
                          value={localSettings.show_stylist_photo}
                          onChange={(v) => updateLocalSetting('show_stylist_photo', v)}
                          accentColor={accentColor}
                        />
                        <ToggleSetting
                          label="Show Wait Time Estimate"
                          description="Display estimated wait time after check-in"
                          value={localSettings.show_wait_time_estimate}
                          onChange={(v) => updateLocalSetting('show_wait_time_estimate', v)}
                          accentColor={accentColor}
                        />
                      </SettingGroup>
                      <SettingGroup title="Security">
                        <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-sm text-white/60">
                            Admin access uses your personal Quick Login PIN. Only Primary Owners and Super Admins can access these settings.
                          </p>
                        </div>
                      </SettingGroup>
                    </>
                  )}
                </div>

                {/* Save button */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
                  <motion.button
                    className="px-6 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={handleClose}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}
                    onClick={handleSave}
                    disabled={saveSettings.isPending}
                    whileTap={{ scale: 0.98 }}
                  >
                    {saveSettings.isPending ? (
                      'Saving...'
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Setting Components
function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TextSetting({ 
  label, 
  value, 
  onChange, 
  placeholder,
  type = 'text',
  accentColor,
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  accentColor?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-white/80">{label}</label>
      <input
        type={type}
        className="px-4 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/30 focus:outline-none transition-colors"
        style={{ borderColor: isFocused && accentColor ? accentColor : 'rgba(255,255,255,0.1)' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  );
}

function ColorSetting({ 
  label, 
  value, 
  onChange,
  accentColor,
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
  accentColor?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-white/80">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="w-24 px-3 py-2 rounded-lg bg-white/5 border text-white text-sm font-mono focus:outline-none"
          style={{ borderColor: isFocused && accentColor ? accentColor : 'rgba(255,255,255,0.1)' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
    </div>
  );
}

function NumberSetting({ 
  label, 
  value, 
  onChange,
  min,
  max,
  accentColor,
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  accentColor?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-white/80">{label}</label>
      <input
        type="number"
        className="w-24 px-3 py-2 rounded-lg bg-white/5 border text-white text-center focus:outline-none"
        style={{ borderColor: isFocused && accentColor ? accentColor : 'rgba(255,255,255,0.1)' }}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  );
}

function ToggleSetting({ 
  label, 
  description,
  value, 
  onChange,
  accentColor,
}: { 
  label: string; 
  description?: string;
  value: boolean; 
  onChange: (v: boolean) => void;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm text-white/80">{label}</div>
        {description && <div className="text-xs text-white/40 mt-0.5">{description}</div>}
      </div>
      <motion.button
        className="w-12 h-7 rounded-full p-1 transition-colors"
        style={{ backgroundColor: value && accentColor ? accentColor : 'rgba(255,255,255,0.1)' }}
        onClick={() => onChange(!value)}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-white shadow-lg"
          animate={{ x: value ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}
