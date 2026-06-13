// Security-aware logger.
// SECURITY: never pass secrets, passphrases, keys, or decrypted data to these methods.
// Log identifiers and status, never payloads.
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  child(scope: string): Logger;
}

export function createLogger(scope: string): Logger {
  const emit = (level: 'log' | 'warn' | 'error', message: string, args: unknown[]) => {
    (console as unknown as Record<string, (...a: unknown[]) => void>)[level](
      `[EU:${scope}] ${message}`,
      ...args,
    );
  };
  return {
    info: (m, ...a) => emit('log', m, a),
    warn: (m, ...a) => emit('warn', m, a),
    error: (m, ...a) => emit('error', m, a),
    child: (s) => createLogger(`${scope}:${s}`),
  };
}
