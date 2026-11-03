import { useState, useEffect, useMemo, useRef } from "react"
import { Header } from "@/components/Header"
import { AgentMode } from "@/components/AgentMode"
import { Toaster } from "@/components/ui/toaster"
import { Modal } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  Plus,
  Sparkles,
  MessageSquare,
  X,
  Edit2,
  Trash2,
  Check,
  Search,
  Download,
  AlertTriangle,
  Keyboard,
  Globe,
  Settings,
  HelpCircle
} from "lucide-react"

interface Source {
  title: string
  url: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
  sources?: Source[]
  isLoading?: boolean
}

interface Session {
  id: string
  title: string
  messages: Message[]
  updatedAt: number
}

function formatGroupDate(timestamp: number): string {
  const now = Date.now()
  const diffHours = (now - timestamp) / (1000 * 60 * 60)

  if (diffHours < 24) return "Today"
  if (diffHours < 48) return "Yesterday"
  if (diffHours < 24 * 7) return "Previous 7 Days"
  return "Older"
}

export function App() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem("zynt_sessions")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (e) {
        console.error("Failed to load sessions from localStorage:", e)
      }
    }
    return [
      {
        id: `session-${Date.now()}`,
        title: "New Chat",
        messages: [],
        updatedAt: Date.now(),
      },
    ]
  })

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedActive = localStorage.getItem("zynt_active_session_id")
    if (savedActive) {
      const savedActiveExists = localStorage.getItem("zynt_sessions")
      if (savedActiveExists) {
        try {
          const parsed = JSON.parse(savedActiveExists)
          if (parsed.some((s: Session) => s.id === savedActive)) {
            return savedActive
          }
        } catch (e) {}
      }
    }
    return sessions[0]?.id || ""
  })

  // Desktop defaults to open, mobile starts closed
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768
    }
    return true
  })
  const [isResearchMode, setIsResearchMode] = useState(true)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Modal states
  const [deleteModalSessionId, setDeleteModalSessionId] = useState<string | null>(null)
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false)
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem("zynt_sessions", JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem("zynt_active_session_id", activeSessionId)
    }
  }, [activeSessionId])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B / Cmd+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        setIsSidebarOpen((prev) => !prev)
      }
      // Ctrl+K / Cmd+K: Focus History Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsSidebarOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 150)
      }
      // Ctrl+N / Cmd+N (when not in input): New Chat
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        handleNewChat()
      }
      // Ctrl+Shift+M, Ctrl+Shift+R, or Alt+R: Toggle Mode
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === "m" || e.key.toLowerCase() === "r")) ||
        (e.altKey && e.key.toLowerCase() === "r")
      ) {
        e.preventDefault()
        const isGenerating = activeSession?.messages?.some((m) => m.isLoading)
        if (isGenerating) {
          toast({
            title: "Generation in Progress",
            description: "Cannot switch modes while response is generating. Press Escape or wait for completion.",
            variant: "destructive",
          })
          return
        }
        setIsResearchMode((prev) => {
          const next = !prev
          toast({
            title: next ? "Agent Research Mode Active" : "Simple Chat Mode Active",
            description: next
              ? "Switched to deep web research with multi-source synthesis."
              : "Switched to fast, direct answers.",
          })
          return next
        })
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

  // Active session lookup
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]

  const handleNewChat = () => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: "New Chat",
      messages: [],
      updatedAt: Date.now(),
    }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  const handleUpdateMessages = (newMessages: Message[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          let updatedTitle = s.title
          // Auto-generate title if default "New Chat" and first user prompt sent
          if (s.title === "New Chat") {
            const firstUserMessage = newMessages.find((m) => m.role === "user")
            if (firstUserMessage) {
              updatedTitle = firstUserMessage.text.slice(0, 28).trim()
              if (firstUserMessage.text.length > 28) {
                updatedTitle += "..."
              }
            }
          }
          return {
            ...s,
            title: updatedTitle,
            messages: newMessages,
            updatedAt: Date.now(),
          }
        }
        return s
      })
    )
  }

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(id)
    setEditTitle(currentTitle)
  }

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editTitle.trim(), updatedAt: Date.now() } : s))
      )
    }
    setEditingSessionId(null)
  }

  const confirmDeleteSession = () => {
    if (!deleteModalSessionId) return
    const id = deleteModalSessionId
    const remaining = sessions.filter((s) => s.id !== id)

    if (remaining.length === 0) {
      const fresh: Session = {
        id: `session-${Date.now()}`,
        title: "New Chat",
        messages: [],
        updatedAt: Date.now(),
      }
      setSessions([fresh])
      setActiveSessionId(fresh.id)
    } else {
      setSessions(remaining)
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id)
      }
    }
    setDeleteModalSessionId(null)
    toast({
      title: "Conversation Deleted",
      description: "Chat history has been removed.",
    })
  }

  const confirmClearAll = () => {
    const fresh: Session = {
      id: `session-${Date.now()}`,
      title: "New Chat",
      messages: [],
      updatedAt: Date.now(),
    }
    setSessions([fresh])
    setActiveSessionId(fresh.id)
    setIsClearAllModalOpen(false)
    toast({
      title: "All Chats Cleared",
      description: "Started a fresh conversation workspace.",
    })
  }

  const handleExportActiveSession = () => {
    if (!activeSession) return
    const markdownContent = [
      `# ${activeSession.title}`,
      `*Exported from Zynt AI on ${new Date().toLocaleString()}*\n`,
      ...activeSession.messages.map((m) => {
        if (m.role === "user") {
          return `### 👤 User\n${m.text}\n`
        } else {
          let sourcesText = ""
          if (m.sources && m.sources.length > 0) {
            sourcesText = "\n\n**Sources:**\n" + m.sources.map((s, i) => `- [${i + 1}] [${s.title}](${s.url})`).join("\n")
          }
          return `### ⚡ Zynt AI\n${m.text}${sourcesText}\n`
        }
      }),
    ].join("\n")

    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${activeSession.title.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`
    link.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Session Exported",
      description: "Downloaded markdown transcript.",
    })
  }

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  // Filter and group sessions
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.toLowerCase()
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.text.toLowerCase().includes(q))
    )
  }, [sessions, searchQuery])

  // Group filtered sessions chronologically
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: Session[] } = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    }

    const sorted = [...filteredSessions].sort((a, b) => b.updatedAt - a.updatedAt)

    sorted.forEach((session) => {
      const groupName = formatGroupDate(session.updatedAt)
      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(session)
    })

    return groups
  }, [filteredSessions])

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Left Collapsible & Animated Sidebar */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 flex flex-col bg-zinc-950 overflow-hidden transition-all duration-300 ease-in-out select-none ${
          isSidebarOpen
            ? "w-64 opacity-100 translate-x-0 border-r border-zinc-900"
            : "w-0 opacity-0 -translate-x-full md:translate-x-0 border-r-0 pointer-events-none"
        }`}
      >
        <div className={`flex flex-col h-full w-64 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {/* Sidebar Header with Brand */}
          <div className="p-4 flex items-center justify-between border-b border-zinc-900 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <span className="font-display font-bold text-base tracking-tight text-zinc-50">
                  Zynt<span className="text-indigo-400"> AI</span>
                </span>
              </div>
            </div>
            {/* Mobile close sidebar button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button & Search Input */}
          <div className="p-3 space-y-2 flex-shrink-0">
            <button
              id="new-chat-sidebar-btn"
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-100 hover:text-zinc-50 transition-all font-medium text-xs shadow-sm active:scale-98"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>New Chat</span>
              <kbd className="hidden sm:inline-block ml-auto text-[10px] text-zinc-500 font-mono px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                Ctrl+N
              </kbd>
            </button>

            {/* Conversation Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats... (Ctrl+K)"
                className="w-full bg-zinc-900/60 border border-zinc-850 hover:border-zinc-800 focus:border-indigo-500/50 rounded-lg pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                No matching chats found
              </div>
            ) : (
              Object.entries(groupedSessions).map(([groupTitle, sessionList]) => {
                if (sessionList.length === 0) return null

                return (
                  <div key={groupTitle} className="mb-3">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                      <span>{groupTitle}</span>
                      <span className="text-[9px] text-zinc-600">{sessionList.length}</span>
                    </div>

                    <div className="space-y-0.5 mt-0.5">
                      {sessionList.map((session) => {
                        const isActive = activeSessionId === session.id
                        const isEditing = editingSessionId === session.id

                        return (
                          <div
                            key={session.id}
                            onClick={() => !isEditing && handleSelectSession(session.id)}
                            className={`group relative flex items-center justify-between text-xs rounded-lg px-3 py-2 cursor-pointer transition-all duration-150 ${
                              isActive
                                ? "bg-zinc-900 text-zinc-100 font-medium border border-zinc-800/80 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-indigo-500 before:rounded-r"
                                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <MessageSquare className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />

                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onBlur={() => saveRename(session.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.nativeEvent.isComposing) saveRename(session.id)
                                    if (e.key === "Escape") setEditingSessionId(null)
                                  }}
                                  className="bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 w-full"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="truncate">{session.title}</span>
                              )}
                            </div>

                            {/* Actions (Rename / Delete) */}
                            {!isEditing && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 flex-shrink-0">
                                <button
                                  onClick={(e) => startRename(session.id, session.title, e)}
                                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                                  title="Rename chat"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteModalSessionId(session.id)
                                  }}
                                  className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                                  title="Delete chat"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {isEditing && (
                              <button
                                onClick={() => saveRename(session.id)}
                                className="p-1 rounded text-emerald-400 hover:bg-zinc-800 transition-colors ml-1.5 flex-shrink-0"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* User Profile / Status Footer */}
          <div className="p-3 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-2 flex-shrink-0">
            {/* Quick Actions row */}
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <button
                onClick={handleExportActiveSession}
                className="flex items-center gap-1.5 p-1.5 rounded-md hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                title="Export active conversation as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px]">Export</span>
              </button>

              <button
                onClick={() => setIsShortcutsModalOpen(true)}
                className="flex items-center gap-1.5 p-1.5 rounded-md hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                title="Keyboard Shortcuts"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span className="text-[11px]">Shortcuts</span>
              </button>

              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="flex items-center gap-1.5 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                title="Clear all chat history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Clear</span>
              </button>
            </div>

            {/* AI Engine Status badge */}
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-[11px] font-medium text-zinc-200">Zynt AI Engine</p>
                  <p className="text-[9px] text-zinc-500 font-mono">Llama 3.3 • Tavily Search</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                v1.2
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* Minimal Header */}
        <Header
          chatTitle={activeSession?.title}
          isResearchMode={isResearchMode}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          onRenameChat={(newTitle) => {
            setSessions((prev) =>
              prev.map((s) => (s.id === activeSessionId ? { ...s, title: newTitle } : s))
            )
          }}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        />

        {/* Chat Interface View */}
        <div className="flex-1 overflow-hidden relative bg-zinc-950 flex flex-col">
          <AgentMode
            key={activeSessionId}
            sessionMessages={activeSession?.messages || []}
            onUpdateMessages={handleUpdateMessages}
            isResearchMode={isResearchMode}
            onToggleMode={setIsResearchMode}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalSessionId !== null}
        onClose={() => setDeleteModalSessionId(null)}
        title="Delete conversation?"
        description="This will permanently delete this research chat session and cannot be undone."
      >
        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            onClick={() => setDeleteModalSessionId(null)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteSession}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20 transition-all active:scale-95"
          >
            Delete Chat
          </button>
        </div>
      </Modal>

      {/* Clear All Chats Modal */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        title="Clear all conversations?"
        description="Are you sure you want to delete all saved conversations? This action cannot be recovered."
      >
        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            onClick={() => setIsClearAllModalOpen(false)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmClearAll}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20 transition-all active:scale-95"
          >
            Clear Everything
          </button>
        </div>
      </Modal>

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <Modal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        title="Keyboard Shortcuts"
        description="Navigate and research faster with these built-in shortcuts."
      >
        <div className="space-y-3 mt-4 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-850">
            <span className="text-zinc-300">Send message</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-850">
            <span className="text-zinc-300">Insert newline in prompt</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Shift + Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-850">
            <span className="text-zinc-300">Toggle Sidebar</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Ctrl + B
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-850">
            <span className="text-zinc-300">Search chat history</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Ctrl + K
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-850">
            <span className="text-zinc-300">Start new chat</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Ctrl + N
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-850">
            <span className="text-zinc-300">Toggle Research / Chat mode</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Ctrl + Shift + M / Alt + R
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-850">
            <span className="text-zinc-300">Voice input (Speech to text)</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Ctrl + M / Alt + M
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-850">
            <span className="text-zinc-300">Enhance prompt (Magic Wand)</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Ctrl + E / Alt + E
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-850">
            <span className="text-zinc-300">Halt generation</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Escape
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-zinc-300">Close dialogs</span>
            <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
              Escape
            </kbd>
          </div>
        </div>
      </Modal>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

export default App
