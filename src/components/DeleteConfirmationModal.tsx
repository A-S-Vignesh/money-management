import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { haptic } from '@/lib/haptic';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this item?",
  isLoading = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  // Render through a portal so the `fixed` positioning is anchored to the
  // viewport, not to any transformed ancestor (e.g. .page-transition).
  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[200] backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header with red theme */}
        <div className="bg-red-50 dark:bg-red-950/30 p-6 flex flex-col items-center text-center border-b border-red-100">
          <div className="bg-red-100 dark:bg-red-900/40 p-4 rounded-full mb-4 shadow-sm">
            <AlertTriangle className="text-red-600 dark:text-red-300" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">{title}</h2>
          <p className="text-red-600/90 text-sm px-2 font-medium">
            {description}
          </p>
        </div>

        {/* Warning text */}
        <div className="p-6 bg-white dark:bg-gray-900 flex flex-col items-center text-center">
          <div className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-lg w-full text-sm font-medium border border-gray-100 dark:border-gray-800">
            <span className="text-red-600 dark:text-red-300 font-bold mr-1">Warning:</span> 
            This action cannot be undone. Please be certain before proceeding.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              haptic("heavy");
              onConfirm();
            }}
            disabled={isLoading}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-red-200"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            Yes, Delete it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
