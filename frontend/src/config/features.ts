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

  /**
   * Swaps tab (PIN handoffs, pickup spots, swap events).
   *
   * Disabled: the pickup spots and swap events are hardcoded sample content
   * shown identically to every account, and their "(0)" counters contradict
   * the cards rendered beneath them. The RSVP control does nothing. There are
   * no server routes behind `pickup_spots` or `swap_events`, so nothing here
   * can persist. Re-enable once those routes exist.
   */
  swaps: false,

  /**
   * Analytics widgets that are not derived from real data.
   *
   * The honesty score and shared-library count are real and stay visible; the
   * borrowing-history chart, genre breakdown and achievement log were
   * fabricated, showing months of activity and book titles that belong to no
   * account. Re-enable per widget as each is wired to real data.
   */
  analyticsCharts: false,
} as const;

export type FeatureName = keyof typeof FEATURES;
