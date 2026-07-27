/**
 * Feature flags.
 *
 * Flip a value to turn a feature on/off across the whole app.
 * Keep flags short-lived: once a feature is settled, remove the flag
 * and the dead branch it guards.
 */
export const FEATURES = {
  /**
   * Circle Location selector (header pill + profile dropdown + mobile sheet).
   *
   * Disabled: the selected circle is currently cosmetic, not wired into
   * book queries or any filter, so switching circles changes only a label.
   * Re-enable once circle scoping actually filters the catalog.
   */
  circleLocation: false,
} as const;

export type FeatureName = keyof typeof FEATURES;
