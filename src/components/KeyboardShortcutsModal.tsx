import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'C', description: 'Compose new message' },
    { key: 'R', description: 'Reply to current email' },
    { key: 'A', description: 'Reply All' },
    { key: 'F', description: 'Forward current email' },
    { key: 'E', description: 'Archive email' },
    { key: '# or Del', description: 'Move to trash' },
    { key: 'S', description: 'Star / Unstar email' },
    { key: 'U', description: 'Mark as read / unread' },
    { key: '/', description: 'Focus search bar' },
    { key: 'J / ↓', description: 'Next email in list' },
    { key: 'K / ↑', description: 'Previous email in list' },
    { key: 'Esc', description: 'Close email view or composer' },
    { key: '?', description: 'Show keyboard shortcuts' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <Command className="w-4 h-4 text-neutral-400" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-neutral-800/60 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-neutral-400">{s.description}</span>
              <kbd className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-[11px] shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-[11px] text-neutral-400 text-center font-mono">
          Press <kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">Esc</kbd> anytime to exit dialogs
        </div>
      </div>
    </div>
  );
};
