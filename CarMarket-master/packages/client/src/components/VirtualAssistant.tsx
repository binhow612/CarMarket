import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAssistant } from "../contexts/AssistantContext";
import type { MessageAction } from "../types/assistant.types";

export function VirtualAssistant() {
  const {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    unreadCount,
    sendMessage,
    toggleAssistant,
    minimizeAssistant,
    clearMessages,
    markAsRead,
  } = useAssistant();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Mark as read when opened
  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const message = inputValue;
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAction = (action: MessageAction) => {
    if (action.action === "navigate" && action.data) {
      navigate(action.data);
      // Optionally close assistant after navigation
      // toggleAssistant();
    } else if (action.action === "view_listing" && action.data?.listingId) {
      navigate(`/cars/${action.data.listingId}`);
      // Optionally close assistant after navigation
      // toggleAssistant();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Open virtual assistant"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
        isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
      } flex flex-col`}
      style={{ maxHeight: "calc(100vh - 100px)" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="bg-white/20 rounded-full p-2">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">CarMarket Assistant</h3>
            <p className="text-xs text-blue-100">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={minimizeAssistant}
            className="hover:bg-white/10 rounded-lg p-1.5 transition-colors"
            aria-label={isMinimized ? "Expand" : "Minimize"}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMinimized ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              )}
            </svg>
          </button>
          <button
            onClick={clearMessages}
            className="hover:bg-white/10 rounded-lg p-1.5 transition-colors"
            aria-label="Clear chat"
            title="Clear chat"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={toggleAssistant}
            className="hover:bg-white/10 rounded-lg p-1.5 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  
                  {/* Action Buttons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAction(action)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-blue-100"
                        : "text-gray-400"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
            <div className="flex items-end space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}

