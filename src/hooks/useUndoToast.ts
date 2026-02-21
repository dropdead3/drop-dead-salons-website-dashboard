import { toast } from 'sonner';

/**
 * Returns a function that shows a toast with an "Undo" action button.
 * After `duration` ms the toast auto-dismisses and the action is final.
 */
export function useUndoToast() {
  return (message: string, undoFn: () => void, duration = 6000) => {
    toast(message, {
      action: {
        label: 'Undo',
        onClick: undoFn,
      },
      duration,
    });
  };
}
