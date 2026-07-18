import { PanelLeft, Sparkles } from "lucide-react"

interface HeaderProps {
  chatTitle?: string
  onToggleSidebar: () => void
}

export function Header({ chatTitle = "New Chat", onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md h-14 flex items-center">
      <div className="w-full px-4 flex items-center gap-3">
        {/* Sidebar Toggle Button (Desktop & Mobile) */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* Brand / Logo (only visible on mobile, hidden on desktop since it is in sidebar) */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-tight text-zinc-50">
              Zynt<span className="text-indigo-400"> AI</span>
            </span>
            <span className="text-zinc-500 text-[10px] ml-2 tracking-widest uppercase font-mono hidden sm:inline">
              Research Chatbot
            </span>
          </div>
        </div>

        {/* Separator on mobile */}
        <span className="text-zinc-800 hidden sm:inline md:hidden">|</span>

        {/* Currently Active Chat Title */}
        <h2 className="text-sm font-medium text-zinc-300 truncate max-w-xs sm:max-w-md">
          {chatTitle}
        </h2>
      </div>
    </header>
  )
}
