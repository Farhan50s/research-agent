import { useState, useEffect, useCallback } from "react"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  open?: boolean
}

const listeners: Array<(state: ToasterToast[]) => void> = []
let memoryState: ToasterToast[] = []

function dispatch(toasts: ToasterToast[]) {
  memoryState = toasts
  listeners.forEach((listener) => listener(memoryState))
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

function toast({ title, description, variant }: Omit<ToasterToast, "id" | "open">) {
  const id = genId()
  const newToast: ToasterToast = { id, title, description, variant, open: true }
  dispatch([...memoryState, newToast].slice(-TOAST_LIMIT))

  setTimeout(() => {
    dispatch(memoryState.map((t) => (t.id === id ? { ...t, open: false } : t)))
    setTimeout(() => {
      dispatch(memoryState.filter((t) => t.id !== id))
    }, 300)
  }, TOAST_REMOVE_DELAY)
}

function useToast() {
  const [state, setState] = useState<ToasterToast[]>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [state])

  return {
    toasts: state,
    toast: useCallback(toast, []),
  }
}

export { useToast, toast }
