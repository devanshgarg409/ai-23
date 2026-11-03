import React from 'react';
import { 
  Inbox, 
  Star, 
  Send, 
  FileText, 
  Trash2, 
  AlertOctagon, 
  Archive, 
  Plus, 
  Tag, 
  LogOut, 
  ChevronRight,
  Sparkles,
  Command,
  HelpCircle
} from 'lucide-react';
import { MailFolder, CategoryFilter } from '../types/mail';

interface SidebarProps {
  currentFolder: MailFolder;
  onSelectFolder: (folder: MailFolder) => void;
  currentCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
  onComposeClick: () => void;
  unreadCount?: number;
  userEmail?: string | null;
  userName?: string | null;
  userPhoto?: string | null;
  onSignOut: () => void;
  onOpenShortcuts: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  onSelectFolder,
  currentCategory,
  onSelectCategory,
  onComposeClick,
  unreadCount = 0,
  userEmail,
  userName,
  userPhoto,
  onSignOut,
  onOpenShortcuts,
  isMobileOpen,
  onCloseMobile,
}) => {
  const folders: { id: MailFolder; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'INBOX', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'STARRED', label: 'Starred', icon: <Star className="w-4 h-4" /> },
    { id: 'SENT', label: 'Sent', icon: <Send className="w-4 h-4" /> },
    { id: 'DRAFT', label: 'Drafts', icon: <FileText className="w-4 h-4" /> },
    { id: 'ALL', label: 'All Mail', icon: <Archive className="w-4 h-4" /> },
    { id: 'SPAM', label: 'Spam', icon: <AlertOctagon className="w-4 h-4" /> },
    { id: 'TRASH', label: 'Trash', icon: <Trash2 className="w-4 h-4" /> },
  ];

  const categories: { id: CategoryFilter; label: string; dotColor: string }[] = [
    { id: 'ALL', label: 'All Messages', dotColor: 'bg-neutral-400' },
    { id: 'CATEGORY_PERSONAL', label: 'Primary', dotColor: 'bg-blue-400' },
    { id: 'CATEGORY_UPDATES', label: 'Updates', dotColor: 'bg-amber-400' },
    { id: 'CATEGORY_PROMOTIONS', label: 'Promotions', dotColor: 'bg-emerald-400' },
    { id: 'CATEGORY_SOCIAL', label: 'Social', dotColor: 'bg-purple-400' },
  ];

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : (userEmail?.[0] || 'U').toUpperCase();

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#121316] text-neutral-300 border-r border-neutral-800/80 w-64 select-none">
      {/* Top Brand & Compose */}
      <div className="p-4 space-y-4">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-white">
              <span className="text-xs font-semibold tracking-wider font-mono">Æ</span>
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-white block">AetherMail</span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-tight">Unified Inbox</span>
            </div>
          </div>
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            className="p-1.5 text-neutral-500 hover:text-neutral-300 rounded-md hover:bg-neutral-800/60 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Compose Button */}
        <button
          onClick={() => {
            onComposeClick();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white text-neutral-900 font-medium text-xs hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Message</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-200 font-mono text-neutral-700 border border-neutral-300">
            C
          </kbd>
        </button>

        {/* Navigation Folders */}
        <div className="space-y-0.5 pt-2">
          <div className="px-3 pb-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Folders
          </div>
          {folders.map(folder => {
            const isActive = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => {
                  onSelectFolder(folder.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-normal transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-white' : 'text-neutral-400'}>
                    {folder.icon}
                  </span>
                  <span className="truncate">{folder.label}</span>
                </div>
                {folder.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                    isActive ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {folder.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Categories (active when folder is INBOX) */}
        {currentFolder === 'INBOX' && (
          <div className="space-y-0.5 pt-3 border-t border-neutral-800/60">
            <div className="px-3 pb-1 flex items-center justify-between text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              <span>Categories</span>
              <Tag className="w-3 h-3 text-neutral-400" />
            </div>
            {categories.map(cat => {
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-neutral-800/80 text-white font-medium'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`w-2 h-2 rounded-full ${cat.dotColor}`}></span>
                    <span className="truncate">{cat.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User info & Sign out */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/40">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-neutral-800/50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName || 'User'}
                className="w-8 h-8 rounded-full border border-neutral-700 object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs flex items-center justify-center font-medium shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-medium text-neutral-200 truncate">
                {userName || 'Connected Account'}
              </div>
              <div className="text-[11px] text-neutral-400 truncate font-mono">
                {userEmail || 'Active session'}
              </div>
            </div>
          </div>

          <button
            onClick={onSignOut}
            title="Sign Out"
            className="p-1.5 text-neutral-400 hover:text-rose-300 rounded-lg hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block h-screen shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full w-64 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
