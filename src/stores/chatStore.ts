import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { ChatMessage } from './modelStore';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  // State
  conversations: Conversation[];
  currentConversationId: string | null;
  isGenerating: boolean;
  
  // Actions
  createConversation: () => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  sendMessage: (content: string) => Promise<void>;
  clearConversations: () => void;
  
  // Getters
  getCurrentConversation: () => Conversation | null;
  getMessages: () => ChatMessage[];
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  isGenerating: false,

  createConversation: () => {
    const id = generateId();
    const newConversation: Conversation = {
      id,
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set(state => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: id,
    }));
    return id;
  },

  selectConversation: (id) => {
    set({ currentConversationId: id });
  },

  deleteConversation: (id) => {
    set(state => {
      const newConversations = state.conversations.filter(c => c.id !== id);
      const newCurrentId = state.currentConversationId === id 
        ? (newConversations[0]?.id || null)
        : state.currentConversationId;
      return {
        conversations: newConversations,
        currentConversationId: newCurrentId,
      };
    });
  },

  addMessage: (conversationId, message) => {
    set(state => ({
      conversations: state.conversations.map(conv => {
        if (conv.id === conversationId) {
          const newMessages = [...conv.messages, message];
          // Auto-generate title from first user message
          const title = conv.title === '新对话' && message.role === 'user' && conv.messages.length === 0
            ? message.content.slice(0, 20) + (message.content.length > 20 ? '...' : '')
            : conv.title;
          return {
            ...conv,
            messages: newMessages,
            title,
            updatedAt: new Date(),
          };
        }
        return conv;
      }),
    }));
  },

  sendMessage: async (content) => {
    const { currentConversationId, createConversation, addMessage } = get();
    
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = createConversation();
    }

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content };
    addMessage(conversationId, userMessage);

    // Get all messages for context
    const conversation = get().conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    set({ isGenerating: true });

    try {
      // Call model router
      const response = await invoke<{ message: ChatMessage }>('chat_with_model', {
        request: { 
          messages: conversation.messages,
          stream: false 
        }
      });

      // Add assistant message
      addMessage(conversationId, response.message);
    } catch (error) {
      // Add error message
      addMessage(conversationId, {
        role: 'assistant',
        content: `❌ 错误: ${error}`,
      });
    } finally {
      set({ isGenerating: false });
    }
  },

  clearConversations: () => {
    set({ conversations: [], currentConversationId: null });
  },

  getCurrentConversation: () => {
    const { conversations, currentConversationId } = get();
    return conversations.find(c => c.id === currentConversationId) || null;
  },

  getMessages: () => {
    const conversation = get().getCurrentConversation();
    return conversation?.messages || [];
  },
}));
