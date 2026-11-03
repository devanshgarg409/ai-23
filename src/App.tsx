/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './services/firebase';
import { 
  listGmailMessages, 
  getGmailMessagesBatch, 
  getGmailThread, 
  modifyGmailMessageLabels, 
  batchModifyGmailLabels, 
  trashGmailMessage, 
  sendGmailMessage, 
  createGmailDraft, 
  getGmailProfile 
} from './services/gmail';
import { 
  EmailMessage, 
  MailFolder, 
  CategoryFilter, 
  ComposeDraft, 
  ConfirmationDialogConfig 
} from './types/mail';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { ComposeModal } from './components/ComposeModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Folder & Category navigation
  const [currentFolder, setCurrentFolder] = useState<MailFolder>('INBOX');
  const [currentCategory, setCurrentCategory] = useState<CategoryFilter>('ALL');

  // Messages state
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [threadMessages, setThreadMessages] = useState<EmailMessage[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [filterAttachmentsOnly, setFilterAttachmentsOnly] = useState(false);

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Compose & Reply
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState<Partial<ComposeDraft>>({});
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingQuickReply, setIsSendingQuickReply] = useState(false);

  // Confirmation Modal
  const [confirmationConfig, setConfirmationConfig] = useState<ConfirmationDialogConfig | null>(null);

  // UI helpers
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Login
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Failed to authenticate:', err);
      setAuthError(err.message || 'Google authentication was cancelled or failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setEmails([]);
    setSelectedEmail(null);
    setNeedsAuth(true);
  };

  // Build Gmail Search Query from folder, category, and user query
  const buildQuery = useCallback((): { labelIds?: string[]; query?: string } => {
    const labelIds: string[] = [];
    const queryParts: string[] = [];

    // Folder routing
    switch (currentFolder) {
      case 'INBOX':
        labelIds.push('INBOX');
        break;
      case 'STARRED':
        labelIds.push('STARRED');
        break;
      case 'SENT':
        labelIds.push('SENT');
        break;
      case 'DRAFT':
        labelIds.push('DRAFT');
        break;
      case 'TRASH':
        labelIds.push('TRASH');
        break;
      case 'SPAM':
        labelIds.push('SPAM');
        break;
      case 'ALL':
        // ALL Mail doesn't restrict by folder label
        break;
    }

    // Category filter (if folder is INBOX)
    if (currentFolder === 'INBOX' && currentCategory !== 'ALL') {
      labelIds.push(currentCategory);
    }

    // Unread toggle
    if (filterUnreadOnly) {
      queryParts.push('is:unread');
    }

    // Starred toggle
    if (filterStarredOnly && currentFolder !== 'STARRED') {
      queryParts.push('is:starred');
    }

    // Attachment toggle
    if (filterAttachmentsOnly) {
      queryParts.push('has:attachment');
    }

    // Custom text search query
    if (submittedQuery.trim()) {
      queryParts.push(submittedQuery.trim());
    }

    return {
      labelIds: labelIds.length > 0 ? labelIds : undefined,
      query: queryParts.length > 0 ? queryParts.join(' ') : undefined,
    };
  }, [
    currentFolder, 
    currentCategory, 
    filterUnreadOnly, 
    filterStarredOnly, 
    filterAttachmentsOnly, 
    submittedQuery
  ]);

  // Load emails
  const loadEmails = useCallback(async (resetSelection = true) => {
    if (!token) return;

    setIsLoadingEmails(true);
    setSelectedIds(new Set());
    if (resetSelection) {
      setSelectedEmail(null);
      setThreadMessages([]);
    }

    try {
      const { labelIds, query } = buildQuery();
      const listRes = await listGmailMessages(token, {
        labelIds,
        query,
        maxResults: 20,
      });

      setNextPageToken(listRes.nextPageToken);

      if (listRes.messages && listRes.messages.length > 0) {
        const fullMessages = await getGmailMessagesBatch(token, listRes.messages);
        setEmails(fullMessages);
        
        // Count unread in inbox
        if (currentFolder === 'INBOX') {
          const unread = fullMessages.filter(m => m.isUnread).length;
          setUnreadCount(unread);
        }
      } else {
        setEmails([]);
        if (currentFolder === 'INBOX') setUnreadCount(0);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      if (err.message && err.message.includes('401')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoadingEmails(false);
    }
  }, [token, buildQuery, currentFolder]);

  // Trigger load when folder/category/filter changes
  useEffect(() => {
    if (token) {
      loadEmails();
    }
  }, [token, currentFolder, currentCategory, filterUnreadOnly, filterStarredOnly, filterAttachmentsOnly, submittedQuery]);

  // Load older messages (pagination)
  const handleLoadMore = async () => {
    if (!token || !nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const { labelIds, query } = buildQuery();
      const listRes = await listGmailMessages(token, {
        labelIds,
        query,
        pageToken: nextPageToken,
        maxResults: 20,
      });

      setNextPageToken(listRes.nextPageToken);

      if (listRes.messages && listRes.messages.length > 0) {
        const olderMessages = await getGmailMessagesBatch(token, listRes.messages);
        setEmails(prev => {
          // Avoid duplicate messages
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = olderMessages.filter(m => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (err) {
      console.error('Error loading older messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Select an email and load thread
  const handleSelectEmail = async (email: EmailMessage) => {
    setSelectedEmail(email);

    // If unread, mark as read automatically in Gmail & local state
    if (email.isUnread && token) {
      setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isUnread: false } : m));
      modifyGmailMessageLabels(token, email.id, [], ['UNREAD']).catch(err => {
        console.warn('Failed to mark read on server:', err);
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Fetch full thread messages
    if (token && email.threadId) {
      setIsLoadingThread(true);
      try {
        const thread = await getGmailThread(token, email.threadId);
        setThreadMessages(thread);
      } catch (err) {
        console.warn('Failed to fetch thread:', err);
        setThreadMessages([email]);
      } finally {
        setIsLoadingThread(false);
      }
    } else {
      setThreadMessages([email]);
    }
  };

  // Toggle Star
  const handleToggleStar = async (e: React.MouseEvent | null, email: EmailMessage) => {
    if (e) e.stopPropagation();
    if (!token) return;

    const newStarred = !email.isStarred;
    // Optimistic update
    setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isStarred: newStarred } : m));
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(prev => prev ? { ...prev, isStarred: newStarred } : null);
    }

    try {
      if (newStarred) {
        await modifyGmailMessageLabels(token, email.id, ['STARRED'], []);
      } else {
        await modifyGmailMessageLabels(token, email.id, [], ['STARRED']);
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
      // Revert on failure
      setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isStarred: !newStarred } : m));
    }
  };

  // Toggle Read / Unread
  const handleToggleUnread = async (email: EmailMessage) => {
    if (!token) return;

    const newUnread = !email.isUnread;
    setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isUnread: newUnread } : m));
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(prev => prev ? { ...prev, isUnread: newUnread } : null);
    }
    setUnreadCount(prev => newUnread ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (newUnread) {
        await modifyGmailMessageLabels(token, email.id, ['UNREAD'], []);
      } else {
        await modifyGmailMessageLabels(token, email.id, [], ['UNREAD']);
      }
    } catch (err) {
      console.error('Failed to toggle read state:', err);
      setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isUnread: !newUnread } : m));
    }
  };

  // Archive (remove INBOX label)
  const handleArchive = async (email: EmailMessage) => {
    if (!token) return;

    // Optimistically remove from list if in inbox
    if (currentFolder === 'INBOX') {
      setEmails(prev => prev.filter(m => m.id !== email.id));
      if (selectedEmail?.id === email.id) setSelectedEmail(null);
    }

    try {
      await modifyGmailMessageLabels(token, email.id, [], ['INBOX']);
    } catch (err) {
      console.error('Failed to archive email:', err);
      loadEmails(false);
    }
  };

  // Trash Single Email (Mandatory confirmation dialog)
  const handleTrashRequest = (email: EmailMessage) => {
    setConfirmationConfig({
      isOpen: true,
      title: 'Move Email to Trash?',
      description: `Are you sure you want to move the conversation "${email.subject}" from ${email.fromName || email.fromEmail} to Trash?`,
      confirmLabel: 'Move to Trash',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        if (!token) return;
        setEmails(prev => prev.filter(m => m.id !== email.id));
        if (selectedEmail?.id === email.id) setSelectedEmail(null);
        try {
          await trashGmailMessage(token, email.id);
        } catch (err) {
          console.error('Failed to trash email:', err);
          loadEmails(false);
        }
      },
    });
  };

  // Multi-select actions
  const handleToggleSelectAll = () => {
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map(e => e.id)));
    }
  };

  const handleToggleSelectItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Batch Mark Read/Unread
  const handleBatchMarkRead = async (markAsRead: boolean) => {
    if (!token || selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    setEmails(prev => prev.map(m => ids.includes(m.id) ? { ...m, isUnread: !markAsRead } : m));
    setSelectedIds(new Set());

    try {
      if (markAsRead) {
        await batchModifyGmailLabels(token, ids, [], ['UNREAD']);
      } else {
        await batchModifyGmailLabels(token, ids, ['UNREAD'], []);
      }
    } catch (err) {
      console.error('Batch modify failed:', err);
      loadEmails(false);
    }
  };

  // Batch Trash with Confirmation
  const handleBatchTrash = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;

    setConfirmationConfig({
      isOpen: true,
      title: `Move ${count} message(s) to Trash?`,
      description: `This will move all ${count} selected messages to the Trash folder.`,
      confirmLabel: `Move ${count} to Trash`,
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        if (!token) return;
        const ids = Array.from(selectedIds);
        setEmails(prev => prev.filter(m => !selectedIds.has(m.id)));
        if (selectedEmail && selectedIds.has(selectedEmail.id)) setSelectedEmail(null);
        setSelectedIds(new Set());

        try {
          for (const id of ids) {
            await trashGmailMessage(token, id);
          }
        } catch (err) {
          console.error('Batch trash error:', err);
          loadEmails(false);
        }
      },
    });
  };

  // Batch Archive with Confirmation
  const handleBatchArchive = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;

    setConfirmationConfig({
      isOpen: true,
      title: `Archive ${count} message(s)?`,
      description: `This will remove the Inbox label from all ${count} selected conversations.`,
      confirmLabel: `Archive ${count} items`,
      cancelLabel: 'Cancel',
      isDestructive: false,
      onConfirm: async () => {
        if (!token) return;
        const ids = Array.from(selectedIds);
        setEmails(prev => prev.filter(m => !selectedIds.has(m.id)));
        if (selectedEmail && selectedIds.has(selectedEmail.id)) setSelectedEmail(null);
        setSelectedIds(new Set());

        try {
          await batchModifyGmailLabels(token, ids, [], ['INBOX']);
        } catch (err) {
          console.error('Batch archive error:', err);
          loadEmails(false);
        }
      },
    });
  };

  // Reply handlers
  const handleReply = (email: EmailMessage, isReplyAll = false) => {
    const to = email.fromEmail;
    let cc = undefined;
    if (isReplyAll && email.cc) {
      cc = email.cc;
    }
    const subject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;

    setComposeDraft({
      to,
      cc,
      subject,
      body: `\n\nOn ${email.date}, ${email.fromName || email.fromEmail} wrote:\n> ${email.snippet}`,
      inReplyTo: email.id,
      references: email.id,
      threadId: email.threadId,
    });
    setIsComposeOpen(true);
  };

  const handleForward = (email: EmailMessage) => {
    const subject = email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`;

    setComposeDraft({
      to: '',
      subject,
      body: `\n\n---------- Forwarded message ---------\nFrom: ${email.from}\nDate: ${email.date}\nSubject: ${email.subject}\nTo: ${email.to}\n\n${email.bodyText || email.snippet}`,
    });
    setIsComposeOpen(true);
  };

  // Send Email with mandatory explicit Confirmation Dialog
  const handleSendEmailRequest = (draft: ComposeDraft) => {
    setConfirmationConfig({
      isOpen: true,
      title: 'Send Email?',
      description: `Send this email to "${draft.to}" with subject "${draft.subject}"?`,
      confirmLabel: 'Send Now',
      cancelLabel: 'Keep Editing',
      isDestructive: false,
      onConfirm: async () => {
        if (!token) return;
        setIsSendingEmail(true);
        try {
          await sendGmailMessage(token, draft);
          setIsComposeOpen(false);
          setComposeDraft({});
          // Refresh list if in sent folder
          if (currentFolder === 'SENT') {
            loadEmails(false);
          }
        } catch (err: any) {
          alert(`Failed to send email: ${err.message}`);
        } finally {
          setIsSendingEmail(false);
        }
      },
    });
  };

  // Quick Inline Reply with Confirmation
  const handleQuickSendReply = async (body: string) => {
    if (!selectedEmail || !token) return;

    const draft: ComposeDraft = {
      to: selectedEmail.fromEmail,
      subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
      body,
      inReplyTo: selectedEmail.id,
      references: selectedEmail.id,
      threadId: selectedEmail.threadId,
    };

    setConfirmationConfig({
      isOpen: true,
      title: 'Send Quick Reply?',
      description: `Send reply to "${draft.to}"?`,
      confirmLabel: 'Send Reply',
      cancelLabel: 'Cancel',
      isDestructive: false,
      onConfirm: async () => {
        setIsSendingQuickReply(true);
        try {
          await sendGmailMessage(token, draft);
          // Reload thread
          if (selectedEmail.threadId) {
            const updatedThread = await getGmailThread(token, selectedEmail.threadId);
            setThreadMessages(updatedThread);
          }
        } catch (err: any) {
          alert(`Failed to send quick reply: ${err.message}`);
        } finally {
          setIsSendingQuickReply(false);
        }
      },
    });
  };

  // Save Draft
  const handleSaveDraft = async (draft: ComposeDraft) => {
    if (!token) return;
    await createGmailDraft(token, draft);
    if (currentFolder === 'DRAFT') {
      loadEmails(false);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setComposeDraft({});
        setIsComposeOpen(true);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      } else if (e.key === 'Escape') {
        setIsComposeOpen(false);
        setIsShortcutsOpen(false);
        setConfirmationConfig(null);
        if (selectedEmail) setSelectedEmail(null);
      } else if (e.key === 'r' && selectedEmail) {
        e.preventDefault();
        handleReply(selectedEmail, false);
      } else if (e.key === 'a' && selectedEmail) {
        e.preventDefault();
        handleReply(selectedEmail, true);
      } else if (e.key === 'e' && selectedEmail) {
        e.preventDefault();
        handleArchive(selectedEmail);
      } else if (e.key === 's' && selectedEmail) {
        e.preventDefault();
        handleToggleStar(null, selectedEmail);
      } else if (e.key === 'u' && selectedEmail) {
        e.preventDefault();
        handleToggleUnread(selectedEmail);
      } else if ((e.key === '#' || e.key === 'Delete') && selectedEmail) {
        e.preventDefault();
        handleTrashRequest(selectedEmail);
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        // Next email
        e.preventDefault();
        if (emails.length > 0) {
          const currentIndex = selectedEmail ? emails.findIndex(m => m.id === selectedEmail.id) : -1;
          const nextIndex = Math.min(currentIndex + 1, emails.length - 1);
          handleSelectEmail(emails[nextIndex]);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        // Prev email
        e.preventDefault();
        if (emails.length > 0) {
          const currentIndex = selectedEmail ? emails.findIndex(m => m.id === selectedEmail.id) : 1;
          const prevIndex = Math.max(currentIndex - 1, 0);
          handleSelectEmail(emails[prevIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEmail, emails, token]);

  // If not authenticated or token missing, render AuthScreen
  if (needsAuth || !token) {
    return (
      <AuthScreen
        onSignIn={handleSignIn}
        isLoading={isLoggingIn}
        errorMessage={authError}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0d0e] font-sans antialiased">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentFolder={currentFolder}
        onSelectFolder={(folder) => {
          setCurrentFolder(folder);
          setCurrentCategory('ALL');
        }}
        currentCategory={currentCategory}
        onSelectCategory={setCurrentCategory}
        onComposeClick={() => {
          setComposeDraft({});
          setIsComposeOpen(true);
        }}
        unreadCount={unreadCount}
        userEmail={user?.email}
        userName={user?.displayName}
        userPhoto={user?.photoURL}
        onSignOut={handleSignOut}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Work Area (Split Pane or Responsive Layout) */}
      <div className="flex-1 flex min-w-0 h-full">
        {/* Email List Column */}
        <div className={`h-full flex-col ${
          selectedEmail ? 'hidden lg:flex lg:w-96 xl:w-[420px] shrink-0' : 'flex w-full'
        }`}>
          <EmailList
            emails={emails}
            selectedEmailId={selectedEmail?.id || null}
            onSelectEmail={handleSelectEmail}
            isLoading={isLoadingEmails}
            onRefresh={() => loadEmails(false)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => setSubmittedQuery(searchQuery)}
            currentFolder={currentFolder}
            filterUnreadOnly={filterUnreadOnly}
            onToggleUnreadFilter={() => setFilterUnreadOnly(!filterUnreadOnly)}
            filterStarredOnly={filterStarredOnly}
            onToggleStarredFilter={() => setFilterStarredOnly(!filterStarredOnly)}
            filterAttachmentsOnly={filterAttachmentsOnly}
            onToggleAttachmentsFilter={() => setFilterAttachmentsOnly(!filterAttachmentsOnly)}
            onToggleStar={handleToggleStar}
            onArchiveEmail={handleArchive}
            onTrashEmail={handleTrashRequest}
            hasMore={Boolean(nextPageToken)}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
            selectedIds={selectedIds}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectItem={handleToggleSelectItem}
            onBatchMarkRead={handleBatchMarkRead}
            onBatchTrash={handleBatchTrash}
            onBatchArchive={handleBatchArchive}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        </div>

        {/* Email Detail Column */}
        <div className={`h-full flex-1 min-w-0 ${
          selectedEmail ? 'flex' : 'hidden lg:flex'
        }`}>
          <EmailDetail
            email={selectedEmail}
            threadMessages={threadMessages}
            isLoadingThread={isLoadingThread}
            onBack={() => setSelectedEmail(null)}
            onToggleStar={(email) => handleToggleStar(null, email)}
            onToggleUnread={handleToggleUnread}
            onArchive={handleArchive}
            onTrash={handleTrashRequest}
            onReply={handleReply}
            onForward={handleForward}
            onQuickSendReply={handleQuickSendReply}
            isSendingQuickReply={isSendingQuickReply}
          />
        </div>
      </div>

      {/* Compose Modal / Drawer */}
      <ComposeModal
        isOpen={isComposeOpen}
        initialDraft={composeDraft}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmailRequest}
        onSaveDraft={handleSaveDraft}
        isSending={isSendingEmail}
      />

      {/* Confirmation Dialog Modal (Destructive Operations / Sending) */}
      <ConfirmationModal
        config={confirmationConfig}
        onClose={() => setConfirmationConfig(null)}
      />

      {/* Keyboard Shortcuts Cheatsheet */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
