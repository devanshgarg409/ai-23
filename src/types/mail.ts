export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  partId?: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId?: string;
  internalDate: string;
  sizeEstimate?: number;
  // Parsed fields
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  date: string;
  bodyHtml?: string;
  bodyText?: string;
  isUnread: boolean;
  isStarred: boolean;
  isImportant: boolean;
  isDraft: boolean;
  attachments: EmailAttachment[];
}

export interface EmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages: EmailMessage[];
}

export type MailFolder = 
  | 'INBOX'
  | 'STARRED'
  | 'SENT'
  | 'DRAFT'
  | 'TRASH'
  | 'SPAM'
  | 'ALL';

export type CategoryFilter = 
  | 'ALL'
  | 'CATEGORY_PERSONAL'
  | 'CATEGORY_UPDATES'
  | 'CATEGORY_PROMOTIONS'
  | 'CATEGORY_SOCIAL';

export interface ComposeDraft {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}

export interface ConfirmationDialogConfig {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}
