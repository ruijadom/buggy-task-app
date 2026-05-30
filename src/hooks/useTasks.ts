import { useState, useEffect, useCallback } from 'react'
import type { Task, FilterState, Priority, Status } from '../types'
import { generateId } from '../utils'

const STORAGE_KEY = 'buggy-task-app-tasks'

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Fix WebRTC audio dropout on Chrome',
    description: 'Users report audio cutting out after 10 minutes on Chrome 120+. Likely a codec negotiation issue.',
    priority: 'high',
    status: 'todo',
    createdAt: new Date('2025-05-01'),
    dueDate: new Date('2025-05-20'),
    tags: ['webrtc', 'audio', 'chrome'],
  },
  {
    id: 'task-2',
    title: 'Migrate Button component to Radix UI',
    description: 'Replace current custom Button with Radix UI Primitive to improve accessibility.',
    priority: 'medium',
    status: 'in-progress',
    createdAt: new Date('2025-05-03'),
    dueDate: new Date('2025-06-01'),
    tags: ['ui', 'accessibility', 'radix'],
  },
  {
    id: 'task-3',
    title: 'Add unit tests for auth flow',
    description: 'Coverage is at 12% for the auth module. Need to reach at least 80%.',
    priority: 'high',
    status: 'todo',
    createdAt: new Date('2025-05-05'),
    tags: ['testing', 'auth'],
  },
  {
    id: 'task-4',
    title: 'Update Tailwind to v4',
    description: 'Migrate from Tailwind v3 config to the new v4 CSS-first config approach.',
    priority: 'low',
    status: 'done',
    createdAt: new Date('2025-04-20'),
    dueDate: new Date('2025-05-10'),
    tags: ['tooling', 'tailwind'],
  },
  {
    id: 'task-5',
    title: 'Implement dark mode toggle',
    description: 'Add a persistent dark/light mode toggle using CSS variables and localStorage.',
    priority: 'medium',
    status: 'todo',
    createdAt: new Date('2025-05-08'),
    tags: ['ui', 'ux'],
  },
  {
    id: 'task-6',
    title: 'Performance audit on task list render',
    description: 'Task list re-renders on every keystroke in the search box. Needs memoization.',
    priority: 'medium',
    status: 'in-progress',
    createdAt: new Date('2025-05-10'),
    dueDate: new Date('2025-05-30'),
    tags: ['performance', 'react'],
  },
]

// ─── BUG #3 ──────────────────────────────────────────────────────────────────
// The useEffect that persists tasks to localStorage is missing `tasks` in its
// dependency array. This means localStorage is NEVER updated after the initial
// render — changes made by the user (add/delete/update) are lost on page reload.
// Fix: change the dependency array from [] to [tasks].
// ─────────────────────────────────────────────────────────────────────────────

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Task[]
        return parsed.map(t => ({ ...t, createdAt: new Date(t.createdAt), dueDate: t.dueDate ? new Date(t.dueDate) : undefined }))
      }
    } catch {
      // fall through to initial tasks
    }
    return INITIAL_TASKS
  })

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: 'all',
    status: 'all',
  })

  // BUG #3: Missing `tasks` dependency — localStorage never updates after mount
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
    }
    setTasks(prev => [newTask, ...prev])
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  // ─── BUG #4 ────────────────────────────────────────────────────────────────
  // The search filter uses `includes` without lowercasing the task title,
  // so searching for "fix" won't match "Fix WebRTC audio dropout" (capital F).
  // Fix: change to task.title.toLowerCase().includes(filters.search.toLowerCase())
  // ──────────────────────────────────────────────────────────────────────────

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = filters.search === '' || task.title.includes(filters.search) // BUG #4
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority
    const matchesStatus = filters.status === 'all' || task.status === filters.status
    return matchesSearch && matchesPriority && matchesStatus
  })

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    filters,
    setFilters,
    addTask,
    updateTask,
    deleteTask,
    stats,
  }
}

export type TaskPriority = Priority
export type TaskStatus = Status
