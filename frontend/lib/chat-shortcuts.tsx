'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './auth';

// Default shortcuts for new users
export const defaultShortcuts: Shortcut[] = [
  {
    id: 'plan-feature',
    label: 'Plan a new feature',
    text: "I'd like to plan a new feature",
  },
  {
    id: 'commit-merge',
    label: 'Commit, PR & merge',
    text: 'Looks great, please commit, PR and merge this',
  },
  {
    id: 'create-issue',
    label: 'Create an issue',
    text: 'Please create an issue for this',
  },
];

// Constraints
export const MAX_SHORTCUTS = 10;
export const MAX_LABEL_LENGTH = 50;
export const MAX_TEXT_LENGTH = 1000;

export interface Shortcut {
  id: string;
  label: string;
  text: string;
}

interface ChatShortcutsContextType {
  shortcuts: Shortcut[];
  pendingShortcut: string | null;
  selectShortcut: (text: string) => void;
  clearPendingShortcut: () => void;
  isInChatContext: boolean;
  setIsInChatContext: (value: boolean) => void;
}

const ChatShortcutsContext = createContext<ChatShortcutsContextType | null>(null);

export function ChatShortcutsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pendingShortcut, setPendingShortcut] = useState<string | null>(null);
  const [isInChatContext, setIsInChatContext] = useState(false);

  // Use user's custom shortcuts if available, otherwise use defaults
  const shortcuts = user?.settings?.shortcuts?.length
    ? user.settings.shortcuts
    : defaultShortcuts;

  const selectShortcut = useCallback((text: string) => {
    setPendingShortcut(text);
  }, []);

  const clearPendingShortcut = useCallback(() => {
    setPendingShortcut(null);
  }, []);

  return (
    <ChatShortcutsContext.Provider
      value={{
        shortcuts,
        pendingShortcut,
        selectShortcut,
        clearPendingShortcut,
        isInChatContext,
        setIsInChatContext,
      }}
    >
      {children}
    </ChatShortcutsContext.Provider>
  );
}

export function useChatShortcuts() {
  const context = useContext(ChatShortcutsContext);
  if (!context) {
    throw new Error('useChatShortcuts must be used within a ChatShortcutsProvider');
  }
  return context;
}

