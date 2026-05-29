import type { FilterState, Priority, Status } from '../types'

interface FiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export const Filters = ({ filters, onChange }: FiltersProps) => {
  return (
    <div className="flex gap-2 flex-wrap mb-5">
      {/* Search */}
      <input
        type="text"
        value={filters.search}
        onChange={e => onChange({ ...filters, search: e.target.value })}
        placeholder="Search tasks..."
        className="flex-1 min-w-48 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
      />

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={e => onChange({ ...filters, priority: e.target.value as Priority | 'all' })}
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors"
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={e => onChange({ ...filters, status: e.target.value as Status | 'all' })}
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors"
      >
        <option value="all">All statuses</option>
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>
    </div>
  )
}
