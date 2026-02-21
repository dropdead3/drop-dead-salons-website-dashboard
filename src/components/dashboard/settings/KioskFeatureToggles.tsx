import { UserCheck, ClipboardCheck, CalendarPlus, FileSignature, MessageSquare, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LocalSettings {
  enable_walk_ins: boolean;
  enable_self_booking: boolean;
  self_booking_allow_future: boolean;
  self_booking_show_stylists: boolean;
  require_confirmation_tap: boolean;
  show_wait_time_estimate: boolean;
  show_stylist_photo: boolean;
  enable_feedback_prompt: boolean;
  require_form_signing: boolean;
}

interface KioskFeatureTogglesProps {
  localSettings: LocalSettings;
  updateField: <K extends keyof LocalSettings>(field: K, value: LocalSettings[K]) => void;
}

export function KioskFeatureToggles({ localSettings, updateField }: KioskFeatureTogglesProps) {
  return (
    <div className="space-y-3">
      {/* Check-In — Core, always on */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Check-In</p>
              <p className="text-xs text-muted-foreground">Clients look up and check in for existing appointments</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Always on</span>
          </div>
        </div>
        <div className="pl-[52px] space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Require Confirmation Tap</p>
              <p className="text-xs text-muted-foreground">Ask client to confirm before check-in</p>
            </div>
            <Switch
              checked={localSettings.require_confirmation_tap}
              onCheckedChange={(v) => updateField('require_confirmation_tap', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Show Wait Time Estimate</p>
              <p className="text-xs text-muted-foreground">Display estimated wait after check-in</p>
            </div>
            <Switch
              checked={localSettings.show_wait_time_estimate}
              onCheckedChange={(v) => updateField('show_wait_time_estimate', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Show Stylist Photo</p>
              <p className="text-xs text-muted-foreground">Display stylist avatar on confirmation</p>
            </div>
            <Switch
              checked={localSettings.show_stylist_photo}
              onCheckedChange={(v) => updateField('show_stylist_photo', v)}
            />
          </div>
        </div>
      </div>

      {/* Walk-In Registration */}
      <div className={cn(
        "rounded-xl border p-4 transition-all",
        localSettings.enable_walk_ins ? "border-border bg-card" : "border-muted bg-muted/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              localSettings.enable_walk_ins ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Walk-In Registration</p>
              <p className="text-xs text-muted-foreground">Let clients register without an appointment</p>
            </div>
          </div>
          <Switch
            checked={localSettings.enable_walk_ins}
            onCheckedChange={(v) => updateField('enable_walk_ins', v)}
          />
        </div>
      </div>

      {/* Self-Service Booking */}
      <div className={cn(
        "rounded-xl border p-4 transition-all",
        localSettings.enable_self_booking ? "border-border bg-card" : "border-muted bg-muted/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              localSettings.enable_self_booking ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Self-Service Booking</p>
              <p className="text-xs text-muted-foreground">Walk-in clients can browse services and book appointments</p>
            </div>
          </div>
          <Switch
            checked={localSettings.enable_self_booking}
            onCheckedChange={(v) => updateField('enable_self_booking', v)}
          />
        </div>
        <AnimatePresence>
          {localSettings.enable_self_booking && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pl-[52px] space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Allow Future Bookings</p>
                    <p className="text-xs text-muted-foreground">Let clients book for dates beyond today</p>
                  </div>
                  <Switch
                    checked={localSettings.self_booking_allow_future}
                    onCheckedChange={(v) => updateField('self_booking_allow_future', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Show Stylist Selection</p>
                    <p className="text-xs text-muted-foreground">Let clients choose their stylist (otherwise first available)</p>
                  </div>
                  <Switch
                    checked={localSettings.self_booking_show_stylists}
                    onCheckedChange={(v) => updateField('self_booking_show_stylists', v)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form Signing */}
      <div className={cn(
        "rounded-xl border p-4 transition-all",
        localSettings.require_form_signing ? "border-border bg-card" : "border-muted bg-muted/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              localSettings.require_form_signing ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Form Signing</p>
              <p className="text-xs text-muted-foreground">Prompt new clients to sign intake forms during check-in</p>
            </div>
          </div>
          <Switch
            checked={localSettings.require_form_signing}
            onCheckedChange={(v) => updateField('require_form_signing', v)}
          />
        </div>
      </div>

      {/* Feedback Prompt */}
      <div className={cn(
        "rounded-xl border p-4 transition-all",
        localSettings.enable_feedback_prompt ? "border-border bg-card" : "border-muted bg-muted/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              localSettings.enable_feedback_prompt ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Feedback Prompt</p>
              <p className="text-xs text-muted-foreground">Ask clients for feedback after check-in</p>
            </div>
          </div>
          <Switch
            checked={localSettings.enable_feedback_prompt}
            onCheckedChange={(v) => updateField('enable_feedback_prompt', v)}
          />
        </div>
      </div>
    </div>
  );
}
