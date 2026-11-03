import { useState } from "react"
import { PanelLeft, Sparkles, Globe, MessageSquare, Plus, Keyboard, Edit2, Check, Radio } from "lucide-react"

interface HeaderProps {
  chatTitle?: string
  isResearchMode?: boolean
  onToggleSidebar: () => void
  onNewChat: () => void
  onRenameChat?: (newTitle: string) => void
  onOpenShortcuts: () => void
  onToggleMode?: () => void
}

export function Header({
  chatTitle = "New Chat",
  isResearchMode = true,
  onToggleSidebar,
  onNewChat,
  onRenameChat,
  onOpenShortcuts,
  onToggleMode,
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(chatTitle)

  const handleSaveTitle = () => {
    if (tempTitle.trim() && onRenameChat) {
      onRenameChat(tempTitle.trim())
    }
    setIsEditingTitle(false)
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md h-14 flex items-center justify-between px-3 sm:px-4">
      {/* Left Section: Sidebar Toggle & Brand/Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors flex-shrink-0"
          title="Toggle Sidebar (Ctrl+B)"
          aria-label="Toggle Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Brand / Logo (Mobile only) */}
        <div className="flex items-center gap-2 md:hidden flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-zinc-50">
            Zynt<span className="text-indigo-400"> AI</span>
          </span>
          <span className="text-zinc-800">|</span>
        </div>

        {/* Currently Active Chat Title (with inline quick rename) */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-xs sm:max-w-md">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSaveTitle()
                  if (e.key === "Escape") setIsEditingTitle(false)
                }}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 rounded text-emerald-400 hover:bg-zinc-800"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 group">
              <h2 className="text-xs sm:text-sm font-medium text-zinc-300 truncate tracking-tight">
                {chatTitle}
              </h2>
              {onRenameChat && (
                <button
                  onClick={() => {
                    setTempTitle(chatTitle)
                    setIsEditingTitle(true)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-300 transition-opacity"
                  title="Rename chat"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Mode Indicator, Shortcuts & New Chat */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Active Mode Pill / Toggle */}
        <button
          type="button"
          onClick={onToggleMode}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border select-none transition-all cursor-pointer ${
            isResearchMode
              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
              : "bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500/20"
          }`}
          title={`Switch to ${isResearchMode ? "Simple Chat" : "Agent Research"} mode (Ctrl+Shift+M or Alt+R)`}
        >
          {isResearchMode ? (
            <>
              <Globe className="w-3 h-3" />
              <span>Agent Research</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-3 h-3" />
              <span>Simple Chat</span>
            </>
          )}
        </button>

        {/* Backend Status indicator */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] text-zinc-400 bg-zinc-900/60 border border-zinc-850"
          title={`Backend FastAPI Service Connected at ${(import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-zinc-400">API</span>
        </div>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          title="Keyboard Shortcuts"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Quick New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-zinc-50 text-xs font-medium transition-all shadow-sm active:scale-95"
          title="Create New Chat (Ctrl+N)"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </header>
  )
}
