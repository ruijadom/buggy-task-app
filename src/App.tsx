import { useState } from 'react'
import { useTasks } from './hooks/useTasks'
import { sortTasksByPriority } from './utils'
import { TaskCard } from './components/TaskCard'
import { AddTaskModal } from './components/AddTaskModal'
import { StatsBar } from './components/StatsBar'
import { Filters } from './components/Filters'

export default function App() {
  const { tasks, filters, setFilters, addTask, updateTask, deleteTask, stats } = useTasks()
  const [showModal, setShowModal] = useState(false)

  const sortedTasks = sortTasksByPriority(tasks)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Task Board</h1>
            <p className="text-zinc-600 text-sm mt-0.5">Broadvoice · Sprint tracker</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-zinc-100 text-zinc-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            <span>+</span> New Task
          </button>
        </div>

        {/* Stats */}
        <StatsBar {...stats} />

        {/* Filters */}
        <Filters filters={filters} onChange={setFilters} />

        {/* Task grid */}
        {sortedTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-3">🏄</div>
            <p className="text-zinc-500 text-sm">No tasks match your filters</p>
            <button
              onClick={() => setFilters({ search: '', priority: 'all', status: 'all' })}
              className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 underline transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AddTaskModal
          onAdd={addTask}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
