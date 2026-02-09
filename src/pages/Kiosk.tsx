import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { KioskProvider, useKiosk } from '@/components/kiosk/KioskProvider';
import { KioskIdleScreen } from '@/components/kiosk/KioskIdleScreen';
import { KioskLookupScreen } from '@/components/kiosk/KioskLookupScreen';
import { KioskConfirmScreen } from '@/components/kiosk/KioskConfirmScreen';
import { KioskSuccessScreen } from '@/components/kiosk/KioskSuccessScreen';
import { KioskErrorScreen } from '@/components/kiosk/KioskErrorScreen';
import { Loader2 } from 'lucide-react';

function KioskContent() {
  const { state, isLoadingSettings } = useKiosk();

  if (isLoadingSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {state === 'idle' && <KioskIdleScreen key="idle" />}
      {state === 'lookup' && <KioskLookupScreen key="lookup" />}
      {state === 'confirm' && <KioskConfirmScreen key="confirm" />}
      {state === 'success' && <KioskSuccessScreen key="success" />}
      {state === 'error' && <KioskErrorScreen key="error" />}
      {/* TODO: Add KioskWalkInScreen for walk_in state */}
      {/* TODO: Add KioskFormSigningScreen for signing state */}
    </AnimatePresence>
  );
}

export default function Kiosk() {
  const { locationId } = useParams<{ locationId: string }>();

  if (!locationId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Invalid Kiosk URL</h1>
          <p className="opacity-80">A location ID is required.</p>
        </div>
      </div>
    );
  }

  return (
    <KioskProvider locationId={locationId}>
      <KioskContent />
    </KioskProvider>
  );
}
