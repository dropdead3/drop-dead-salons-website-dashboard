import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Lock, Eye, EyeOff, Check, Palette, Type, Clock, Users, Image, Loader2 } from 'lucide-react';
import { useKiosk } from './KioskProvider';
import { DEFAULT_KIOSK_SETTINGS, useUpdateKioskSettings } from '@/hooks/useKioskSettings';
import { useValidatePin } from '@/hooks/useUserPin';

interface KioskSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PIN_TIMEOUT_SECONDS = 10;

type SettingsTab = 'appearance' | 'content' | 'behavior';

export function KioskSettingsDialog({ isOpen, onClose }: KioskSettingsDialogProps) {
  const { settings, organizationId, locationId } = useKiosk();
  const updateSettings = useUpdateKioskSettings();
  const validatePin = useValidatePin();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [timeRemaining, setTimeRemaining] = useState(PIN_TIMEOUT_SECONDS);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset the inactivity timeout
  const resetTimeout = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Only run timeout when dialog is open and not authenticated
    if (!isOpen || isAuthenticated) return;
    
    // Reset countdown
    setTimeRemaining(PIN_TIMEOUT_SECONDS);
    
    // Start countdown interval
    countdownRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Set timeout to close dialog
    timeoutRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      // Clear state and close
      setIsAuthenticated(false);
      setPinInput('');
      setPinError(false);
      setTimeRemaining(PIN_TIMEOUT_SECONDS);
      onClose();
    }, PIN_TIMEOUT_SECONDS * 1000);
  }, [isOpen, isAuthenticated, onClose]);
  
  // Initialize and clean up timeout
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      resetTimeout();
    } else {
      // Clear timers when authenticated or closed
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isOpen, isAuthenticated, resetTimeout]);
  
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
    if (!organizationId) return;
    
    await updateSettings.mutateAsync({
      organizationId,
      locationId: locationId || null,
      settings: localSettings,
    });
  };

  const handleClose = () => {
    // Clear timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setIsAuthenticated(false);
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
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-400" />
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
                  className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Lock className="w-10 h-10 text-purple-400" />
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
                        className={`w-4 h-4 rounded-full transition-all ${
                          i < pinInput.length 
                            ? pinError ? 'bg-red-500' : 'bg-purple-500' 
                            : 'bg-white/20'
                        }`}
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
                  className="mt-6 px-8 py-3 rounded-xl text-lg font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
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
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
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
                        />
                        <ColorSetting
                          label="Accent Color"
                          value={localSettings.accent_color}
                          onChange={(v) => updateLocalSetting('accent_color', v)}
                        />
                        <ColorSetting
                          label="Text Color"
                          value={localSettings.text_color}
                          onChange={(v) => updateLocalSetting('text_color', v)}
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
                        />
                        <TextSetting
                          label="Welcome Subtitle"
                          value={localSettings.welcome_subtitle}
                          onChange={(v) => updateLocalSetting('welcome_subtitle', v)}
                          placeholder="Optional subtitle"
                        />
                      </SettingGroup>
                      <SettingGroup title="Check-In Flow">
                        <TextSetting
                          label="Check-In Prompt"
                          value={localSettings.check_in_prompt}
                          onChange={(v) => updateLocalSetting('check_in_prompt', v)}
                        />
                        <TextSetting
                          label="Success Message"
                          value={localSettings.success_message}
                          onChange={(v) => updateLocalSetting('success_message', v)}
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
                        />
                      </SettingGroup>
                      <SettingGroup title="Features">
                        <ToggleSetting
                          label="Enable Walk-Ins"
                          description="Allow clients without appointments to check in"
                          value={localSettings.enable_walk_ins}
                          onChange={(v) => updateLocalSetting('enable_walk_ins', v)}
                        />
                        <ToggleSetting
                          label="Show Stylist Photo"
                          description="Display stylist photos on appointment cards"
                          value={localSettings.show_stylist_photo}
                          onChange={(v) => updateLocalSetting('show_stylist_photo', v)}
                        />
                        <ToggleSetting
                          label="Show Wait Time Estimate"
                          description="Display estimated wait time after check-in"
                          value={localSettings.show_wait_time_estimate}
                          onChange={(v) => updateLocalSetting('show_wait_time_estimate', v)}
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
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors disabled:opacity-50"
                    onClick={handleSave}
                    disabled={updateSettings.isPending}
                    whileTap={{ scale: 0.98 }}
                  >
                    {updateSettings.isPending ? (
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
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-white/80">{label}</label>
      <input
        type={type}
        className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function ColorSetting({ 
  label, 
  value, 
  onChange,
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
}) {
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
          className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono focus:border-purple-500 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-white/80">{label}</label>
      <input
        type="number"
        className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-center focus:border-purple-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
      />
    </div>
  );
}

function ToggleSetting({ 
  label, 
  description,
  value, 
  onChange,
}: { 
  label: string; 
  description?: string;
  value: boolean; 
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm text-white/80">{label}</div>
        {description && <div className="text-xs text-white/40 mt-0.5">{description}</div>}
      </div>
      <motion.button
        className={`w-12 h-7 rounded-full p-1 transition-colors ${
          value ? 'bg-purple-600' : 'bg-white/10'
        }`}
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
