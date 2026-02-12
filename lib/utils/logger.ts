/**
 * Logger — Thin wrapper for structured console logging.
 * Prefixes messages with [BSI] for easy filtering in console/devtools.
 */
export const logger = {
  info: (...args: unknown[]) => console.log('[BSI]', ...args),
  warn: (...args: unknown[]) => console.warn('[BSI]', ...args),
  error: (...args: unknown[]) => console.error('[BSI]', ...args),
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[BSI]', ...args);
    }
  },
};
