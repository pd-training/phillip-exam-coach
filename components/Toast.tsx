'use client';

import { useCallback, useEffect, useState } from 'react';

type ToastState = { message: string; tone: 'success' | 'error' } | null;

// Messages that describe a failure or a missing input get the error tone.
const ERROR_PATTERN = /^(Error|Please|Failed)|required/i;

/**
 * Non-blocking replacement for window.alert().
 * Usage: const { showToast, ToastView } = useToast();
 * Render {ToastView} once inside the page's root element.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string) => {
    setToast({
      message,
      tone: ERROR_PATTERN.test(message) ? 'error' : 'success',
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const ToastView = toast ? (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
        toast.tone === 'error' ? 'bg-red-600' : 'bg-green-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex-1">{toast.message}</span>
        <button
          onClick={() => setToast(null)}
          className="text-white/80 hover:text-white leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  ) : null;

  return { showToast, ToastView };
}
