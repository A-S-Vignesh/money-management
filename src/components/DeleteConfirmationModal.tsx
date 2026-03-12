import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header with red theme */}
        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
          <div className="bg-red-100 p-4 rounded-full mb-4 shadow-sm">
            <AlertTriangle className="text-red-600" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">{title}</h2>
          <p className="text-red-600/90 text-sm px-2 font-medium">
            {description}
          </p>
        </div>

        {/* Warning text */}
        <div className="p-6 bg-white flex flex-col items-center text-center">
          <div className="bg-gray-50 text-gray-700 p-3 rounded-lg w-full text-sm font-medium border border-gray-100">
            <span className="text-red-600 font-bold mr-1">Warning:</span> 
            This action cannot be undone. Please be certain before proceeding.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-red-200"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            Yes, Delete it
          </button>
        </div>
      </div>
    </div>
  );
}
