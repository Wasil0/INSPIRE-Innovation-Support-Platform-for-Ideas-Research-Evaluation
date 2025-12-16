import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

// TODO: Replace mockSessions with GET /api/ai/sessions
// Expected backend response: Array<{ id: string, title: string, lastMessage: string, updatedAt: string }>
const generateMockSessions = () => {
  return [
    {
      id: "1",
      title: "Project Idea Discussion",
      lastMessage: "How can I improve my proposal structure?",
      updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: "2",
      title: "Technical Requirements",
      lastMessage: "What technologies should I use?",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "3",
      title: "FYDP Timeline Planning",
      lastMessage: "When should I submit my proposal?",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ];
};

// TODO: Replace mockChatHistory with backend chat history
// Expected backend response: Array<{ id: string, role: 'user' | 'assistant', content: string, timestamp: string }>
const generateMockChatHistory = (sessionId) => {
  if (sessionId === "1") {
    return [
      {
        id: "1",
        role: "user",
        content: "How can I improve my FYDP proposal?",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        id: "2",
        role: "assistant",
        content:
          "To improve your FYDP proposal, focus on clearly defining your problem statement, outlining your methodology, and providing a realistic timeline. Make sure to include specific technical requirements and expected outcomes.",
        timestamp: new Date(Date.now() - 1000 * 60 * 44),
      },
      {
        id: "3",
        role: "user",
        content: "What sections are mandatory in a proposal?",
        timestamp: new Date(Date.now() - 1000 * 60 * 40),
      },
      {
        id: "4",
        role: "assistant",
        content:
          "Mandatory sections typically include: Introduction, Problem Statement, Objectives, Literature Review, Methodology, Expected Outcomes, Timeline, and References. Check with your advisor for specific requirements.",
        timestamp: new Date(Date.now() - 1000 * 60 * 39),
      },
    ];
  }
  return [];
};

// TODO: Replace generateDemoResponse with actual POST /api/ai/chat
// Expected backend request: { sessionId: string, message: string }
// Expected backend response: { content: string, timestamp: string }
const generateDemoResponse = async (message) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Simple demo responses based on keywords
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("proposal") || lowerMessage.includes("propose")) {
    return "A strong FYDP proposal should clearly articulate your research question, methodology, and expected contributions. Make sure to align with your advisor's expertise and the program requirements.";
  } else if (lowerMessage.includes("timeline") || lowerMessage.includes("schedule")) {
    return "A typical FYDP timeline spans two semesters. Plan for proposal submission in the first semester, followed by implementation and documentation in the second semester. Always build in buffer time for unexpected challenges.";
  } else if (lowerMessage.includes("technology") || lowerMessage.includes("tech") || lowerMessage.includes("stack")) {
    return "Choose technologies based on your project requirements. Consider factors like scalability, maintainability, team expertise, and project constraints. Popular stacks include MERN, Python/Django, and React/Node.js.";
  } else {
    return "I'm here to help with your FYDP journey! I can assist with proposal writing, project planning, technical decisions, and more. What specific area would you like guidance on?";
  }
};

const AiChat = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(generateMockSessions());
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id || null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // TODO: Load selected session's messages from backend when session opens
  useEffect(() => {
    if (activeSessionId) {
      const chatHistory = generateMockChatHistory(activeSessionId);
      setMessages(chatHistory);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max height for ~6 lines
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [inputMessage]);

  // TODO: Send user message through backend model
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await generateDemoResponse(userMessage.content);

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // TODO: Update session's last message through backend
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, lastMessage: userMessage.content, updatedAt: new Date() }
            : s
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, activeSessionId]);

  const handleNewChat = useCallback(() => {
    // Check if there are messages or unsent text
    if (messages.length > 0 || inputMessage.trim()) {
      setShowNewChatModal(true);
    } else {
      createNewSession();
    }
  }, [messages, inputMessage]);

  // TODO: Replace new chat handler with POST /api/ai/new-session
  const createNewSession = useCallback(() => {
    const newSession = {
      id: `session-${Date.now()}`,
      title: "New Chat",
      lastMessage: "",
      updatedAt: new Date(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setInputMessage("");
    setShowNewChatModal(false);
  }, []);

  const handleSessionClick = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleRenameStart = useCallback((sessionId, currentTitle) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  }, []);

  // TODO: Sync renamed session title with backend
  const handleRenameSave = useCallback(() => {
    if (editingTitle.trim() && editingSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingSessionId ? { ...s, title: editingTitle.trim() } : s
        )
      );
      setEditingSessionId(null);
      setEditingTitle("");
    }
  }, [editingTitle, editingSessionId]);

  const handleRenameCancel = useCallback(() => {
    setEditingSessionId(null);
    setEditingTitle("");
  }, []);

  const formatTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Collapsible Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-64"
          } border-r border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out flex flex-col shrink-0 h-full`}
        >
          {/* Sidebar Header */}
          <div className="p-3 border-b border-border flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="font-semibold text-foreground text-sm">Chat Sessions</h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="shrink-0 h-8 w-8 ml-auto"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="p-3 border-b border-border">
            <Button
              onClick={handleNewChat}
              className={sidebarCollapsed ? "w-full aspect-square p-0" : "w-full"}
              size={sidebarCollapsed ? "icon" : "sm"}
            >
              <Plus className="h-4 w-4" />
              {!sidebarCollapsed && <span className="ml-2">New Chat</span>}
            </Button>
          </div>

          {/* Sessions List - Expanded State */}
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-y-auto min-h-0">
              {sessions.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No sessions yet
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {sessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const isEditing = editingSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        onClick={() => !isEditing && handleSessionClick(session.id)}
                        className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          isActive
                            ? "bg-primary/20 border border-primary/40 shadow-sm"
                            : "bg-transparent border border-transparent hover:bg-accent/50 hover:border-primary/20"
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameSave();
                                if (e.key === "Escape") handleRenameCancel();
                              }}
                              className="h-7 text-sm"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameSave();
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameCancel();
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3
                                className={`font-medium text-sm truncate flex-1 ${
                                  isActive ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {session.title}
                              </h3>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameStart(session.id, session.title);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {session.lastMessage && (
                              <p className="text-xs text-muted-foreground truncate mb-1">
                                {session.lastMessage}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatTime(session.updatedAt)}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sessions List - Collapsed State */}
          {sidebarCollapsed && (
            <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-2">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    onClick={() => handleSessionClick(session.id)}
                    className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                    title={session.title}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative min-h-0">
          {/* Messages Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto min-h-0 p-6 bg-background scroll-smooth"
            style={{ paddingBottom: "100px" }}
          >
            <div className="max-w-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold text-foreground mb-2">
                    Start chatting with your AI assistant
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Explore FYDP guidance, support, and insights. Ask questions about your
                    project, proposal structure, timeline planning, or technical decisions.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex mb-6 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } animate-in fade-in slide-in-from-bottom-2 duration-200`}
                  >
                    <div
                      className={`max-w-[75%] min-w-0 rounded-xl p-4 shadow-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-foreground"
                      }`}
                      style={{ 
                        wordWrap: "break-word", 
                        overflowWrap: "break-word",
                        wordBreak: "break-word"
                      }}
                    >
                      <p 
                        className="text-sm whitespace-pre-wrap break-words leading-relaxed"
                        style={{
                          wordWrap: "break-word",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word"
                        }}
                      >
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
            </div>
          </div>

          {/* Chat Input - Fixed at bottom with glassmorphism matching navbar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none">
            <div className="max-w-4xl mx-auto w-full px-4 pointer-events-auto">
              <div className="flex gap-3 items-end border border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 rounded-lg p-3 shadow-sm">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="w-full min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground text-sm leading-relaxed py-2.5 px-0 overflow-y-auto"
                    style={{ 
                      wordWrap: "break-word", 
                      overflowWrap: "break-word",
                      whiteSpace: "pre-wrap"
                    }}
                    disabled={isLoading}
                    rows={1}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="h-11 w-11 shrink-0 mb-0.5"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Confirmation Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border-primary/20 bg-background shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Start New Chat Session?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to start a new session? This will clear the current
                chat.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowNewChatModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createNewSession}>
                  Start New
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AiChat;
