import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { Message, AssistantState } from "../types/assistant.types";
import { AssistantService } from "../services/assistant.service";
import { useAuthStore } from "../store/auth";

interface AssistantContextType extends AssistantState {
  sendMessage: (content: string) => Promise<void>;
  toggleAssistant: () => void;
  minimizeAssistant: () => void;
  clearMessages: () => Promise<void>;
  markAsRead: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
};

interface AssistantProviderProps {
  children: ReactNode;
}

export const AssistantProvider = ({ children }: AssistantProviderProps) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  
  const [state, setState] = useState<AssistantState>({
    isOpen: false,
    isMinimized: false,
    messages: [],
    isTyping: false,
    unreadCount: 0,
  });

  // Initialize assistant with welcome message
  useEffect(() => {
    if (state.messages.length === 0) {
      (async () => {
        const welcomeResponse = await AssistantService.getWelcomeMessage();
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          content: welcomeResponse.message,
          sender: "assistant",
          timestamp: new Date(),
          type: "text",
          actions: welcomeResponse.actions,
        };
        setState(prev => ({ ...prev, messages: [welcomeMessage] }));
      })();
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
    }));

    // Simulate typing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Get assistant response
      const response = await AssistantService.sendQuery(content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: "assistant",
        timestamp: new Date(),
        type: response.actions ? "action" : "text",
        actions: response.actions,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isTyping: false,
        unreadCount: prev.isOpen ? prev.unreadCount : prev.unreadCount + 1,
      }));
    } catch (error) {
      console.error("Assistant error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists.",
        sender: "assistant",
        timestamp: new Date(),
        type: "text",
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
      }));
    }
  }, []);

  const toggleAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      isMinimized: false,
      unreadCount: !prev.isOpen ? 0 : prev.unreadCount,
    }));
  }, []);

  const minimizeAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  }, []);

  const clearMessages = useCallback(async () => {
    const welcomeResponse = await AssistantService.getWelcomeMessage();
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: welcomeResponse.message,
      sender: "assistant",
      timestamp: new Date(),
      type: "text",
    };
    
    setState(prev => ({
      ...prev,
      messages: [welcomeMessage],
    }));
  }, []);

  const markAsRead = useCallback(() => {
    setState(prev => ({ ...prev, unreadCount: 0 }));
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        ...state,
        sendMessage,
        toggleAssistant,
        minimizeAssistant,
        clearMessages,
        markAsRead,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

