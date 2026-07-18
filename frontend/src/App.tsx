import { useState } from "react"
import { Header } from "@/components/Header"
import { AgentMode } from "@/components/AgentMode"
import { Toaster } from "@/components/ui/toaster"

function App() {
  const [chatKey, setChatKey] = useState(0)

  const handleNewChat = () => {
    setChatKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <Header onNewChat={handleNewChat} />

      {/* Main chat window */}
      <main className="flex-1 flex flex-col relative">
        <AgentMode key={chatKey} />
      </main>

      {/* Toast provider */}
      <Toaster />
    </div>
  )
}

export default App
