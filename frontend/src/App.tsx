import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { AgentMode } from "@/components/AgentMode"
import { Toaster } from "@/components/ui/toaster"
import { Plus, Settings, Sparkles, MessageSquare, X, Edit2, Trash2, Check } from "lucide-react"

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

function App() {
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
    // Default first session
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
      // Verify active session still exists
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

  // Desktop defaults to open, mobile toggles it overlay style
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("zynt_sessions", JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem("zynt_active_session_id", activeSessionId)
    }
  }, [activeSessionId])

  // Get active session
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
    // On mobile screens, automatically close the sidebar overlay on selection
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  const handleUpdateMessages = (newMessages: Message[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          let updatedTitle = s.title
          // Auto-generate title if it's currently default "New Chat" and user sent first prompt
          if (s.title === "New Chat") {
            const firstUserMessage = newMessages.find((m) => m.role === "user")
            if (firstUserMessage) {
              updatedTitle = firstUserMessage.text.slice(0, 25).trim()
              if (firstUserMessage.text.length > 25) {
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

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
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
        // Fallback to the next available chat
        setActiveSessionId(remaining[0].id)
      }
    }
  }

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  // Sort sessions: Newest updatedAt first
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Left Collapsible & Animated Sidebar */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 flex flex-col bg-zinc-950 overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "w-64 opacity-100 translate-x-0 border-r border-zinc-900"
            : "w-0 opacity-0 -translate-x-full md:translate-x-0 border-r-0 pointer-events-none"
        }`}
      >
        {/* Inner container with static width prevents wrapping artifacts during animation */}
        <div className={`flex flex-col h-full w-64 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {/* Sidebar Header with Brand and Close Button */}
          <div className="p-4 flex items-center justify-between border-b border-zinc-900 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
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
              className="md:hidden p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 flex-shrink-0">
            <button
              id="new-chat-sidebar-btn"
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-100 hover:text-zinc-50 transition-all font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4 text-zinc-400" />
              New Chat
            </button>
          </div>

          {/* Scrollable Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-600 tracking-wider uppercase">History</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-500 font-medium">
                {sessions.length} chats
              </span>
            </div>
            <div className="space-y-0.5">
              {sortedSessions.map((session) => {
                const isActive = activeSessionId === session.id
                const isEditing = editingSessionId === session.id

                return (
                  <div
                    key={session.id}
                    onClick={() => !isEditing && handleSelectSession(session.id)}
                    className={`group flex items-center justify-between text-sm rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 relative ${
                      isActive
                        ? "bg-zinc-900 text-zinc-100 font-medium border border-zinc-800/50"
                        : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => saveRename(session.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(session.id)
                            if (e.key === "Escape") setEditingSessionId(null)
                          }}
                          className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 w-full"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate">{session.title}</span>
                      )}
                    </div>

                    {/* Actions (Edit / Delete) */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={(e) => startRename(session.id, session.title, e)}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                          title="Rename conversation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {isEditing && (
                      <button
                        onClick={() => saveRename(session.id)}
                        className="p-1 rounded text-green-400 hover:bg-zinc-800 transition-colors ml-2"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* User Profile / Settings Block */}
          <div className="p-4 border-t border-zinc-900 flex flex-col gap-1.5 bg-zinc-950 flex-shrink-0">
            <button className="flex items-center gap-3 w-full p-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors text-left">
              <Settings className="w-4 h-4 text-zinc-500" />
              <span>Settings</span>
            </button>
            <div className="flex items-center gap-3 w-full p-2 rounded-lg bg-zinc-900/40 border border-zinc-900/60">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">John Doe</p>
                <p className="text-[10px] text-zinc-500 truncate">john.doe@nexusai.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* Minimal Header */}
        <Header
          chatTitle={activeSession?.title}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Chat Interface Scroll Area */}
        <div className="flex-1 overflow-y-auto relative bg-zinc-950">
          <AgentMode
            key={activeSessionId}
            sessionMessages={activeSession?.messages || []}
            onUpdateMessages={handleUpdateMessages}
          />
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

export default App
