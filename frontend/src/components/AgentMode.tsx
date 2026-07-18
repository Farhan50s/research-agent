import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Sparkles, ArrowRight, RotateCcw, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResearchLoader } from "@/components/ResearchLoader"
import { ResearchResults } from "@/components/ResearchResults"
import { toast } from "@/hooks/use-toast"

type AgentState = "idle" | "loading" | "results"

interface ResearchResponse {
  research_data: string
  metadata: Array<{ title: string; url: string }>
}

const suggestedQueries = [
  "What are the latest breakthroughs in quantum computing?",
  "How is AI transforming healthcare in 2024?",
  "What is the current state of fusion energy research?",
  "Explain the economic impact of climate change policies",
  "What are the key trends in large language model development?",
]

export function AgentMode() {
  const [query, setQuery] = useState("")
  const [agentState, setAgentState] = useState<AgentState>("idle")
  const [results, setResults] = useState<ResearchResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (agentState === "idle") {
      setTimeout(() => inputRef.current?.focus(), 400)
    }
  }, [agentState])

  const handleSubmit = async (q?: string) => {
    const searchQuery = q ?? query
    if (!searchQuery.trim()) return

    setQuery(searchQuery)
    setAgentState("loading")
    setResults(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: searchQuery }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      const data: ResearchResponse = await response.json()
      setResults(data)
      setAgentState("results")
    } catch (error) {
      setAgentState("idle")
      toast({
        title: "Backend Unreachable",
        description:
          "Could not connect to the research server at localhost:8000. Please ensure the FastAPI backend is running.",
        variant: "destructive",
      })
    }
  }

  const handleReset = () => {
    setAgentState("idle")
    setResults(null)
    setQuery("")
  }

  return (
    <motion.div
      key="agent-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px)]"
    >
      <AnimatePresence mode="wait">
        {/* IDLE STATE */}
        {agentState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center px-4"
          >
            {/* Floating orb decoration */}
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 glow-primary flex items-center justify-center animate-float">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              {/* Orbiting dots */}
              <div className="absolute inset-0 rounded-3xl border border-primary/10 scale-150 animate-spin" style={{ animationDuration: "8s" }}>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/60" />
              </div>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl mb-3 tracking-tight">
              <span className="gradient-text">AI Research Agent</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mb-10">
              Ask anything. I'll search the web, synthesize sources, and deliver a comprehensive report.
            </p>

            {/* Search Bar */}
            <div className="w-full max-w-2xl">
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3 p-2 pl-5 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm group-focus-within:border-primary/50 transition-all duration-300 shadow-xl">
                  <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    ref={inputRef}
                    id="research-query-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="What would you like to research?"
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base py-2"
                  />
                  <Button
                    id="research-submit-btn"
                    onClick={() => handleSubmit()}
                    disabled={!query.trim()}
                    variant="glow"
                    size="lg"
                    className="flex-shrink-0 gap-2 rounded-xl px-6 disabled:opacity-40 disabled:animate-none"
                  >
                    <span className="hidden sm:block">Research</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Suggested Queries */}
              <div className="mt-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">Suggested queries</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedQueries.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(q)}
                      className="text-xs px-3 py-2 rounded-xl border border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Capability tags */}
            <div className="flex flex-wrap justify-center gap-3 mt-12">
              {[
                { icon: "🌐", label: "Web Search" },
                { icon: "📊", label: "Data Analysis" },
                { icon: "📚", label: "Source Synthesis" },
                { icon: "✍️", label: "Report Writing" },
              ].map((cap) => (
                <div
                  key={cap.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/30 bg-secondary/20 text-sm text-muted-foreground"
                >
                  <span>{cap.icon}</span>
                  <span>{cap.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* LOADING STATE */}
        {agentState === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center justify-center pt-12 pb-8"
          >
            {/* Query display */}
            <div className="mb-8 text-center max-w-xl">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Researching</p>
              <p className="text-lg font-display font-semibold text-foreground">"{query}"</p>
            </div>
            <ResearchLoader />
          </motion.div>
        )}

        {/* RESULTS STATE */}
        {agentState === "results" && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Research Complete</p>
                <h2 className="font-display font-bold text-xl text-foreground">"{query}"</h2>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  id="new-research-btn"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  New Research
                </Button>
              </div>
            </div>

            <ResearchResults
              researchData={results.research_data}
              metadata={results.metadata}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
