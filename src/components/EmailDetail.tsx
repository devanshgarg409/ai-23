import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Trash2, 
  Archive, 
  Mail, 
  Reply, 
  ReplyAll, 
  Forward, 
  Paperclip, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Download,
  ExternalLink,
  Code2,
  Clock,
  Send
} from 'lucide-react';
import { EmailMessage } from '../types/mail';

interface EmailDetailProps {
  email: EmailMessage | null;
  threadMessages: EmailMessage[];
  isLoadingThread: boolean;
  onBack: () => void;
  onToggleStar: (email: EmailMessage) => void;
  onToggleUnread: (email: EmailMessage) => void;
  onArchive: (email: EmailMessage) => void;
  onTrash: (email: EmailMessage) => void;
  onReply: (email: EmailMessage, isReplyAll?: boolean) => void;
  onForward: (email: EmailMessage) => void;
  onQuickSendReply: (body: string) => Promise<void>;
  isSendingQuickReply: boolean;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  threadMessages,
  isLoadingThread,
  onBack,
  onToggleStar,
  onToggleUnread,
  onArchive,
  onTrash,
  onReply,
  onForward,
  onQuickSendReply,
  isSendingQuickReply,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Resize iframe when content changes
  useEffect(() => {
    if (!iframeRef.current || !email?.bodyHtml) return;

    const iframe = iframeRef.current;
    const handleLoad = () => {
      try {
        if (iframe.contentWindow?.document?.body) {
          const height = iframe.contentWindow.document.body.scrollHeight;
          iframe.style.height = `${Math.max(height + 20, 240)}px`;
        }
      } catch {
        // Sandboxed security limitation, keep standard height
        iframe.style.height = '480px';
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [email?.bodyHtml]);

  if (!email) {
    return (
      <div className="h-full flex-1 flex flex-col items-center justify-center bg-[#0c0d0f] text-neutral-500 p-8 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-center text-neutral-600 mb-3">
          <Mail className="w-5 h-5 stroke-[1.5]" />
        </div>
        <p className="text-sm font-medium text-neutral-300">Select an email to read</p>
        <p className="text-xs text-neutral-500 max-w-xs mt-1">
          Select any conversation from your unified inbox to view message contents securely.
        </p>
      </div>
    );
  }

  // Pre-process HTML content for iframe to ensure dark mode readability and safety
  const safeIframeDoc = email.bodyHtml ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <base target="_blank">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #d1d5db;
            background-color: transparent;
            margin: 0;
            padding: 8px 4px;
            font-size: 14px;
            line-height: 1.6;
            word-break: break-word;
          }
          a { color: #60a5fa; text-decoration: underline; }
          img { max-width: 100% !important; height: auto !important; border-radius: 6px; }
          pre, code { font-family: monospace; background: #1f2937; padding: 2px 4px; border-radius: 4px; }
          blockquote { border-left: 2px solid #4b5563; margin-left: 0; padding-left: 12px; color: #9ca3af; }
          table { max-width: 100% !important; }
        </style>
      </head>
      <body>
        ${email.bodyHtml}
      </body>
    </html>
  ` : '';

  const handleQuickReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReplyText.trim() || isSendingQuickReply) return;
    await onQuickSendReply(quickReplyText);
    setQuickReplyText('');
  };

  const senderInitials = email.fromName
    ? email.fromName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : email.fromEmail?.[0]?.toUpperCase() || '?';

  return (
    <div className="h-full flex-1 flex flex-col bg-[#0c0d0f] text-neutral-200 overflow-y-auto">
      {/* Top Action Header */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-[#0c0d0f]/95 backdrop-blur-md border-b border-neutral-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Mobile Back button */}
          <button
            onClick={onBack}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Back to inbox"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Quick folder action buttons */}
          <button
            onClick={() => onArchive(email)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={() => onTrash(email)}
            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Move to Trash"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleUnread(email)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title={email.isUnread ? 'Mark as Read' : 'Mark as Unread'}
          >
            <Mail className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleStar(email)}
            className="p-1.5 text-neutral-400 hover:text-amber-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title={email.isStarred ? 'Starred' : 'Not starred'}
          >
            <Star className={`w-4 h-4 ${email.isStarred ? 'fill-amber-400 text-amber-400' : 'fill-none'}`} />
          </button>
        </div>

        {/* Right side reply action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onReply(email, false)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reply</span>
          </button>

          {email.cc && (
            <button
              onClick={() => onReply(email, true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
            >
              <ReplyAll className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reply All</span>
            </button>
          )}

          <button
            onClick={() => onForward(email)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
          >
            <Forward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Forward</span>
          </button>
        </div>
      </div>

      {/* Main Email Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Subject & Label Badges */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white leading-snug">
            {email.subject}
          </h1>

          <div className="flex flex-wrap items-center gap-1.5">
            {email.labelIds.map(label => {
              // Hide internal noise
              if (['UNREAD', 'STARRED'].includes(label)) return null;
              return (
                <span
                  key={label}
                  className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wide bg-neutral-900 border border-neutral-800 text-neutral-400"
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sender details Card */}
        <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700/80 text-white font-medium text-xs flex items-center justify-center shrink-0">
                {senderInitials}
              </div>

              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">
                    {email.fromName || email.fromEmail}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono truncate">
                    &lt;{email.fromEmail}&gt;
                  </span>
                </div>

                <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                  <span>to {email.to ? email.to.split('<')[0] : 'me'}</span>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="p-0.5 hover:text-neutral-200 transition-colors inline-flex items-center"
                  >
                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-mono text-neutral-400">
                {email.date}
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 mt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Collapsible Full Headers */}
          {showDetails && (
            <div className="pt-3 border-t border-neutral-800/80 text-xs font-mono text-neutral-400 space-y-1">
              <div><strong className="text-neutral-300">From:</strong> {email.from}</div>
              <div><strong className="text-neutral-300">To:</strong> {email.to}</div>
              {email.cc && <div><strong className="text-neutral-300">Cc:</strong> {email.cc}</div>}
              <div><strong className="text-neutral-300">Date:</strong> {email.date}</div>
              <div><strong className="text-neutral-300">Message ID:</strong> {email.id}</div>
              <div className="pt-1 flex items-center gap-3 text-[11px]">
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  className="flex items-center gap-1 text-blue-400 hover:underline"
                >
                  <Code2 className="w-3 h-3" />
                  <span>{showRawText ? 'Show HTML View' : 'Show Plain Text'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Attachments Section if present */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
              <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
              <span>Attachments ({email.attachments.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {email.attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300"
                >
                  <div className="truncate min-w-0 pr-2">
                    <div className="font-medium truncate">{att.filename}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {(att.size / 1024).toFixed(1)} KB • {att.mimeType}
                    </div>
                  </div>
                  <span className="p-1 text-neutral-500 text-[10px] font-mono">
                    Secured
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Body: Sandboxed Secure Iframe or Clean Plain Text */}
        <div className="pt-2">
          {showRawText || !email.bodyHtml ? (
            <div className="prose prose-invert max-w-none text-sm text-neutral-300 leading-relaxed font-sans whitespace-pre-wrap select-text p-2">
              {email.bodyText || email.snippet || '(No content available)'}
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden bg-neutral-950/30 p-2 sm:p-4 border border-neutral-900/60">
              <iframe
                ref={iframeRef}
                srcDoc={safeIframeDoc}
                title="Email Content"
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                className="w-full border-0 min-h-[300px]"
              />
            </div>
          )}
        </div>

        {/* Thread History if multiple messages exist */}
        {threadMessages.length > 1 && (
          <div className="pt-6 border-t border-neutral-800/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Thread History ({threadMessages.length} messages)</span>
            </div>

            <div className="space-y-3">
              {threadMessages
                .filter(m => m.id !== email.id)
                .map(threadMsg => (
                  <div
                    key={threadMsg.id}
                    className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/60 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-neutral-400 font-mono text-[11px]">
                      <span className="font-medium text-neutral-200">{threadMsg.fromName || threadMsg.fromEmail}</span>
                      <span>{threadMsg.date}</span>
                    </div>
                    <div className="text-neutral-300 font-sans leading-relaxed line-clamp-3">
                      {threadMsg.bodyText || threadMsg.snippet}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Minimalist Quick Reply Box */}
        <div className="pt-6 border-t border-neutral-800/80">
          <form onSubmit={handleQuickReplySubmit} className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-1.5 font-medium">
                <Reply className="w-3.5 h-3.5" />
                <span>Quick reply to {email.fromName || email.fromEmail}</span>
              </div>
              <button
                type="button"
                onClick={() => onReply(email, false)}
                className="text-neutral-400 hover:text-white underline text-[11px]"
              >
                Open full editor
              </button>
            </div>

            <div className="relative">
              <textarea
                value={quickReplyText}
                onChange={(e) => setQuickReplyText(e.target.value)}
                placeholder="Write a clear, thoughtful reply..."
                rows={3}
                className="w-full p-3 text-xs bg-neutral-900/80 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-sans leading-relaxed resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={!quickReplyText.trim() || isSendingQuickReply}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-neutral-900 font-medium text-xs hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              >
                <Send className="w-3 h-3" />
                <span>{isSendingQuickReply ? 'Sending...' : 'Send Reply'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
