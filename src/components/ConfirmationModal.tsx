import React from 'react';
import { AlertTriangle, Send, Trash2, X, Check } from 'lucide-react';
import { ConfirmationDialogConfig } from '../types/mail';

interface ConfirmationModalProps {
  config: ConfirmationDialogConfig | null;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  config,
  onClose,
}) => {
  if (!config || !config.isOpen) return null;

  const isDestructive = config.isDestructive ?? true;
  const isSendAction = config.title.toLowerCase().includes('send');

  const handleConfirm = async () => {
    try {
      await config.onConfirm();
    } finally {
      onClose();
    }
  };

  const handleCancel = () => {
    if (config.onCancel) {
      config.onCancel();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isSendAction
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : isDestructive
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isSendAction ? (
              <Send className="w-5 h-5" />
            ) : isDestructive ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="confirmation-title" className="text-base font-medium text-neutral-100">
              {config.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-400 leading-normal">
              {config.description}
            </p>
          </div>

          <button
            onClick={handleCancel}
            className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {config.cancelLabel || 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              isSendAction
                ? 'bg-white text-neutral-900 hover:bg-neutral-200 active:scale-95'
                : isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95'
                : 'bg-neutral-100 text-neutral-900 hover:bg-white active:scale-95'
            }`}
          >
            {isSendAction ? (
              <Send className="w-3.5 h-3.5" />
            ) : isDestructive ? (
              <Trash2 className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{config.confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
