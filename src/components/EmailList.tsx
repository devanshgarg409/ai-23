import React from 'react';
import { 
  Search, 
  RefreshCw, 
  Star, 
  Paperclip, 
  Trash2, 
  Mail, 
  MailOpen, 
  Archive, 
  CheckSquare, 
  Square, 
  MinusSquare,
  AlertCircle,
  Filter,
  X,
  Menu
} from 'lucide-react';
import { EmailMessage, MailFolder } from '../types/mail';

interface EmailListProps {
  emails: EmailMessage[];
  selectedEmailId: string | null;
  onSelectEmail: (email: EmailMessage) => void;
  isLoading: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  currentFolder: MailFolder;
  filterUnreadOnly: boolean;
  onToggleUnreadFilter: () => void;
  filterStarredOnly: boolean;
  onToggleStarredFilter: () => void;
  filterAttachmentsOnly: boolean;
  onToggleAttachmentsFilter: () => void;
  onToggleStar: (e: React.MouseEvent, email: EmailMessage) => void;
  onArchiveEmail?: (email: EmailMessage) => void;
  onTrashEmail?: (email: EmailMessage) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  selectedIds: Set<string>;
  onToggleSelectAll: () => void;
  onToggleSelectItem: (e: React.MouseEvent, id: string) => void;
  onBatchMarkRead: (read: boolean) => void;
  onBatchTrash: () => void;
  onBatchArchive: () => void;
  onOpenMobileMenu: () => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  isLoading,
  onRefresh,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  currentFolder,
  filterUnreadOnly,
  onToggleUnreadFilter,
  filterStarredOnly,
  onToggleStarredFilter,
  filterAttachmentsOnly,
  onToggleAttachmentsFilter,
  onToggleStar,
  onArchiveEmail,
  onTrashEmail,
  hasMore,
  onLoadMore,
  isLoadingMore,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectItem,
  onBatchMarkRead,
  onBatchTrash,
  onBatchArchive,
  onOpenMobileMenu,
}) => {
  // Format date minimally
  const formatEmailDate = (dateStr: string, internalDate?: string): string => {
    try {
      const d = internalDate ? new Date(parseInt(internalDate, 10)) : new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr || '';

      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const isThisYear = d.getFullYear() === now.getFullYear();

      if (isToday) {
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      } else if (isThisYear) {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        return d.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
      }
    } catch {
      return dateStr || '';
    }
  };

  const getFolderTitle = (folder: MailFolder): string => {
    switch (folder) {
      case 'INBOX': return 'Unified Inbox';
      case 'STARRED': return 'Starred Messages';
      case 'SENT': return 'Sent Mail';
      case 'DRAFT': return 'Drafts';
      case 'TRASH': return 'Trash';
      case 'SPAM': return 'Spam';
      case 'ALL': return 'All Messages';
      default: return 'Inbox';
    }
  };

  const allSelected = emails.length > 0 && selectedIds.size === emails.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < emails.length;

  return (
    <div className="h-full flex flex-col bg-[#0e0f12] text-neutral-200 border-r border-neutral-800/80 w-full select-none">
      {/* Top Search & Controls Bar */}
      <div className="p-3.5 border-b border-neutral-800/80 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger menu */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Open folder navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit();
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search mail or 'from:user is:unread'..."
                className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors font-sans"
              />
            </form>
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  onSearchSubmit();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh emails"
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-neutral-300' : ''}`} />
          </button>
        </div>

        {/* Filter chips & folder title */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-medium text-neutral-400 mr-1 hidden sm:inline">
              {getFolderTitle(currentFolder)}
            </span>

            <button
              onClick={onToggleUnreadFilter}
              className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors cursor-pointer ${
                filterUnreadOnly
                  ? 'bg-neutral-800 text-white border-neutral-600 font-medium'
                  : 'text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-300'
              }`}
            >
              Unread
            </button>

            <button
              onClick={onToggleStarredFilter}
              className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors cursor-pointer ${
                filterStarredOnly
                  ? 'bg-neutral-800 text-amber-300 border-neutral-600 font-medium'
                  : 'text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-300'
              }`}
            >
              Starred
            </button>

            <button
              onClick={onToggleAttachmentsFilter}
              className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors cursor-pointer ${
                filterAttachmentsOnly
                  ? 'bg-neutral-800 text-white border-neutral-600 font-medium'
                  : 'text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-300'
              }`}
            >
              Has Attachment
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-400 shrink-0">
            {emails.length} {emails.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Batch selection toolbar when items are selected */}
        {selectedIds.size > 0 && (
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs bg-neutral-900/60 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSelectAll}
                className="text-neutral-300 hover:text-white"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-white" />
                ) : someSelected ? (
                  <MinusSquare className="w-4 h-4 text-white" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-400" />
                )}
              </button>
              <span className="text-neutral-300 font-mono text-[11px]">
                {selectedIds.size} selected
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onBatchMarkRead(true)}
                title="Mark as Read"
                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              >
                <MailOpen className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onBatchMarkRead(false)}
                title="Mark as Unread"
                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
              {currentFolder === 'INBOX' && (
                <button
                  onClick={onBatchArchive}
                  title="Archive"
                  className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onBatchTrash}
                title="Move to Trash"
                className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-neutral-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email Items Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-900/70">
        {isLoading && emails.length === 0 ? (
          /* Loading skeleton */
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse flex items-start gap-3 p-3 rounded-lg bg-neutral-900/30">
                <div className="w-4 h-4 bg-neutral-800 rounded mt-0.5 shrink-0" />
                <div className="w-4 h-4 bg-neutral-800 rounded mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-28 bg-neutral-800 rounded" />
                    <div className="h-3 w-12 bg-neutral-800 rounded" />
                  </div>
                  <div className="h-3.5 w-3/4 bg-neutral-800/80 rounded" />
                  <div className="h-2.5 w-full bg-neutral-800/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : emails.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
              <Mail className="w-5 h-5 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium text-neutral-300">No messages found</p>
            <p className="text-xs text-neutral-400 max-w-xs mt-1">
              {searchQuery
                ? `No emails match "${searchQuery}". Try refining your search query.`
                : 'Your inbox folder is clear. Enjoy the focus.'}
            </p>
          </div>
        ) : (
          emails.map(email => {
            const isSelected = selectedEmailId === email.id;
            const isChecked = selectedIds.has(email.id);

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`group relative p-3 sm:px-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-neutral-800/90 text-white'
                    : email.isUnread
                    ? 'bg-neutral-900/40 hover:bg-neutral-800/40 text-neutral-100'
                    : 'hover:bg-neutral-900/50 text-neutral-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Select Checkbox */}
                  <div
                    onClick={(e) => onToggleSelectItem(e, email.id)}
                    className="pt-0.5 text-neutral-500 hover:text-neutral-300 shrink-0 cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-white" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                    )}
                  </div>

                  {/* Star Toggle */}
                  <button
                    onClick={(e) => onToggleStar(e, email)}
                    className="pt-0.5 shrink-0 text-neutral-600 hover:text-amber-400 transition-colors cursor-pointer"
                    title={email.isStarred ? 'Starred' : 'Not starred'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        email.isStarred
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-none text-neutral-600 group-hover:text-neutral-400'
                      }`}
                    />
                  </button>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2 truncate">
                        {email.isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${email.isUnread ? 'font-semibold text-white' : 'font-normal text-neutral-300'}`}>
                          {email.fromName || email.fromEmail}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {email.attachments && email.attachments.length > 0 && (
                          <Paperclip className="w-3 h-3 text-neutral-500" />
                        )}
                        <span className="text-[11px] font-mono text-neutral-400">
                          {formatEmailDate(email.date, email.internalDate)}
                        </span>
                      </div>
                    </div>

                    <div className={`text-xs truncate leading-snug ${
                      email.isUnread ? 'font-medium text-neutral-100' : 'text-neutral-300'
                    }`}>
                      {email.subject}
                    </div>

                    <div className="text-[11px] text-neutral-400 truncate mt-0.5 font-normal leading-normal">
                      {email.snippet || '(No preview content)'}
                    </div>
                  </div>
                </div>

                {/* Quick Hover Actions (desktop) */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 rounded-lg p-1 shadow-lg z-10">
                  {currentFolder === 'INBOX' && onArchiveEmail && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveEmail(email);
                      }}
                      title="Archive"
                      className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onTrashEmail && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrashEmail(email);
                      }}
                      title="Move to Trash"
                      className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Load More Button */}
        {hasMore && emails.length > 0 && (
          <div className="p-4 text-center">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoadingMore ? 'Loading more messages...' : 'Load older messages'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
