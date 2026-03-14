"use client";
import React, { useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

// Using more vibrant, solid colors for high visibility
const themeMap = {
  success: "bg-emerald-600 border-emerald-500 text-white",
  error: "bg-rose-600 border-rose-500 text-white",
  warning: "bg-amber-500 border-amber-400 text-white",
  info: "bg-sky-600 border-sky-500 text-white",
};

const iconMap = {
  success: <CheckCircle size={22} />,
  error: <XCircle size={22} />,
  warning: <AlertTriangle size={22} />,
  info: <Info size={22} />,
};

interface ToastPropsType {
  id: number;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: (id: number) => void;
}

const Toast: React.FC<ToastPropsType> = ({
  id,
  message,
  type = "info",
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl border-2 transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-5 md:slide-in-from-bottom-0 md:slide-in-from-right-10 ${themeMap[type]}`}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0">{iconMap[type]}</span>
        <p className="font-semibold text-sm leading-tight tracking-wide">
          {message}
        </p>
      </div>

      <button
        onClick={() => onClose(id)}
        className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
