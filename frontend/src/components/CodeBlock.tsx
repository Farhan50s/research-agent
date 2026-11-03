import { useState } from "react"
import { Check, Copy } from "lucide-react"

interface CodeBlockProps {
  language?: string
  children: string
}

export function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code: ", err)
    }
  }

  const cleanLang = (language || "").replace("language-", "").trim()

  return (
    <div className="relative my-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-md group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-900/60 text-xs">
        <span className="font-mono text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
          {cleanLang || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Copy code to clipboard"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
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
      </div>

      {/* Code Content */}
      <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed scrollbar-thin">
        <code>{children}</code>
      </pre>
    </div>
  )
}
