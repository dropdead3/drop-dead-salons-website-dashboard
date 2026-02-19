import { useEffect, useCallback } from 'react';

/**
 * Registers a save callback that the Hub can trigger via a custom event.
 * Also dispatches `editor-saving-state` so the Hub can show a spinner.
 */
export function useEditorSaveAction(handleSave: () => Promise<void>) {
  const wrappedSave = useCallback(async () => {
    window.dispatchEvent(new CustomEvent('editor-saving-state', { detail: { saving: true } }));
    try {
      await handleSave();
    } finally {
      window.dispatchEvent(new CustomEvent('editor-saving-state', { detail: { saving: false } }));
    }
  }, [handleSave]);

  useEffect(() => {
    const handler = () => {
      wrappedSave();
    };
    window.addEventListener('editor-save-request', handler);
    return () => window.removeEventListener('editor-save-request', handler);
  }, [wrappedSave]);
}
