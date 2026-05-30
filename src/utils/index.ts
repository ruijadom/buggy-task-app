import type { Task, Priority } from '../types'

// ─── BUG #1 ──────────────────────────────────────────────────────────────────
// sortTasksByPriority mutates the original array instead of sorting a copy.
// Calling this function changes the order of the original tasks array in state,
// causing unpredictable re-renders and lost order when filters are cleared.
// Fix: use [...tasks].sort(...) instead of tasks.sort(...)
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

// ─── BUG #2 ──────────────────────────────────────────────────────────────────
// formatDueDate uses toLocaleDateString with a hardcoded 'en-US' locale and
// never accounts for invalid/undefined dates — it returns "Invalid Date"
// instead of a fallback string when dueDate is undefined or malformed.
// Fix: guard with `if (!date) return 'No due date'` and wrap in try/catch.
// ─────────────────────────────────────────────────────────────────────────────

export const formatDueDate = (date: Date | undefined): string => {
  if (!date) return 'No due date'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'No due date'
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return 'No due date'
  }
}

export const isOverdue = (date: Date | undefined): boolean => {
  if (!date) return false
  return new Date(date) < new Date()
}

export const generateId = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36)

export const getPriorityColor = (priority: Priority): string => {
  const colors: Record<Priority, string> = {
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  }
  return colors[priority]
}
