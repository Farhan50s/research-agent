import { motion } from "framer-motion"
import { ExternalLink, Globe, BookMarked } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Source {
  title: string
  url: string
}

interface ResearchResultsProps {
  researchData: string
  metadata: Source[]
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  return (
    <motion.a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      className="block group"
    >
      <Card className="glass border-border/50 p-4 hover:border-primary/40 hover:bg-primary/5 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {source.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {getDomain(source.url)}
            </p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary flex-shrink-0 transition-colors mt-0.5" />
        </div>
      </Card>
    </motion.a>
  )
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-nexus">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: ({ children, className }: any) => {
            const isBlock = className?.includes("language-")
            if (isBlock) {
              return <pre><code>{children}</code></pre>
            }
            return <code>{children}</code>
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
          table: ({ children }) => <table>{children}</table>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          hr: () => <hr />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export function ResearchResults({ researchData, metadata }: ResearchResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl mx-auto"
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Report - 2/3 */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="glass border-border/50">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <BookMarked className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-sm">Research Report</h2>
                <p className="text-xs text-muted-foreground">AI-generated analysis</p>
              </div>
              <div className="ml-auto">
                <Badge variant="glow" className="text-xs">
                  ✦ AI Generated
                </Badge>
              </div>
            </div>
            <ScrollArea className="h-[70vh]">
              <div className="p-6 lg:p-8">
                <MarkdownContent content={researchData} />
              </div>
            </ScrollArea>
          </Card>
        </motion.div>

        {/* Sources Sidebar - 1/3 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-display font-semibold text-sm">Sources</h2>
            <Badge variant="secondary" className="text-xs">
              {metadata.length}
            </Badge>
          </div>

          <ScrollArea className="h-[70vh] pr-1">
            <div className="space-y-3">
              {metadata.length > 0 ? (
                metadata.map((source, i) => (
                  <SourceCard key={i} source={source} index={i} />
                ))
              ) : (
                <Card className="glass border-border/50 p-6 text-center">
                  <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No sources available</p>
                </Card>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </motion.div>
  )
}
