import { create } from 'zustand';

export type ChatRole = 'user' | 'assistant';

export interface AllocationProposal {
  employeeId: string;
  employeeName: string;
  fromProjectId: string;
  fromProjectName: string;
  toProjectId: string;
  toProjectName: string;
  oreToMove: number;
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
    'Ciao! Sono il tuo assistente TeamFit, alimentato da **Azure AI Foundry**.\n\nPosso aiutarti a:\n• Monitorare il carico delle risorse\n• Proporre riallocazioni ottimali\n• Identificare rischi di progetto\n• Analizzare KPI di portfolio\n\nCosa posso fare per te?',
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
