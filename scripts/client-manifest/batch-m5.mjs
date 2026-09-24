/**
 * "use client" manifest — BATCH M5 (molecules M5). Only the batch M5 agent edits this file.
 */
export default [
  // Owns its dismissed state; renders IconButton / Button (client).
  'components/Alert/Alert',
  // Same as Alert.
  'components/Banner/Banner',
  // Ticks after mount (SSR-safe placeholder first).
  'components/Banner/BannerCountdown',
  // Relative time is computed after mount (SSR-safe) and ticks on a timer.
  'components/Timestamp/Timestamp',
];
