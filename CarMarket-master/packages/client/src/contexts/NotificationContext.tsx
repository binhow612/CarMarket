import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuthStore } from "../store/auth";
import { ChatService } from "../services/chat.service";
import { socketService } from "../services/socket.service";
import toast from "react-hot-toast";
import type { ChatConversation } from "../services/chat.service";

interface NotificationContextType {
  unreadCount: number;
  conversations: ChatConversation[];
  refreshConversations: () => Promise<void>;
  clearUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  const refreshConversations = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await ChatService.getUserConversations();
      setConversations(response.conversations);

      // Get actual unread count from backend (with separate error handling)
      try {
        const unreadResponse = await ChatService.getUnreadCount();
        setUnreadCount(unreadResponse.unreadCount);
      } catch (unreadError) {
        console.error("Failed to get unread count:", unreadError);
        // Don't crash the app, just keep current unread count
        // setUnreadCount(0); // Optionally reset to 0
      }
    } catch (error) {
      console.error("Failed to refresh conversations:", error);
      // Don't crash the app, just log the error
    }
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      // Add a small delay to ensure authentication state is fully initialized
      const timer = setTimeout(() => {
        refreshConversations();
      }, 100);

      // Listen for global notifications
      const unsubscribeGlobalNotification = socketService.on(
        "globalNotification",
        (data: any) => {
          if (data.type === "newMessage" && data.data.sender.id !== user?.id) {
            toast.success(
              `New message from ${data.data.sender.firstName} ${data.data.sender.lastName}`
            );
            // Refresh conversations to update unread count
            refreshConversations();
          }
        }
      );

      // Refresh every 30 seconds
      const interval = setInterval(refreshConversations, 30000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
        unsubscribeGlobalNotification();
      };
    } else {
      setUnreadCount(0);
      setConversations([]);
    }
  }, [isAuthenticated, user?.id]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        conversations,
        refreshConversations,
        clearUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
