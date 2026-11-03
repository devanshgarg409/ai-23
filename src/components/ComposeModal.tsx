import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Trash2, 
  Paperclip, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Minimize2, 
  Maximize2,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { ComposeDraft } from '../types/mail';

interface ComposeModalProps {
  isOpen: boolean;
  initialDraft?: Partial<ComposeDraft>;
  onClose: () => void;
  onSend: (draft: ComposeDraft) => void | Promise<void>;
  onSaveDraft?: (draft: ComposeDraft) => void | Promise<void>;
  isSending: boolean;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  initialDraft,
  onClose,
  onSend,
  onSaveDraft,
  isSending,
}) => {
  const [to, setTo] = useState(initialDraft?.to || '');
  const [cc, setCc] = useState(initialDraft?.cc || '');
  const [bcc, setBcc] = useState(initialDraft?.bcc || '');
  const [subject, setSubject] = useState(initialDraft?.subject || '');
  const [body, setBody] = useState(initialDraft?.body || '');
  const [showCcBcc, setShowCcBcc] = useState(Boolean(initialDraft?.cc || initialDraft?.bcc));
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sync with initialDraft when changed
  React.useEffect(() => {
    if (initialDraft) {
      setTo(initialDraft.to || '');
      setCc(initialDraft.cc || '');
      setBcc(initialDraft.bcc || '');
      setSubject(initialDraft.subject || '');
      setBody(initialDraft.body || '');
      setShowCcBcc(Boolean(initialDraft.cc || initialDraft.bcc));
    }
  }, [initialDraft]);

  if (!isOpen) return null;

  const handleSendClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      alert('Please specify at least one recipient in the "To" field.');
      return;
    }

    onSend({
      to: to.trim(),
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      subject: subject.trim() || '(No Subject)',
      body,
      inReplyTo: initialDraft?.inReplyTo,
      references: initialDraft?.references,
      threadId: initialDraft?.threadId,
    });
  };

  const handleSaveDraftClick = async () => {
    if (!onSaveDraft) return;
    setIsSavingDraft(true);
    setSaveStatus('Saving draft...');
    try {
      await onSaveDraft({
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim() || '(Draft)',
        body,
        inReplyTo: initialDraft?.inReplyTo,
        references: initialDraft?.references,
        threadId: initialDraft?.threadId,
      });
      setSaveStatus('Draft saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('compose-body-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 0);
  };

  return (
    <div className="fixed bottom-0 right-0 sm:right-6 sm:bottom-6 z-40 w-full sm:max-w-2xl bg-neutral-900 border border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between select-none">
        <span className="text-xs font-medium text-neutral-200 truncate">
          {subject ? subject : 'New Message'}
        </span>

        <div className="flex items-center gap-1.5 text-neutral-400">
          {saveStatus && (
            <span className="text-[11px] text-neutral-400 font-mono mr-2">
              {saveStatus}
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <form onSubmit={handleSendClick} className="flex flex-col h-[520px] max-h-[80vh]">
          {/* Recipient Fields */}
          <div className="px-4 py-2 space-y-2 border-b border-neutral-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 w-12 font-medium">To</span>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                required
                className="flex-1 bg-transparent text-neutral-200 focus:outline-none placeholder-neutral-600 font-mono text-xs"
              />
              {!showCcBcc && (
                <button
                  type="button"
                  onClick={() => setShowCcBcc(true)}
                  className="text-neutral-500 hover:text-neutral-300 text-[11px]"
                >
                  Cc/Bcc
                </button>
              )}
            </div>

            {showCcBcc && (
              <>
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/50">
                  <span className="text-neutral-500 w-12 font-medium">Cc</span>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="flex-1 bg-transparent text-neutral-200 focus:outline-none placeholder-neutral-600 font-mono text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/50">
                  <span className="text-neutral-500 w-12 font-medium">Bcc</span>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="flex-1 bg-transparent text-neutral-200 focus:outline-none placeholder-neutral-600 font-mono text-xs"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/50">
              <span className="text-neutral-500 w-12 font-medium">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this email regarding?"
                className="flex-1 bg-transparent text-neutral-200 focus:outline-none placeholder-neutral-600 text-xs font-normal"
              />
            </div>
          </div>

          {/* Minimalist Formatting Bar */}
          <div className="px-4 py-1.5 border-b border-neutral-800/60 bg-neutral-950/40 flex items-center gap-1 text-neutral-400">
            <button
              type="button"
              onClick={() => insertFormatting('<b>', '</b>')}
              className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('<i>', '</i>')}
              className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('\n• ', '')}
              className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Bullet list"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('\n1. ', '')}
              className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Numbered list"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('<blockquote>', '</blockquote>')}
              className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body Textarea */}
          <div className="flex-1 p-4">
            <textarea
              id="compose-body-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here..."
              className="w-full h-full bg-transparent text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none font-sans text-xs leading-relaxed"
            />
          </div>

          {/* Bottom Action Footer */}
          <div className="px-4 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-900 font-medium text-xs hover:bg-neutral-200 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Send'}</span>
              </button>

              {onSaveDraft && (
                <button
                  type="button"
                  onClick={handleSaveDraftClick}
                  disabled={isSavingDraft}
                  className="px-3 py-2 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Discard draft"
              className="p-2 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
