import { useRedoPolicySettings, REDO_REASONS_DEFAULT } from './useRedoPolicySettings';

/**
 * Returns the effective redo reasons for the org:
 * custom reasons if configured, otherwise the defaults.
 * Always includes "Other" as the last option.
 */
export function useRedoReasons(): string[] {
  const { data: policy } = useRedoPolicySettings();
  const custom = policy?.redo_custom_reasons;
  if (custom && custom.length > 0) {
    // Ensure "Other" is always present
    const reasons = custom.filter(r => r !== 'Other');
    return [...reasons, 'Other'];
  }
  return [...REDO_REASONS_DEFAULT];
}
