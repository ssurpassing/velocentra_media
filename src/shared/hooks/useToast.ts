import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++toastCount}`;
    const newToast: Toast = { id, type, message };

    setToasts((prev) => [...prev, newToast]);

    // 自动移除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);

    return id;
  }, []);

  const success = useCallback((message: string) => show('success', message), [show]);
  const error = useCallback((message: string) => show('error', message), [show]);
  const info = useCallback((message: string) => show('info', message), [show]);
  const warning = useCallback((message: string) => show('warning', message), [show]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    show,
    success,
    error,
    info,
    warning,
    dismiss,
  };
}


