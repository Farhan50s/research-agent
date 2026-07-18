import { Sparkles, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onNewChat: () => void
}

export function Header({ onNewChat }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-tight text-zinc-50">
              Nexus<span className="text-indigo-400">AI</span>
            </span>
            <span className="text-zinc-500 text-[10px] ml-2 tracking-widest uppercase font-mono hidden sm:inline">
              Research Chatbot
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          id="new-chat-header-btn"
          variant="outline"
          size="sm"
          onClick={onNewChat}
          className="gap-1.5 border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900 transition-all text-xs rounded-full px-3.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </Button>
      </div>
    </header>
  )
}
