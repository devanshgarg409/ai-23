import React from 'react';
import { ShieldCheck, Mail, Sparkles, Lock, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#f2f3f5] flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      {/* Top minimal header */}
      <header className="px-6 py-6 border-b border-neutral-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-200">
            <Mail className="w-4 h-4" />
          </div>
          <span className="font-medium tracking-tight text-sm text-neutral-200">AetherMail</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Direct Workspace API
        </div>
      </header>

      {/* Main hero */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/60 text-xs text-neutral-400 mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Client-Side Security • Zero Intermediaries</span>
            </div>
            
            <h1 className="text-3xl font-light tracking-tight text-neutral-100 mb-3">
              Unified Inbox, <span className="font-normal text-white">refined</span>.
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed font-normal">
              A distraction-free, secure email client designed for clarity. Read, search, organize, and compose without clutter.
            </p>
          </div>

          {/* Sign In Box */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-7 shadow-2xl backdrop-blur-sm">
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 text-xs text-neutral-400">
                <Lock className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                <span>
                  Tokens reside exclusively in memory. No database storage of your personal emails.
                </span>
              </div>
              <div className="flex items-start gap-3 text-xs text-neutral-400">
                <Sparkles className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                <span>
                  Fast keyboard-first workflow, sandboxed safe rendering, and unified category filtering.
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg border border-red-900/40 bg-red-950/30 text-red-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Official Google Sign-In Button format mandated by Workspace integration skill */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={onSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white text-neutral-900 font-medium text-sm hover:bg-neutral-100 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md group cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                {!isLoading && (
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>
              
              <p className="mt-4 text-[11px] text-neutral-500 text-center">
                Accesses your Gmail inbox and sent items with your permission via official Google OAuth.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-neutral-900 text-center text-xs text-neutral-500">
        AetherMail • Built with Google Workspace API
      </footer>
    </div>
  );
};
