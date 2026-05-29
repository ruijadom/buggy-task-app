import type { Task } from '../types'
import { formatDueDate, isOverdue, getPriorityColor } from '../utils'

interface TaskCardProps {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}

// ─── BUG #5 ──────────────────────────────────────────────────────────────────
// cycleStatus skips 'in-progress' — clicking "advance" goes directly from
// 'todo' to 'done', never passing through 'in-progress'. The STATUS_CYCLE
// map has a typo: 'todo' maps to 'done' instead of 'in-progress'.
// Fix: change 'todo': 'done' to 'todo': 'in-progress'
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CYCLE = {
  'todo': 'done',        // BUG #5 — should be 'in-progress'
  'in-progress': 'done',
  'done': 'todo',
} as const

const STATUS_LABELS = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
}

const STATUS_COLORS = {
  'todo': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'done': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

export const TaskCard = ({ task, onUpdate, onDelete }: TaskCardProps) => {
  const overdue = isOverdue(task.dueDate) && task.status !== 'done'

  const handleStatusClick = () => {
    onUpdate(task.id, { status: STATUS_CYCLE[task.status] })
  }

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
      {/* Priority stripe */}
      <div
        className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full ${
          task.priority === 'high' ? 'bg-red-400' :
          task.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
        }`}
      />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-zinc-100 text-sm leading-snug flex-1">{task.title}</h3>
          <button
            onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p className="text-zinc-500 text-xs leading-relaxed mb-3 line-clamp-2">
          {task.description}
        </p>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {task.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-zinc-800/80">
          {/* Priority badge */}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>

          {/* Due date */}
          {task.dueDate !== undefined && (
            <span className={`text-[10px] ${overdue ? 'text-red-400' : 'text-zinc-600'}`}>
              {overdue ? '⚠ ' : ''}{formatDueDate(task.dueDate)}
            </span>
          )}

          {/* Status toggle */}
          <button
            onClick={handleStatusClick}
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all hover:scale-105 cursor-pointer ${STATUS_COLORS[task.status]}`}
          >
            {STATUS_LABELS[task.status]}
          </button>
        </div>
      </div>
    </div>
  )
}
