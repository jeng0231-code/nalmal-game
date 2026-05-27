const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on', 'enabled']);

function normalizeFlag(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isClaudeFeaturesEnabled(): boolean {
  return ENABLED_VALUES.has(normalizeFlag(import.meta.env.VITE_ENABLE_CLAUDE_FEATURES));
}
