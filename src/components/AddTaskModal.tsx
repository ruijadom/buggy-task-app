import { useState } from 'react'
import type { Task, Priority, Status } from '../types'

interface AddTaskModalProps {
  onAdd: (data: Omit<Task, 'id' | 'createdAt'>) => void
  onClose: () => void
}

// ─── BUG #6 ──────────────────────────────────────────────────────────────────
// After successfully submitting the form, the local state is NOT reset.
// If the user closes and reopens the modal, the previous values are still
// filled in. Also, the `tags` input is never cleared.
// Fix: call resetForm() inside handleSubmit after onAdd(...) is called.
// ─────────────────────────────────────────────────────────────────────────────

export const AddTaskModal = ({ onAdd, onClose }: AddTaskModalProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<Status>('todo')
  const [dueDate, setDueDate] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [error, setError] = useState('')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setStatus('todo')
    setDueDate('')
    setTagsInput('')
    setError('')
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    onAdd({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags,
    })

    resetForm()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-zinc-100 font-semibold">New Task</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors">✕</button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError('') }}
              placeholder="e.g. Fix audio dropout on Chrome"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the task..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
            />
          </div>

          {/* Priority + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Status)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tags <span className="text-zinc-600">(comma separated)</span></label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. webrtc, audio, bug"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-zinc-400 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 rounded-lg hover:bg-white transition-colors"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  )
}
