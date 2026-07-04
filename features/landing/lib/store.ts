import { create } from "zustand";

interface ClipboardState {
  copiedCommand: string | null;
  setCopied: (command: string | null) => void;
}

// Client UI state only, held in Zustand. Consume it with a selector, never by
// destructuring the whole store (see .agents/rules/state.md#stores).
export const useClipboardStore = create<ClipboardState>((set) => ({
  copiedCommand: null,
  setCopied: (command) => {
    set({ copiedCommand: command });
  },
}));
