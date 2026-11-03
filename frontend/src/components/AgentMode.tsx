import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  ArrowUp,
  RefreshCw,
  MessageSquare,
  Globe,
  ChevronDown,
  Copy,
  Check,
  Download,
  Share2,
  Atom,
  HeartPulse,
  Zap,
  TrendingUp,
  Brain,
  PenTool,
  Compass,
  X,
  Search,
  BookOpen
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { CodeBlock } from "@/components/CodeBlock"
import { SourceCard } from "@/components/SourceCard"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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

interface AgentModeProps {
  sessionMessages: Message[]
  onUpdateMessages: (newMessages: Message[]) => void
  isResearchMode: boolean
  onToggleMode: (val: boolean) => void
}

const researchPromptCards = [
  {
    icon: Atom,
    category: "Quantum Tech",
    prompt: "What are the latest breakthroughs in quantum computing and error correction in 2024?",
  },
  {
    icon: HeartPulse,
    category: "Healthcare AI",
    prompt: "How is generative AI transforming drug discovery and clinical trials in 2024?",
  },
  {
    icon: Zap,
    category: "Clean Energy",
    prompt: "What is the current global progress and commercial timeline for fusion energy?",
  },
  {
    icon: TrendingUp,
    category: "Global Economy",
    prompt: "Explain the projected economic and market impact of renewable energy transition policies.",
  },
]

const simplePromptCards = [
  {
    icon: Brain,
    category: "Concepts",
    prompt: "Explain quantum computing in simple terms with an everyday analogy.",
  },
  {
    icon: PenTool,
    category: "Writing",
    prompt: "Draft a polite, persuasive email asking a stakeholder for project feedback.",
  },
  {
    icon: Compass,
    category: "Planning",
    prompt: "Create a 5-day productive itinerary for exploring Kyoto and Tokyo.",
  },
  {
    icon: MessageSquare,
    category: "Quick Help",
    prompt: "Give me 5 high-protein vegetarian breakfast ideas ready in under 10 minutes.",
  },
]

// Animated stepped progress messages for deep research
const researchLoadingSteps = [
  "Analyzing question & formulating targeted queries...",
  "Searching live web indexes via Tavily...",
  "Extracting relevant evidence & evaluating reliability...",
  "Synthesizing findings into structured research report...",
]

export function AgentMode({
  sessionMessages,
  onUpdateMessages,
  isResearchMode,
  onToggleMode,
}: AgentModeProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingStepIdx, setLoadingStepIdx] = useState(0)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Cycle through research loading steps for rich progress feedback
  useEffect(() => {
    let interval: any
    if (loading && isResearchMode) {
      setLoadingStepIdx(0)
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev < researchLoadingSteps.length - 1 ? prev + 1 : prev))
      }, 3500)
    } else {
      setLoadingStepIdx(0)
    }
    return () => clearInterval(interval)
  }, [loading, isResearchMode])

  // Scroll to bottom on new messages
  const scrollToBottom = (options: ScrollIntoViewOptions = { behavior: "smooth" }) => {
    messagesEndRef.current?.scrollIntoView(options)
  }

  useEffect(() => {
    scrollToBottom({ behavior: "smooth" })
  }, [sessionMessages, loading])

  // Track scroll position to show floating "Scroll to bottom" button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    setShowScrollBottom(distanceFromBottom > 160)
  }

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (q?: string) => {
    const queryText = (q ?? input).trim()
    if (!queryText || loading) return

    setInput("")
    setLoading(true)

    const userMessageId = `msg-${Date.now()}-user`
    const assistantMessageId = `msg-${Date.now()}-assistant`

    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      text: queryText,
    }

    const loadingMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
      isLoading: true,
    }

    const messagesSnapshot = [...sessionMessages]
    onUpdateMessages([...messagesSnapshot, userMsg, loadingMsg])

    try {
      const response = await fetch("http://127.0.0.1:8000/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: queryText,
          mode: isResearchMode ? "research" : "simple",
        }),
      })

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`)
      }

      const data = await response.json()

      onUpdateMessages([
        ...messagesSnapshot,
        userMsg,
        {
          id: assistantMessageId,
          role: "assistant",
          text: data.research_data || "No response received.",
          sources: data.metadata || [],
          isLoading: false,
        },
      ])
    } catch (error) {
      onUpdateMessages([...messagesSnapshot, userMsg])
      toast({
        title: "Backend Unreachable",
        description:
          "Could not connect to the research server at http://127.0.0.1:8000. Please ensure the backend server is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // IME-safe submission as recommended by Modern Web Guidance
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (e.nativeEvent.isComposing || (e.nativeEvent as any).keyCode === 229) {
        return
      }
      handleSubmit()
    }
  }

  const handleCopyReport = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(id)
      setTimeout(() => setCopiedMessageId(null), 2000)
      toast({
        title: "Report Copied",
        description: "Markdown report copied to clipboard.",
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleDownloadReport = (text: string, title?: string) => {
    const filename = `${(title || "zynt-research-report").slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const promptCards = isResearchMode ? researchPromptCards : simplePromptCards

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 flex flex-col h-full overflow-y-auto relative scroll-smooth"
    >
      {/* Scrollable messages container */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 pb-48 pt-6">
        <AnimatePresence initial={false} mode="wait">
          {sessionMessages.length === 0 ? (
            /* EMPTY STATE GREETING */
            <motion.div
              key={`empty-${isResearchMode ? "research" : "simple"}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
            >
              {/* Atmospheric Hero Glow Orb */}
              <div className="relative mb-6">
                <div
                  className={`absolute -inset-4 rounded-full blur-xl opacity-40 transition-colors duration-500 ${
                    isResearchMode ? "bg-indigo-600/30" : "bg-teal-500/25"
                  }`}
                />
                <div
                  className={`relative w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl transition-all duration-300 ${
                    isResearchMode
                      ? "bg-indigo-950/60 border-indigo-500/30 text-indigo-400"
                      : "bg-teal-950/60 border-teal-500/30 text-teal-400"
                  }`}
                >
                  {isResearchMode ? (
                    <Sparkles className="w-7 h-7 animate-pulse text-indigo-400" />
                  ) : (
                    <MessageSquare className="w-7 h-7 text-teal-400" />
                  )}
                </div>
              </div>

              {/* Mode Switcher Tabs right on empty greeting */}
              <div className="inline-flex items-center p-1 rounded-full bg-zinc-900 border border-zinc-800 mb-6 shadow-inner">
                <button
                  onClick={() => onToggleMode(true)}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isResearchMode
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Agent Research</span>
                </button>
                <button
                  onClick={() => onToggleMode(false)}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
                    !isResearchMode
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-600/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Simple Chat</span>
                </button>
              </div>

              <h1 className="font-display font-bold text-3xl sm:text-4xl text-zinc-50 mb-3 tracking-tight max-w-xl">
                {isResearchMode
                  ? "What would you like to research today?"
                  : "How can I assist you today?"}
              </h1>
              <p className="text-zinc-400 text-sm max-w-md mb-8 leading-relaxed">
                {isResearchMode
                  ? "Ask any complex question to synthesize live web sources into a comprehensive markdown research report."
                  : "Have a quick conversational exchange with direct answers and instant formatting."}
              </p>

              {/* Thematic Prompt Cards */}
              <div className="grid sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
                {promptCards.map((card, idx) => {
                  const Icon = card.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(card.prompt)}
                      className={`group flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-850 text-left transition-all duration-200 hover:-translate-y-0.5 shadow-sm ${
                        isResearchMode
                          ? "hover:border-indigo-500/40 hover:shadow-indigo-500/5"
                          : "hover:border-teal-500/40 hover:shadow-teal-500/5"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-zinc-400 group-hover:text-zinc-300">
                          <Icon className={`w-3.5 h-3.5 ${isResearchMode ? "text-indigo-400" : "text-teal-400"}`} />
                          {card.category}
                        </span>
                        <ArrowUp className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="text-xs text-zinc-200 leading-relaxed font-normal line-clamp-2">
                        {card.prompt}
                      </p>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            /* MESSAGE THREAD */
            <div className="space-y-6">
              {sessionMessages.map((message) => {
                const isUser = message.role === "user"

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} w-full group/msg`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] ${
                        isUser ? "text-right" : "text-left"
                      }`}
                    >
                      {isUser ? (
                        /* User Message Bubble */
                        <div className="relative inline-block text-left">
                          <div className="bg-zinc-800/90 text-zinc-50 border border-zinc-700/60 px-5 py-3 rounded-2xl rounded-tr-sm text-sm shadow-md backdrop-blur-sm">
                            <p className="leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/40">
                              {message.text}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopyReport(message.text, message.id)}
                            className="absolute -left-8 top-2 opacity-0 group-hover/msg:opacity-100 p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                            title="Copy prompt"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        /* Assistant Message Bubble */
                        <div className="space-y-4">
                          {message.isLoading ? (
                            /* Multi-step Live Reasoning Indicator */
                            <div className="p-5 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl rounded-tl-sm w-full max-w-lg shadow-lg">
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                                  <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                                </div>
                                <span className="text-xs font-semibold text-zinc-200">
                                  {isResearchMode ? "Zynt Deep Research Agent" : "Zynt AI"}
                                </span>
                              </div>

                              {/* Progress Status Text */}
                              <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono mb-4 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                <span>
                                  {isResearchMode
                                    ? researchLoadingSteps[loadingStepIdx]
                                    : "Thinking and generating answer..."}
                                </span>
                              </div>

                              {/* Skeleton Lines */}
                              <div className="space-y-2.5">
                                <Skeleton className="h-4 w-11/12 bg-zinc-800/80" />
                                <Skeleton className="h-4 w-4/5 bg-zinc-800/80" />
                                <Skeleton className="h-3.5 w-3/5 bg-zinc-800/80" />
                              </div>
                            </div>
                          ) : (
                            /* Final AI Report Container */
                            <div className="prose-zynt text-zinc-200 bg-transparent px-1 sm:px-2">
                              {/* Avatar / Brand badge atop report */}
                              <div className="flex items-center justify-between mb-3 border-b border-zinc-850 pb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 text-indigo-400" />
                                  </div>
                                  <span className="font-display font-semibold text-xs text-zinc-300 tracking-tight">
                                    Zynt AI
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                    • {isResearchMode ? "Synthesized Research" : "Direct Answer"}
                                  </span>
                                </div>

                                {/* Message action toolbar */}
                                <div className="flex items-center gap-1 opacity-60 group-hover/msg:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleCopyReport(message.text, message.id)}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                                    title="Copy entire report"
                                  >
                                    {copiedMessageId === message.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400 font-medium">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDownloadReport(message.text)}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                                    title="Download as Markdown"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Export</span>
                                  </button>
                                </div>
                              </div>

                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code: ({ className, children }: any) => {
                                    const isBlock = className?.includes("language-")
                                    if (isBlock) {
                                      return (
                                        <CodeBlock language={className}>
                                          {String(children).replace(/\n$/, "")}
                                        </CodeBlock>
                                      )
                                    }
                                    return (
                                      <code
                                        className={`px-1.5 py-0.5 rounded text-xs font-mono bg-zinc-900 border border-zinc-800 ${
                                          isResearchMode ? "text-indigo-300" : "text-teal-300"
                                        }`}
                                      >
                                        {children}
                                      </code>
                                    )
                                  },
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`underline underline-offset-4 transition-colors font-medium ${
                                        isResearchMode
                                          ? "text-indigo-400 hover:text-indigo-300"
                                          : "text-teal-400 hover:text-teal-300"
                                      }`}
                                    >
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {message.text}
                              </ReactMarkdown>

                              {/* Viewable Sources Grid */}
                              {message.sources && message.sources.length > 0 && (
                                <div className="mt-6 border-t border-zinc-850 pt-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                                    <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                                      Referenced Live Sources ({message.sources.length})
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {message.sources.map((src, idx) => (
                                      <SourceCard
                                        key={idx}
                                        index={idx + 1}
                                        title={src.title}
                                        url={src.url}
                                        isResearchMode={isResearchMode}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Floating "Scroll to Bottom" Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="fixed bottom-36 left-1/2 -translate-x-1/2 z-30"
          >
            <button
              onClick={() => scrollToBottom({ behavior: "smooth" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-750 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-medium shadow-xl backdrop-blur-md transition-all active:scale-95"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Latest Messages</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pt-8 pb-5 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto px-4 pointer-events-auto">
          <div
            className={`relative flex flex-col bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden ${
              isResearchMode
                ? "focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10"
                : "focus-within:border-teal-500/50 focus-within:ring-2 focus-within:ring-teal-500/10"
            }`}
          >
            {/* Top Half: Auto-Resizing Textarea */}
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isResearchMode
                    ? "Ask the Research Agent anything (e.g. latest news, technology, science)..."
                    : "Message Zynt AI..."
                }
                rows={1}
                className="auto-resize-textarea bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-500 text-sm px-4 pt-3.5 pb-2 resize-none leading-relaxed selection:bg-indigo-500/30"
              />

              {/* Clear button if text exists */}
              {input.length > 0 && (
                <button
                  onClick={() => setInput("")}
                  className="absolute right-3 top-3 p-1 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bottom Half: Action Bar */}
            <div className="flex items-center justify-between px-3.5 pb-3 pt-1 border-t border-zinc-850/40">
              {/* Mode Toggle Button on Left */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleMode(!isResearchMode)}
                  className={`rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-all duration-200 select-none ${
                    isResearchMode
                      ? "text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 shadow-sm shadow-indigo-500/10 hover:bg-indigo-500/25"
                      : "text-zinc-400 bg-zinc-850/60 border border-zinc-750 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                  title={
                    isResearchMode
                      ? "Research Mode active: web search & multi-source synthesis enabled."
                      : "Click to enable Agent Research Mode."
                  }
                >
                  <Globe
                    className={`w-3.5 h-3.5 ${
                      isResearchMode ? "text-indigo-400 animate-pulse" : "text-zinc-400"
                    }`}
                  />
                  <span>Agent Research</span>
                </button>
              </div>

              {/* Right side: Keyboard hint + Send Button */}
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline select-none">
                  ↵ to send • ⇧↵ newline
                </span>

                <button
                  id="chat-send-btn"
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || loading}
                  className={`w-8 h-8 rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95 ${
                    input.trim() && !loading
                      ? isResearchMode
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer"
                        : "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/30 cursor-pointer"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                  title="Send message"
                  aria-label="Send message"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-300" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 text-center mt-2.5 select-none tracking-tight">
            {isResearchMode
              ? "Zynt compiles live intelligence from verified web indexes. Always verify critical facts."
              : "Zynt AI may produce inaccurate information. Please verify important details."}
          </p>
        </div>
      </div>
    </div>
  )
}
