import { Globe, ExternalLink } from "lucide-react"

interface SourceCardProps {
  index: number
  title: string
  url: string
  isResearchMode?: boolean
}

export function SourceCard({ index, title, url, isResearchMode = true }: SourceCardProps) {
  let domain = ""
  try {
    const parsed = new URL(url)
    domain = parsed.hostname.replace(/^www\./, "")
  } catch (e) {
    domain = url
  }

  // Google Favicon API for high-resolution source favicons
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : ""

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 transition-all duration-200 hover:-translate-y-0.5 shadow-sm max-w-[280px] sm:max-w-[320px] ${
        isResearchMode
          ? "hover:border-indigo-500/40 hover:bg-zinc-850 hover:shadow-indigo-500/5"
          : "hover:border-teal-500/40 hover:bg-zinc-850 hover:shadow-teal-500/5"
      }`}
      title={`${title} (${url})`}
    >
      {/* Index badge */}
      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono flex items-center justify-center font-semibold group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
        {index}
      </span>

      {/* Favicon or fallback Globe icon */}
      <div className="w-4 h-4 flex-shrink-0 rounded overflow-hidden flex items-center justify-center">
        {domain ? (
          <img
            src={faviconUrl}
            alt=""
            className="w-3.5 h-3.5 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
            onError={(e) => {
              // Hide broken image
              e.currentTarget.style.display = "none"
            }}
          />
        ) : (
          <Globe className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
        )}
      </div>

      {/* Title & Domain */}
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-zinc-200 group-hover:text-zinc-50 transition-colors">
          {title || domain || "Source Reference"}
        </p>
        {domain && (
          <p className="truncate text-[10px] text-zinc-500 font-mono">
            {domain}
          </p>
        )}
      </div>

      <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
    </a>
  )
}
