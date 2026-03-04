'use client';

import {createContext, type JSX, type ReactNode, useCallback} from 'react';
import {toast} from 'sonner';
import {Toaster} from '@/components/ui/sonner.tsx';

// Keep PrimeReact's ToastMessage interface for backward compatibility
export type ToastMessage = {
  severity?: 'success' | 'info' | 'warn' | 'error';
  summary?: string;
  detail?: string;
  life?: number;
  closable?: boolean;
  sticky?: boolean;
};

export type ShowToastFunction = (options: ToastMessage) => void;

const defaultToastLife = 3000;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const ToastContext = createContext<ShowToastFunction>(() => {});

export function ToastProvider({children}: {readonly children: ReactNode}): JSX.Element {
  const showToast: ShowToastFunction = useCallback((options: ToastMessage): void => {
    const {severity = 'info', summary, detail, life, closable = true, sticky = false} = options;

    // Map PrimeReact options to Sonner options
    const duration = sticky ? Infinity : (life ?? defaultToastLife);
    const message = summary ?? '';
    const description = detail;

    const sonnerOptions = {
      description,
      duration,
      closeButton: closable,
    };

    // Call the appropriate toast function based on severity
    switch (severity) {
      case 'success': {
        toast.success(message, sonnerOptions);
        break;
      }

      case 'error': {
        toast.error(message, sonnerOptions);
        break;
      }

      case 'warn': {
        toast.warning(message, sonnerOptions);
        break;
      }

      case 'info': {
        toast.info(message, sonnerOptions);
        break;
      }
    }
  }, []);

  return (
    <ToastContext value={showToast}>
      <Toaster />
      {children}
    </ToastContext>
  );
}
