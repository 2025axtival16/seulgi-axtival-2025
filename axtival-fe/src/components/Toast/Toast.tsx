import React, { useEffect } from "react";
import { Check } from "lucide-react";
import { toastContainer, toastContent } from "../../styles/toast.css";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  isVisible,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div className={toastContainer}>
      <div className={toastContent}>
        <Check size={20} />
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
