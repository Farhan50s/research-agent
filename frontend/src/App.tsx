import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Header } from "@/components/Header"
import { NormalMode } from "@/components/NormalMode"
import { AgentMode } from "@/components/AgentMode"
import { Toaster } from "@/components/ui/toaster"

function App() {
  const [isAgentMode, setIsAgentMode] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header isAgentMode={isAgentMode} onToggle={setIsAgentMode} />

      <main className="relative">
        <AnimatePresence mode="wait">
          {isAgentMode ? (
            <AgentMode key="agent" />
          ) : (
            <NormalMode key="normal" />
          )}
        </AnimatePresence>
      </main>

      <Toaster />
    </div>
  )
}

export default App
