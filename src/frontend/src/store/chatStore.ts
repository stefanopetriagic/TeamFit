import { create } from 'zustand';

export type ChatRole = 'user' | 'assistant';

export interface AllocationProposal {
  type: 'move' | 'add' | 'remove';
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  motivation: string;
  fromProjectId?: string;
  fromProjectName?: string;
  toProjectId?: string;
  toProjectName?: string;
  oreToMove?: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  proposals?: AllocationProposal[];
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  isOpen: boolean;
  addMessage: (msg: ChatMessage) => void;
  setTyping: (v: boolean) => void;
  toggleOpen: () => void;
  setOpen: (v: boolean) => void;
  clearMessages: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Ciao! Sono il tuo assistente TeamFit, alimentato da **Azure AI Foundry**.\n\nAnalizzo in tempo reale le risorse, i budget e le scadenze del portfolio per aiutarti a:\n• Rilevare progetti a rischio **write-off** o fuori **scadenza**\n• **Auto-allocare** risorse libere sui progetti in difficoltà\n• **Rimuovere** allocazioni eccessive per ridurre i costi\n• Proporre **riallocazioni** bilanciate\n\nUsa i pulsanti rapidi qui sotto o scrivi una domanda.',
  timestamp: new Date(),
};

export const useChatStore = create<ChatState>()((set) => ({
  messages: [WELCOME_MESSAGE],
  isTyping: false,
  isOpen: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setTyping: (v) => set({ isTyping: v }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (v) => set({ isOpen: v }),
  clearMessages: () => set({ messages: [WELCOME_MESSAGE] }),
}));
