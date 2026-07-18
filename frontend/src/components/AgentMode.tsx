import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ExternalLink, ArrowUp, RefreshCw, MessageSquare, Globe } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Source {
  title: string;
  url: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  isLoading?: boolean;
}

const suggestedResearchQueries = [
  "What are the latest breakthroughs in quantum computing?",
  "How is AI transforming healthcare in 2024?",
  "What is the current state of fusion energy research?",
  "Explain the economic impact of climate change policies",
]

const suggestedSimpleQueries = [
  "Explain quantum computing in simple terms",
  "Write a polite email asking for feedback on a project",
  "Suggest 5 healthy breakfast options under 10 minutes",
  "Give me a quick summary of general relativity",
]

export function AgentMode() {
  const [isResearchMode, setIsResearchMode] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Welcome message based on mode
  const welcomeText = isResearchMode
    ? "Hello! I am your AI Research Agent. Ask me anything, and I will search the web, synthesize multiple sources, and write a detailed research report for you."
    : "Hello! How can I help you today? I'm ready for a quick, conversational exchange."

  const handleSubmit = async (q?: string) => {
    const queryText = q ?? input
    if (!queryText.trim() || loading) return

    setInput("")
    setLoading(true)

    const userMessageId = `msg-${Date.now()}-user`
    const assistantMessageId = `msg-${Date.now()}-assistant`

    // Append user message
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMessageId,
        role: "user",
        text: queryText,
      },
    ]
    setMessages(newMessages)

    // Add placeholder loading bubble
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        text: "",
        isLoading: true,
      },
    ])

    try {
      const response = await fetch("http://127.0.0.1:8000/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: queryText,
          mode: isResearchMode ? "research" : "simple"
        }),
      })

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`)
      }

      const data = await response.json()

      // Replace placeholder with final research results
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                text: data.research_data || "No response received.",
                sources: data.metadata || [],
                isLoading: false,
              }
            : msg
        )
      )
    } catch (error) {
      // Remove loading bubble
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId))
      toast({
        title: "Backend Unreachable",
        description: "Could not connect to the research server at http://127.0.0.1:8000. Please ensure the backend server is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      // Focus input back
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Submit on enter (unless shift key is pressed)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const suggestedQueries = isResearchMode ? suggestedResearchQueries : suggestedSimpleQueries

  // Dynamic visual styling based on toggle mode
  const sendButtonColor = input.trim() 
    ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer" 
    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"

  const iconColor = isResearchMode ? "text-indigo-400" : "text-teal-400"
  const iconBg = isResearchMode ? "bg-indigo-600/10 border-indigo-500/20" : "bg-teal-600/10 border-teal-500/20"
  const focusBorderColor = isResearchMode ? "focus-within:border-indigo-500/50" : "focus-within:border-teal-500/50"
  const focusRingColor = isResearchMode ? "focus-within:ring-indigo-500/10" : "focus-within:ring-teal-500/10"

  return (
    <div className="flex flex-col flex-1 max-w-3xl w-full mx-auto px-4 pb-44 pt-6">
      {/* Scrollable messages container */}
      <div className="flex-1 space-y-6">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            /* EMPTY STATE GREETING */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
            >
              <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center border shadow-md mb-6 animate-pulse`}>
                {isResearchMode ? (
                  <Sparkles className={`w-6 h-6 ${iconColor}`} />
                ) : (
                  <MessageSquare className={`w-6 h-6 ${iconColor}`} />
                )}
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-zinc-50 mb-3 tracking-tight">
                {isResearchMode ? "What would you like to research today?" : "How can I help you today?"}
              </h1>
              <p className="text-zinc-400 text-sm max-w-md mb-8">
                {isResearchMode
                  ? "Ask a question to generate a comprehensive markdown report synthesized from live web sources."
                  : "Have a quick, casual conversation with the AI assistant."}
              </p>

              {/* Suggested prompt chips */}
              <div className="grid sm:grid-cols-2 gap-3 w-full max-w-xl">
                {suggestedQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(q)}
                    className={`text-left text-xs bg-zinc-900 border border-zinc-800 hover:bg-zinc-900/80 text-zinc-300 hover:text-zinc-50 p-4 rounded-xl transition-all duration-200 ${
                      isResearchMode ? "hover:border-indigo-500/30" : "hover:border-teal-500/30"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* MESSAGE THREAD */
            <div className="space-y-6">
              {/* Manual Welcome Message at start of thread */}
              <div className="flex justify-start w-full">
                <div className="max-w-[85%] sm:max-w-[80%] text-left">
                  <div className="prose-nexus text-zinc-200 bg-transparent px-2">
                    <p className="text-sm text-zinc-300 leading-relaxed mb-4">{welcomeText}</p>
                  </div>
                </div>
              </div>

              {messages.map((message) => {
                const isUser = message.role === "user"

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? "text-right" : "text-left"}`}>
                      {isUser ? (
                        /* User Message Bubble */
                        <div className="bg-zinc-800 text-zinc-50 px-5 py-3 rounded-2xl rounded-tr-none text-sm inline-block shadow-md">
                          <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                        </div>
                      ) : (
                        /* Assistant Message Bubble */
                        <div className="space-y-4">
                          {message.isLoading ? (
                            /* Pulse Loading Skeleton Indicator */
                            <div className="space-y-3 p-4 bg-zinc-900 border border-zinc-850 rounded-2xl rounded-tl-none w-[320px] sm:w-[450px] shadow-sm">
                              <div className="flex gap-1.5 items-center mb-4">
                                <span className={`w-1.5 h-1.5 rounded-full ${isResearchMode ? "bg-indigo-400" : "bg-teal-400"} animate-bounce`} style={{ animationDelay: "0ms" }} />
                                <span className={`w-1.5 h-1.5 rounded-full ${isResearchMode ? "bg-indigo-400" : "bg-teal-400"} animate-bounce`} style={{ animationDelay: "150ms" }} />
                                <span className={`w-1.5 h-1.5 rounded-full ${isResearchMode ? "bg-indigo-400" : "bg-teal-400"} animate-bounce`} style={{ animationDelay: "300ms" }} />
                                <span className="text-[10px] text-zinc-500 font-medium ml-2 uppercase tracking-wider">
                                  {isResearchMode ? "Compiling Sources..." : "Thinking..."}
                                </span>
                              </div>
                              <Skeleton className="h-4 w-5/6 bg-zinc-800" />
                              <Skeleton className="h-4 w-full bg-zinc-800" />
                              <Skeleton className="h-3.5 w-3/4 bg-zinc-800" />
                            </div>
                          ) : (
                            /* AI Response Report Container */
                            <div className="prose-nexus text-zinc-200 bg-transparent px-2">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children }) => <h1 className="text-xl font-bold tracking-tight text-zinc-50 mt-2 mb-3">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-lg font-semibold tracking-tight text-zinc-200 mt-6 mb-2 border-b border-zinc-800/80 pb-1">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-md font-medium text-zinc-300 mt-4 mb-2">{children}</h3>,
                                  p: ({ children }) => <p className="text-sm text-zinc-300 leading-relaxed mb-4">{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 mb-4 text-zinc-300 text-sm">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-zinc-300 text-sm">{children}</ol>,
                                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                  blockquote: ({ children }) => (
                                    <blockquote className={`border-l-2 ${isResearchMode ? "border-indigo-500/60 bg-indigo-500/5" : "border-teal-500/60 bg-teal-500/5"} pl-4 py-1 my-4 italic text-zinc-400 rounded-r`}>
                                      {children}
                                    </blockquote>
                                  ),
                                  code: ({ children, className }: any) => {
                                    const isBlock = className?.includes("language-")
                                    if (isBlock) {
                                      return (
                                        <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 overflow-x-auto text-xs my-3 text-zinc-200">
                                          <code>{children}</code>
                                        </pre>
                                      )
                                    }
                                    return (
                                      <code className={`bg-zinc-900 ${isResearchMode ? "text-indigo-400" : "text-teal-400"} border border-zinc-850 rounded px-1.5 py-0.5 text-xs font-mono`}>
                                        {children}
                                      </code>
                                    )
                                  },
                                  a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 transition-colors ${isResearchMode ? "text-indigo-400 hover:text-indigo-300" : "text-teal-400 hover:text-teal-300"}`}>
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {message.text}
                              </ReactMarkdown>

                              {/* Viewable Sources row display immediately under message */}
                              {message.sources && message.sources.length > 0 && (
                                <div className="mt-4 border-t border-zinc-800/50 pt-3">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Viewed Sources:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {message.sources.map((src, idx) => (
                                      <a
                                        key={idx}
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 transition-all font-medium max-w-[240px] ${
                                          isResearchMode ? "hover:text-indigo-400 hover:border-indigo-500/30" : "hover:text-teal-400 hover:border-teal-500/30"
                                        }`}
                                      >
                                        <span className="truncate">{src.title || "Source"}</span>
                                        <ExternalLink className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                                      </a>
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

      {/* Sticky Bottom DeepSeek-style Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 z-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className={`relative flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl ${focusBorderColor} ${focusRingColor} transition-all duration-300 overflow-hidden`}>
            {/* Top Half: Text Input */}
            <textarea
              ref={inputRef}
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isResearchMode ? "Ask the Research Agent anything..." : "Message the AI..."}
              className="w-full bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-500 text-sm p-4 resize-none min-h-[80px]"
            />

            {/* Bottom Half: Action Bar */}
            <div className="flex items-center justify-between px-4 pb-3">
              {/* Deep Research Toggle Button on Left */}
              <button
                onClick={() => setIsResearchMode(!isResearchMode)}
                className={`rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-medium transition-all duration-200 select-none ${
                  isResearchMode
                    ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/50 shadow-sm shadow-indigo-500/10"
                    : "text-zinc-400 bg-transparent border border-zinc-700 hover:bg-zinc-850 hover:text-zinc-200"
                }`}
              >
                <Globe className={`w-3.5 h-3.5 ${isResearchMode ? "text-indigo-400" : "text-zinc-400"}`} />
                Deep Research
              </button>

              {/* Send Button on Right */}
              <button
                id="chat-send-btn"
                onClick={() => handleSubmit()}
                disabled={!input.trim() || loading}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${sendButtonColor}`}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 text-center mt-2.5 select-none">
            {isResearchMode 
              ? "NexusAI synthesis results are built from live search indexes. Verify information."
              : "NexusAI can make mistakes. Please verify important details."}
          </p>
        </div>
      </div>
    </div>
  )
}
