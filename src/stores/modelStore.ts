import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export type ModelMode = 'smart' | 'local' | 'cloud' | 'manual';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  capabilities: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RouterConfig {
  mode: ModelMode;
  ollamaEndpoint: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  defaultLocalModel: string;
  defaultCloudModel: string;
}

export interface OllamaStatus {
  endpoint: string;
  reachable: boolean;
  models: string[];
  error?: string;
}

interface ModelState {
  // State
  mode: ModelMode;
  availableModels: ModelInfo[];
  ollamaStatus: OllamaStatus | null;
  currentModel: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setMode: (mode: ModelMode, manualModel?: string) => Promise<void>;
  fetchAvailableModels: () => Promise<void>;
  checkOllamaStatus: () => Promise<void>;
  chat: (messages: ChatMessage[]) => Promise<string>;
  setCurrentModel: (model: string) => void;
  clearError: () => void;
}

export const useModelStore = create<ModelState>((set) => ({
  mode: 'smart',
  availableModels: [],
  ollamaStatus: null,
  currentModel: null,
  isLoading: false,
  error: null,

  setMode: async (mode, manualModel) => {
    try {
      set({ isLoading: true, error: null });
      await invoke('set_model_mode', { mode, manualModel });
      set({ mode, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchAvailableModels: async () => {
    try {
      set({ isLoading: true, error: null });
      const models = await invoke<ModelInfo[]>('list_available_models');
      set({ availableModels: models, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  checkOllamaStatus: async () => {
    try {
      const status = await invoke<OllamaStatus>('check_ollama_status');
      set({ ollamaStatus: status });
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
    }
  },

  chat: async (messages) => {
    try {
      set({ isLoading: true, error: null });
      const response = await invoke<{ message: ChatMessage }>('chat_with_model', {
        request: { messages, stream: false }
      });
      set({ isLoading: false });
      return response.message.content;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  setCurrentModel: (model) => set({ currentModel: model }),
  
  clearError: () => set({ error: null }),
}));
