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
  Atom,
  HeartPulse,
  Zap,
  TrendingUp,
  Brain,
  PenTool,
  Compass,
  X,
  BookOpen,
  Square,
  RotateCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Wand2,
  Edit3
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

type ToneType = "balanced" | "executive" | "academic" | "eli5"

const CURRENT_YEAR = new Date().getFullYear()

const researchPromptCards = [
  {
    icon: Atom,
    category: "Quantum Tech",
    prompt: `What are the latest breakthroughs in quantum computing and error correction in ${CURRENT_YEAR}?`,
  },
  {
    icon: HeartPulse,
    category: "Healthcare AI",
    prompt: `How is generative AI transforming drug discovery and clinical trials in ${CURRENT_YEAR}?`,
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
  "Formulating targeted search vectors with reasoning engine...",
  "Querying verified web indexes via Tavily...",
  "Cross-referencing evidence and evaluating source reliability...",
  "Synthesizing structured findings into comprehensive report...",
]

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")

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
  
  // Advanced features state
  const [tone, setTone] = useState<ToneType>("balanced")
  const [isListening, setIsListening] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [editedPromptText, setEditedPromptText] = useState("")
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>(() => {
    try {
      return JSON.parse(localStorage.getItem("zynt_feedback") || "{}")
    } catch {
      return {}
    }
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<any>(null)

  // Cycle through research loading steps for rich progress feedback
  useEffect(() => {
    let interval: any
    if (loading && isResearchMode) {
      setLoadingStepIdx(0)
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev < researchLoadingSteps.length - 1 ? prev + 1 : prev))
      }, 2800)
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

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Escape: Stop active generation
      if (e.key === "Escape" && loading) {
        e.preventDefault()
        handleStopGeneration()
        return
      }

      // Voice Input: Ctrl+M / Cmd+M or Alt+M
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") ||
        (e.altKey && e.key.toLowerCase() === "m")
      ) {
        e.preventDefault()
        toggleVoiceInput()
        return
      }

      // Prompt Enhancement: Ctrl+E / Cmd+E or Alt+E
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") ||
        (e.altKey && e.key.toLowerCase() === "e")
      ) {
        e.preventDefault()
        handleEnhancePrompt()
        return
      }


    }
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [loading, input, isListening, isResearchMode])

  // Stop / Cancel active generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoading(false)
    // Remove empty loading message if present
    onUpdateMessages(sessionMessages.filter((m) => !m.isLoading))
    toast({
      title: "Generation Halted",
      description: "Research request was cancelled.",
    })
  }

  // Speech-to-Text Voice Input
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser does not support Web Speech. Please use Google Chrome or Microsoft Edge.",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = "en-US"
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsListening(true)
        toast({
          title: "Listening...",
          description: "Speak clearly into your microphone.",
        })
      }

      recognition.onresult = (event: any) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        if (event.error !== "no-speech") {
          toast({
            title: "Microphone Error",
            description: `Speech input error: ${event.error}`,
            variant: "destructive",
          })
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e: any) {
      console.error(e)
      setIsListening(false)
    }
  }

  // Text-to-Speech (Read Aloud)
  const handleReadAloud = (text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast({
        title: "Text-to-Speech Unavailable",
        description: "Your browser does not support audio speech synthesis.",
        variant: "destructive",
      })
      return
    }

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel()
      setSpeakingMessageId(null)
      return
    }

    window.speechSynthesis.cancel()

    // Strip markdown formatting symbols for natural spoken speech
    const cleanSpeechText = text
      .replace(/###\s+/g, "")
      .replace(/##\s+/g, "")
      .replace(/#\s+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[\d+\]/g, "")
      .replace(/\[\^?\w+\]/g, "")
      .replace(/https?:\/\/[^\s)]+/g, "")
      .replace(/\|/g, " ")
      .replace(/-{3,}/g, "")
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText.slice(0, 1500))
    utterance.rate = 1.05
    utterance.pitch = 1.0

    utterance.onend = () => setSpeakingMessageId(null)
    utterance.onerror = () => setSpeakingMessageId(null)

    window.speechSynthesis.speak(utterance)
    setSpeakingMessageId(id)
  }

  // Feedback (Thumbs Up / Thumbs Down)
  const handleFeedback = (id: string, type: "up" | "down") => {
    const updated = {
      ...feedbackMap,
      [id]: feedbackMap[id] === type ? undefined : type,
    }
    // Clean undefined
    if (!updated[id]) delete updated[id]

    setFeedbackMap(updated as Record<string, "up" | "down">)
    localStorage.setItem("zynt_feedback", JSON.stringify(updated))
    toast({
      title: type === "up" ? "Helpful Feedback Saved" : "Feedback Received",
      description: type === "up" ? "Glad this research was useful!" : "Thanks for helping us refine Zynt AI.",
    })
  }

  // Prompt Enhancer (Magic Wand) - unwraps prior enhancements to avoid nesting
  const handleEnhancePrompt = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const researchRegex = /^Conduct an in-depth research investigation on: (.*?)\. Provide core principles, latest \d{4} breakthroughs, key challenges, and industry implications\.$/
    const simpleRegex = /^Provide a comprehensive, clear, and well-structured answer explaining: (.*?)\. Include practical examples and key takeaways\.$/

    let coreQuery = trimmed
    const matchR = trimmed.match(researchRegex)
    const matchS = trimmed.match(simpleRegex)
    if (matchR && matchR[1]) coreQuery = matchR[1]
    else if (matchS && matchS[1]) coreQuery = matchS[1]

    let enhanced = coreQuery
    if (isResearchMode) {
      enhanced = `Conduct an in-depth research investigation on: ${coreQuery}. Provide core principles, latest ${CURRENT_YEAR} breakthroughs, key challenges, and industry implications.`
    } else {
      enhanced = `Provide a comprehensive, clear, and well-structured answer explaining: ${coreQuery}. Include practical examples and key takeaways.`
    }

    setInput(enhanced)
    toast({
      title: isResearchMode ? "Research Prompt Enhanced" : "Chat Prompt Structured",
      description: isResearchMode
        ? "Expanded prompt with research instructions for maximum depth."
        : "Structured prompt for a clear, direct answer with examples.",
    })
  }

  // Seamlessly adapt prompt template when user toggles mode so there is never a clash
  useEffect(() => {
    if (!input.trim()) return

    const researchRegex = /^Conduct an in-depth research investigation on: (.*?)\. Provide core principles, latest \d{4} breakthroughs, key challenges, and industry implications\.$/
    const simpleRegex = /^Provide a comprehensive, clear, and well-structured answer explaining: (.*?)\. Include practical examples and key takeaways\.$/

    if (!isResearchMode) {
      // Switched to Simple Chat: convert research template to chat template
      const match = input.match(researchRegex)
      if (match && match[1]) {
        setInput(`Provide a comprehensive, clear, and well-structured answer explaining: ${match[1]}. Include practical examples and key takeaways.`)
      }
    } else {
      // Switched to Agent Research: convert chat template to research template
      const match = input.match(simpleRegex)
      if (match && match[1]) {
        setInput(`Conduct an in-depth research investigation on: ${match[1]}. Provide core principles, latest ${CURRENT_YEAR} breakthroughs, key challenges, and industry implications.`)
      }
    }
  }, [isResearchMode])


  // Core Submit Handler
  const handleSubmit = async (q?: string, targetAssistantId?: string) => {
    const rawQuery = (q ?? input).trim()
    if (!rawQuery || loading) return

    // Apply Persona / Tone prefix if applicable
    let finalPrompt = rawQuery
    if (tone === "executive") {
      finalPrompt = `[Executive Brief format: prioritize concise, high-impact bullet points and strategic decisions]: ${rawQuery}`
    } else if (tone === "academic") {
      finalPrompt = `[Academic Analysis format: emphasize formal methodology, evidence, and theoretical rigor]: ${rawQuery}`
    } else if (tone === "eli5") {
      finalPrompt = `[Explain Like I'm 5 format: use clear, everyday analogies and zero technical jargon]: ${rawQuery}`
    }

    setInput("")
    setLoading(true)

    const userMessageId = `msg-${Date.now()}-user`
    const assistantMessageId = targetAssistantId || `msg-${Date.now()}-assistant`

    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      text: rawQuery,
    }

    const loadingMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
      isLoading: true,
    }

    let messagesSnapshot = [...sessionMessages]
    if (targetAssistantId) {
      // Regenerate flow: replace existing assistant message with loading
      messagesSnapshot = messagesSnapshot.map((m) =>
        m.id === targetAssistantId ? loadingMsg : m
      )
      onUpdateMessages(messagesSnapshot)
    } else {
      messagesSnapshot = [...messagesSnapshot, userMsg, loadingMsg]
      onUpdateMessages(messagesSnapshot)
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch(`${API_BASE_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: finalPrompt,
          mode: isResearchMode ? "research" : "simple",
        }),
      })

      if (!response.ok) {
        let errorDetail = `Server returned HTTP ${response.status}`
        try {
          const errData = await response.json()
          if (errData && errData.detail) {
            errorDetail =
              typeof errData.detail === "string"
                ? errData.detail
                : JSON.stringify(errData.detail)
          }
        } catch {}
        throw new Error(errorDetail)
      }

      const data = await response.json()

      const finalMessages = messagesSnapshot.map((m) => {
        if (m.id === assistantMessageId) {
          return {
            id: assistantMessageId,
            role: "assistant" as const,
            text: data.research_data || "No response received.",
            sources: data.metadata || [],
            isLoading: false,
          }
        }
        return m
      })

      onUpdateMessages(finalMessages)
    } catch (error: any) {
      if (error?.name === "AbortError") {
        // Handled cleanly by handleStopGeneration
        return
      }
      // Remove loading indicator on failure
      onUpdateMessages(messagesSnapshot.filter((m) => m.id !== assistantMessageId))
      toast({
        title: "Research Request Error",
        description:
          error?.message || `Could not connect to the research server at ${API_BASE_URL}.`,
        variant: "destructive",
      })
    } finally {
      abortControllerRef.current = null
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Regenerate Assistant Message
  const handleRegenerate = (assistantId: string) => {
    const idx = sessionMessages.findIndex((m) => m.id === assistantId)
    if (idx <= 0) return
    const prevUserMsg = sessionMessages[idx - 1]
    if (prevUserMsg && prevUserMsg.role === "user") {
      handleSubmit(prevUserMsg.text, assistantId)
    }
  }

  // Save Edited User Prompt & Resubmit
  const handleSaveEditedPrompt = (messageId: string) => {
    if (!editedPromptText.trim()) {
      setEditingPromptId(null)
      return
    }
    const idx = sessionMessages.findIndex((m) => m.id === messageId)
    if (idx === -1) return

    // Truncate messages after this point and resubmit
    const truncated = sessionMessages.slice(0, idx)
    onUpdateMessages(truncated)
    setEditingPromptId(null)
    handleSubmit(editedPromptText.trim())
  }

  // Keyboard Submission & In-Input Shortcuts (IME safe)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (e.nativeEvent.isComposing || (e.nativeEvent as any).keyCode === 229) {
        return
      }
      handleSubmit()
      return
    }

    // Ctrl+M / Cmd+M or Alt+M: Toggle Voice Input
    if (
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") ||
      (e.altKey && e.key.toLowerCase() === "m")
    ) {
      e.preventDefault()
      toggleVoiceInput()
      return
    }

    // Ctrl+E / Cmd+E or Alt+E: Enhance Prompt
    if (
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") ||
      (e.altKey && e.key.toLowerCase() === "e")
    ) {
      e.preventDefault()
      handleEnhancePrompt()
      return
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
    toast({
      title: "Report Downloaded",
      description: `Saved as ${filename}`,
    })
  }

  const promptCards = isResearchMode ? researchPromptCards : simplePromptCards
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0

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
                      className={`max-w-[94%] sm:max-w-[88%] ${
                        isUser ? "text-right" : "text-left"
                      }`}
                    >
                      {isUser ? (
                        /* User Message Bubble */
                        <div className="relative inline-block text-left">
                          {editingPromptId === message.id ? (
                            /* Inline Edit Mode */
                            <div className="bg-zinc-900 border border-indigo-500/50 p-3 rounded-2xl shadow-xl w-72 sm:w-96">
                              <textarea
                                value={editedPromptText}
                                onChange={(e) => setEditedPromptText(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 outline-none resize-none focus:border-indigo-500"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2 mt-2">
                                <button
                                  onClick={() => setEditingPromptId(null)}
                                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEditedPrompt(message.id)}
                                  className="px-3 py-1 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500"
                                >
                                  Save & Submit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="bg-zinc-800/90 text-zinc-50 border border-zinc-700/60 px-5 py-3 rounded-2xl rounded-tr-sm text-sm shadow-md backdrop-blur-sm">
                                <p className="leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/40">
                                  {message.text}
                                </p>
                              </div>

                              {/* Action Bar on User Message */}
                              <div className="absolute -left-16 top-2 flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingPromptId(message.id)
                                    setEditedPromptText(message.text)
                                  }}
                                  className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                                  title="Edit and resubmit question"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleCopyReport(message.text, message.id)}
                                  className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                                  title="Copy prompt"
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* Assistant Message Bubble */
                        <div className="space-y-4">
                          {message.isLoading ? (
                            /* Multi-step Live Reasoning Indicator */
                            <div className="p-5 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl rounded-tl-sm w-full max-w-lg shadow-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                                    <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                                  </div>
                                  <span className="text-xs font-semibold text-zinc-200">
                                    {isResearchMode ? "Zynt Deep Research Agent" : "Zynt AI"}
                                  </span>
                                </div>
                                <button
                                  onClick={handleStopGeneration}
                                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono"
                                  title="Stop generation (Esc)"
                                >
                                  <Square className="w-3 h-3 fill-current" />
                                  <span>Stop</span>
                                </button>
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

                              {/* Action Toolbar at the end of the chat response */}
                              <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Read Aloud Button */}
                                  <button
                                    onClick={() => handleReadAloud(message.text, message.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                                      speakingMessageId === message.id
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse"
                                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-zinc-800/60"
                                    }`}
                                    title={speakingMessageId === message.id ? "Stop reading aloud" : "Read aloud (Text to speech)"}
                                  >
                                    {speakingMessageId === message.id ? (
                                      <>
                                        <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Stop</span>
                                      </>
                                    ) : (
                                      <>
                                        <Volume2 className="w-3.5 h-3.5" />
                                        <span>Listen</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Regenerate Button */}
                                  <button
                                    onClick={() => handleRegenerate(message.id)}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-zinc-800/60 transition-all disabled:opacity-40"
                                    title="Regenerate this response"
                                  >
                                    <RotateCw className="w-3.5 h-3.5" />
                                    <span>Retry</span>
                                  </button>

                                  {/* Copy Button */}
                                  <button
                                    onClick={() => handleCopyReport(message.text, message.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-zinc-800/60 transition-all"
                                    title="Copy entire report"
                                  >
                                    {copiedMessageId === message.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Export Markdown Button */}
                                  <button
                                    onClick={() => handleDownloadReport(message.text)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-zinc-800/60 transition-all"
                                    title="Download as Markdown (.md)"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Export</span>
                                  </button>
                                </div>

                                {/* Helpful Feedback Reactions */}
                                <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
                                  <span className="text-[10px] text-zinc-500 mr-1 hidden sm:inline">Was this helpful?</span>
                                  <button
                                    onClick={() => handleFeedback(message.id, "up")}
                                    className={`p-1.5 rounded-md border transition-all ${
                                      feedbackMap[message.id] === "up"
                                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 border-transparent"
                                    }`}
                                    title="Helpful response"
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleFeedback(message.id, "down")}
                                    className={`p-1.5 rounded-md border transition-all ${
                                      feedbackMap[message.id] === "down"
                                        ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 border-transparent"
                                    }`}
                                    title="Unhelpful response"
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
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
            className="fixed bottom-40 left-1/2 -translate-x-1/2 z-30"
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
          {/* Research Tone / Persona Pills */}
          <div className="flex items-center justify-between px-2 mb-2 text-[11px]">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider mr-1 select-none">
                Tone:
              </span>
              {(
                [
                  { id: "balanced", label: "⚖️ Balanced" },
                  { id: "executive", label: "📋 Executive" },
                  { id: "academic", label: "🎓 Academic" },
                  { id: "eli5", label: "💡 ELI5" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                    tone === t.id
                      ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Live Stats: Word and Char counter */}
            {input.length > 0 && (
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline select-none">
                {wordCount} words • {input.length} chars
              </span>
            )}
          </div>

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
                  isListening
                    ? "Listening... speak now..."
                    : isResearchMode
                    ? "Ask the Research Agent anything (e.g. latest news, technology, science)..."
                    : "Message Zynt AI..."
                }
                rows={1}
                className="auto-resize-textarea bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-500 text-sm px-4 pt-3.5 pb-2 resize-none leading-relaxed selection:bg-indigo-500/30"
              />

              {/* Clear button if text exists */}
              {input.length > 0 && !loading && (
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
              {/* Left Side: Mode Toggle + Tools */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (loading) {
                      toast({
                        title: "Action Restricted",
                        description: "Cannot switch modes while generation is in progress. Press Stop (Esc) first.",
                        variant: "destructive",
                      })
                      return
                    }
                    onToggleMode(!isResearchMode)
                  }}
                  disabled={loading}
                  className={`rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-all duration-200 select-none ${
                    isResearchMode
                      ? "text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 shadow-sm shadow-indigo-500/10 hover:bg-indigo-500/25"
                      : "text-teal-300 bg-teal-500/15 border border-teal-500/40 shadow-sm shadow-teal-500/10 hover:bg-teal-500/25"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={`Switch to ${isResearchMode ? "Simple Chat" : "Agent Research"} mode (Ctrl+Shift+M or Alt+R)`}
                >
                  {isResearchMode ? (
                    <>
                      <Globe className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Agent Research</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                      <span>Simple Chat</span>
                    </>
                  )}
                </button>

                {/* Voice Input (Speech to Text) */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={loading}
                  className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                    isListening
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                  title={isListening ? "Listening... click to stop (Ctrl+M / Alt+M)" : "Voice input (Speech to text) (Ctrl+M / Alt+M)"}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] text-rose-400 font-mono hidden sm:inline">Listening</span>
                    </>
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Prompt Enhancer (Magic Wand) */}
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!input.trim() || loading}
                  className="p-1.5 rounded-lg text-xs text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title="Enhance prompt for maximum research depth"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right Side: Keyboard hint + Stop / Send Button */}
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline select-none">
                  ↵ to send • ⇧↵ newline
                </span>

                {loading ? (
                  /* Dedicated Stop Button */
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="h-8 px-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1.5 text-xs font-medium shadow-md shadow-rose-500/10 cursor-pointer animate-pulse transition-all active:scale-95"
                    title="Stop generating (Esc)"
                    aria-label="Stop generating"
                  >
                    <Square className="w-3 h-3 fill-rose-300" />
                    <span>Stop</span>
                  </button>
                ) : (
                  /* Send Button */
                  <button
                    id="chat-send-btn"
                    onClick={() => handleSubmit()}
                    disabled={!input.trim()}
                    className={`w-8 h-8 rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95 ${
                      input.trim()
                        ? isResearchMode
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer"
                          : "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/30 cursor-pointer"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                    title="Send message"
                    aria-label="Send message"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 text-center mt-2 select-none tracking-tight">
            {isResearchMode
              ? "Zynt compiles live intelligence from verified web indexes. Always verify critical facts."
              : "Zynt AI may produce inaccurate information. Please verify important details."}
          </p>
        </div>
      </div>
    </div>
  )
}
