"use client";
import React, { useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

const iconMap = {
  success: <CheckCircle className="text-green-500" size={20} />,
  error: <XCircle className="text-red-500" size={20} />,
  warning: <AlertTriangle className="text-yellow-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />,
};

const bgMap = {
  success: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  warning: "bg-yellow-50 border-yellow-200",
  info: "bg-blue-50 border-blue-200",
};

interface ToastPropsType{
    message: string;
    type?: "success" | "error" | "warning" | "info";
    onClose?: () => void;
}

const Toast: React.FC<ToastPropsType> = ({
  message,
  type = "info",
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-50 border text-sm px-4 py-3 rounded-lg shadow-md flex items-center gap-2 transition-all duration-300 animate-slide-in ${bgMap[type]}`}
    >
      {iconMap[type]}
      <span className="text-gray-800">{message}</span>
    </div>
  );
};

export default Toast;
