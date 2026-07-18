import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Brain, Globe, BookOpen, FileEdit, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"

const phases = [
  {
    icon: Brain,
    label: "Planning research strategy...",
    sublabel: "Analyzing your query and identifying key research areas",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  {
    icon: Globe,
    label: "Searching the web...",
    sublabel: "Querying multiple authoritative sources and databases",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
  },
  {
    icon: BookOpen,
    label: "Synthesizing sources...",
    sublabel: "Cross-referencing information and validating findings",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    icon: FileEdit,
    label: "Writing final report...",
    sublabel: "Compiling insights and formatting comprehensive analysis",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
]

export function ResearchLoader() {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [completedPhases, setCompletedPhases] = useState<number[]>([])

  useEffect(() => {
    const durations = [2200, 3000, 2800, 99999] // last phase stays until done
    let elapsed = 0

    const timers = phases.slice(0, 3).map((_, i) => {
      elapsed += durations[i]
      return setTimeout(() => {
        setCompletedPhases((prev) => [...prev, i])
        setCurrentPhase(i + 1)
      }, elapsed)
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  const PhaseIcon = phases[currentPhase]?.icon ?? CheckCircle2

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      {/* Current Phase Indicator */}
      <div className="text-center space-y-4">
        <motion.div
          key={currentPhase}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`w-16 h-16 mx-auto rounded-2xl ${phases[currentPhase]?.bg} ${phases[currentPhase]?.border} border-2 flex items-center justify-center`}
        >
          <PhaseIcon className={`w-8 h-8 ${phases[currentPhase]?.color} animate-pulse`} />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-display font-semibold text-lg gradient-text">
              {phases[currentPhase]?.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {phases[currentPhase]?.sublabel}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Phase Steps */}
      <div className="flex justify-center gap-3">
        {phases.map((phase, i) => {
          const Icon = phase.icon
          const isCompleted = completedPhases.includes(i)
          const isCurrent = currentPhase === i
          const isPending = i > currentPhase

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-500 ${
                isCompleted
                  ? `${phase.bg} ${phase.border} ${phase.color}`
                  : isCurrent
                  ? `${phase.bg} ${phase.border} ${phase.color} animate-pulse`
                  : "border-border/30 text-muted-foreground/40 bg-transparent"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Icon className={`w-3.5 h-3.5 ${isPending ? "opacity-30" : ""}`} />
              )}
              <span className={`hidden sm:block ${isPending ? "opacity-30" : ""}`}>
                {phase.label.split("...")[0]}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Skeleton Content Preview */}
      <Card className="glass border-border/50 p-6 space-y-4">
        {/* Title skeleton */}
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />

        {/* Paragraph skeletons */}
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Section heading */}
        <Skeleton className="h-6 w-2/5 mt-2" />

        {/* More paragraphs */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Blockquote-like skeleton */}
        <div className="flex gap-3 mt-2">
          <div className="w-1 bg-muted rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Card>

      {/* Source card skeletons */}
      <div>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass border-border/50 p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
