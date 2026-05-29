export type Priority = 'low' | 'medium' | 'high'
export type Status = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  createdAt: Date
  dueDate?: Date
  tags: string[]
}

export interface FilterState {
  search: string
  priority: Priority | 'all'
  status: Status | 'all'
}
