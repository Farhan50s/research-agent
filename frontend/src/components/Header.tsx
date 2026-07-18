import { Sparkles, Zap, Users, Bell } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface HeaderProps {
  isAgentMode: boolean
  onToggle: (value: boolean) => void
}

export function Header({ isAgentMode, onToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500",
            isAgentMode
              ? "bg-primary/20 glow-primary"
              : "bg-secondary"
          )}>
            {isAgentMode ? (
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            ) : (
              <Zap className="w-5 h-5 text-foreground" />
            )}
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-tight">
              {isAgentMode ? (
                <span className="gradient-text">NexusAI</span>
              ) : (
                "NexusAI"
              )}
            </span>
            <span className="text-muted-foreground text-xs ml-2 hidden sm:inline">
              {isAgentMode ? "Research Agent" : "Workspace"}
            </span>
          </div>
        </div>

        {/* Center Nav (hidden in agent mode) */}
        {!isAgentMode && (
          <nav className="hidden md:flex items-center gap-1">
            {["Projects", "Team", "Analytics", "Settings"].map((item) => (
              <button
                key={item}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all duration-150"
              >
                {item}
              </button>
            ))}
          </nav>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Agent Mode Toggle */}
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300",
            isAgentMode
              ? "border-primary/40 bg-primary/10 glow-primary"
              : "border-border/50 bg-secondary/50"
          )}>
            <Sparkles className={cn(
              "w-4 h-4 transition-colors duration-300",
              isAgentMode ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-xs font-medium hidden sm:block text-muted-foreground">
              Research Agent
            </span>
            <Switch
              id="agent-toggle"
              checked={isAgentMode}
              onCheckedChange={onToggle}
            />
          </div>

          {/* Notification Bell (Normal mode only) */}
          {!isAgentMode && (
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </button>
          )}

          {/* Active users badge (Normal mode) */}
          {!isAgentMode && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">4 online</span>
              <Badge variant="glow" className="text-[10px] px-1.5 py-0">Live</Badge>
            </div>
          )}

          {/* Avatar */}
          <Avatar className="h-9 w-9 ring-2 ring-border/50 hover:ring-primary/50 transition-all cursor-pointer">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-700 text-white text-sm font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
