import { EmailMessage, EmailAttachment, ComposeDraft } from '../types/mail';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Utility for encoding UTF-8 strings into base64url format required by Gmail API
export function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Utility for decoding base64url into UTF-8 text
export function base64UrlToUtf8(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    try {
      return atob(base64);
    } catch {
      return '';
    }
  }
}

// Parse sender into display name and email address
export function parseSender(fromHeader: string): { name: string; email: string } {
  if (!fromHeader) return { name: 'Unknown', email: '' };
  
  // Format: "John Doe <john@example.com>" or "john@example.com"
  const match = fromHeader.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)$/);
  if (match) {
    const name = match[1]?.trim() || match[2]?.trim() || fromHeader;
    const email = match[2]?.trim() || fromHeader;
    return { name, email };
  }
  
  return { name: fromHeader.split('<')[0].trim() || fromHeader, email: fromHeader };
}

// Recursive helper to extract text, html, and attachments from message payload parts
interface ExtractedBody {
  bodyHtml: string;
  bodyText: string;
  attachments: EmailAttachment[];
}

function extractParts(part: any, result: ExtractedBody) {
  if (!part) return;

  const mimeType = (part.mimeType || '').toLowerCase();
  const filename = part.filename;
  const body = part.body;

  if (filename && body?.attachmentId) {
    result.attachments.push({
      filename,
      mimeType,
      size: body.size || 0,
      attachmentId: body.attachmentId,
      partId: part.partId,
    });
  }

  if (body?.data) {
    const decoded = base64UrlToUtf8(body.data);
    if (mimeType === 'text/html' && !result.bodyHtml) {
      result.bodyHtml = decoded;
    } else if (mimeType === 'text/plain' && !result.bodyText) {
      result.bodyText = decoded;
    }
  }

  if (part.parts && Array.isArray(part.parts)) {
    for (const subPart of part.parts) {
      extractParts(subPart, result);
    }
  }
}

export function parseGmailMessage(rawMessage: any): EmailMessage {
  const headers = rawMessage.payload?.headers || [];
  const getHeader = (name: string): string => {
    const h = headers.find((header: any) => header.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
  };

  const from = getHeader('From');
  const { name: fromName, email: fromEmail } = parseSender(from);
  const to = getHeader('To');
  const cc = getHeader('Cc') || undefined;
  const bcc = getHeader('Bcc') || undefined;
  const subject = getHeader('Subject') || '(No Subject)';
  const date = getHeader('Date');

  const extracted: ExtractedBody = {
    bodyHtml: '',
    bodyText: '',
    attachments: [],
  };

  extractParts(rawMessage.payload, extracted);

  // If top-level body has data and wasn't extracted
  if (!extracted.bodyHtml && !extracted.bodyText && rawMessage.payload?.body?.data) {
    const topData = base64UrlToUtf8(rawMessage.payload.body.data);
    const topMime = (rawMessage.payload.mimeType || '').toLowerCase();
    if (topMime === 'text/html') {
      extracted.bodyHtml = topData;
    } else {
      extracted.bodyText = topData;
    }
  }

  const labelIds = rawMessage.labelIds || [];

  return {
    id: rawMessage.id,
    threadId: rawMessage.threadId,
    labelIds,
    snippet: rawMessage.snippet ? unescapeHtmlEntities(rawMessage.snippet) : '',
    historyId: rawMessage.historyId,
    internalDate: rawMessage.internalDate,
    sizeEstimate: rawMessage.sizeEstimate,
    from,
    fromName,
    fromEmail,
    to,
    cc,
    bcc,
    subject,
    date,
    bodyHtml: extracted.bodyHtml || undefined,
    bodyText: extracted.bodyText || undefined,
    isUnread: labelIds.includes('UNREAD'),
    isStarred: labelIds.includes('STARRED'),
    isImportant: labelIds.includes('IMPORTANT'),
    isDraft: labelIds.includes('DRAFT'),
    attachments: extracted.attachments,
  };
}

function unescapeHtmlEntities(str: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

// Fetch list of messages
export async function listGmailMessages(
  accessToken: string,
  options: {
    query?: string;
    labelIds?: string[];
    pageToken?: string;
    maxResults?: number;
  } = {}
): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string; resultSizeEstimate?: number }> {
  const params = new URLSearchParams();
  if (options.maxResults) params.set('maxResults', options.maxResults.toString());
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (options.query) params.set('q', options.query);
  if (options.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach(id => params.append('labelIds', id));
  }

  const url = `${GMAIL_API_BASE}/messages?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to list messages (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  return {
    messages: data.messages || [],
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate,
  };
}

// Fetch single message detail
export async function getGmailMessage(accessToken: string, id: string): Promise<EmailMessage> {
  const url = `${GMAIL_API_BASE}/messages/${id}?format=full`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to fetch message ${id} (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  return parseGmailMessage(data);
}

// Fetch batch of message details (with concurrency limit to avoid rate limits)
export async function getGmailMessagesBatch(
  accessToken: string,
  messageRefs: { id: string; threadId: string }[],
  concurrency = 8
): Promise<EmailMessage[]> {
  const results: EmailMessage[] = [];
  const queue = [...messageRefs];

  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      try {
        const msg = await getGmailMessage(accessToken, item.id);
        results.push(msg);
      } catch (err) {
        console.warn(`Could not load message ${item.id}:`, err);
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, messageRefs.length) }, () => worker());
  await Promise.all(workers);

  // Sort by internal date descending
  return results.sort((a, b) => {
    const dateA = parseInt(a.internalDate || '0', 10);
    const dateB = parseInt(b.internalDate || '0', 10);
    return dateB - dateA;
  });
}

// Fetch thread messages
export async function getGmailThread(accessToken: string, threadId: string): Promise<EmailMessage[]> {
  const url = `${GMAIL_API_BASE}/threads/${threadId}?format=full`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to fetch thread ${threadId}: ${errorBody}`);
  }

  const data = await res.json();
  const messages = (data.messages || []).map((raw: any) => parseGmailMessage(raw));
  return messages.sort((a: EmailMessage, b: EmailMessage) => {
    return parseInt(a.internalDate || '0', 10) - parseInt(b.internalDate || '0', 10);
  });
}

// Modify message labels (Star, Mark as Read, Archive, etc.)
export async function modifyGmailMessageLabels(
  accessToken: string,
  id: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<void> {
  const url = `${GMAIL_API_BASE}/messages/${id}/modify`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addLabelIds,
      removeLabelIds,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to modify message labels: ${errorBody}`);
  }
}

// Batch modify message labels
export async function batchModifyGmailLabels(
  accessToken: string,
  ids: string[],
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<void> {
  if (ids.length === 0) return;
  const url = `${GMAIL_API_BASE}/messages/batchModify`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ids,
      addLabelIds,
      removeLabelIds,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to batch modify labels: ${errorBody}`);
  }
}

// Move message to trash
export async function trashGmailMessage(accessToken: string, id: string): Promise<void> {
  const url = `${GMAIL_API_BASE}/messages/${id}/trash`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to trash message: ${errorBody}`);
  }
}

// Restore message from trash
export async function untrashGmailMessage(accessToken: string, id: string): Promise<void> {
  const url = `${GMAIL_API_BASE}/messages/${id}/untrash`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to restore message: ${errorBody}`);
  }
}

// Permanently delete message
export async function deleteGmailMessage(accessToken: string, id: string): Promise<void> {
  const url = `${GMAIL_API_BASE}/messages/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to permanently delete message: ${errorBody}`);
  }
}

// Construct RFC 2822 email formatted string
export function buildRfc2822Message(draft: ComposeDraft): string {
  const headers: string[] = [
    `To: ${draft.to}`,
    `Subject: =?UTF-8?B?${utf8ToBase64Url(draft.subject).replace(/-/g, '+').replace(/_/g, '/')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
  ];

  if (draft.cc) headers.push(`Cc: ${draft.cc}`);
  if (draft.bcc) headers.push(`Bcc: ${draft.bcc}`);
  if (draft.inReplyTo) headers.push(`In-Reply-To: ${draft.inReplyTo}`);
  if (draft.references) headers.push(`References: ${draft.references}`);

  // Normalize line breaks in body to HTML paragraphs or break tags if plain text
  let htmlBody = draft.body;
  if (!/<[a-z][\s\S]*>/i.test(draft.body)) {
    htmlBody = draft.body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
  }

  return `${headers.join('\r\n')}\r\n\r\n${htmlBody}`;
}

// Send an email
export async function sendGmailMessage(
  accessToken: string,
  draft: ComposeDraft
): Promise<{ id: string; threadId: string }> {
  const rawMessage = buildRfc2822Message(draft);
  const base64UrlMessage = utf8ToBase64Url(rawMessage);

  const payload: any = {
    raw: base64UrlMessage,
  };
  if (draft.threadId) {
    payload.threadId = draft.threadId;
  }

  const url = `${GMAIL_API_BASE}/messages/send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to send email (${res.status}): ${errorBody}`);
  }

  return await res.json();
}

// Create / Save a draft
export async function createGmailDraft(
  accessToken: string,
  draft: ComposeDraft
): Promise<any> {
  const rawMessage = buildRfc2822Message(draft);
  const base64UrlMessage = utf8ToBase64Url(rawMessage);

  const payload: any = {
    message: {
      raw: base64UrlMessage,
    },
  };
  if (draft.threadId) {
    payload.message.threadId = draft.threadId;
  }

  const url = `${GMAIL_API_BASE}/drafts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to save draft (${res.status}): ${errorBody}`);
  }

  return await res.json();
}

// Get user profile (email address and total messages)
export async function getGmailProfile(accessToken: string): Promise<{ emailAddress: string; messagesTotal: number }> {
  const url = `${GMAIL_API_BASE}/profile`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to get Gmail profile: ${errorBody}`);
  }

  return await res.json();
}
