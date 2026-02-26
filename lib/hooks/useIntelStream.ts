import { useState, useRef, useCallback } from 'react';
import { streamAnalysis } from '@/lib/bsi-stream-client';

type Status = 'idle' | 'streaming' | 'done' | 'error';

/**
 * Wraps streamAnalysis for programmatic use without the full IntelStream component.
 * Enables inline analysis in stat cards, tooltips, or other contexts.
 */
export function useIntelStream() {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [meta, setMeta] = useState<{ ttftMs: number | null; cached: boolean } | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const fire = useCallback((options: Parameters<typeof streamAnalysis>[0]) => {
    abortRef.current?.();
    setOutput('');
    setMeta(null);
    setStatus('streaming');

    abortRef.current = streamAnalysis({
      ...options,
      onToken: (text) => setOutput((prev) => prev + text),
      onDone: (m) => { setMeta(m); setStatus('done'); },
      onError: () => setStatus('error'),
    });
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.();
    setStatus('idle');
  }, []);

  return { output, status, meta, fire, abort };
}
