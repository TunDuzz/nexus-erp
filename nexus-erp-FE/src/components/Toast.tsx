import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="toast-icon success" size={18} />,
    warning: <AlertTriangle className="toast-icon warning" size={18} />,
    error: <XCircle className="toast-icon error" size={18} />,
    info: <Info className="toast-icon info" size={18} />,
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      {icons[type]}
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Đóng thông báo" type="button">
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
