import type { Role } from '@ai/app/_types/role'

export interface Answer {
  model: string
  created_at: string
  message: { role: Role; content: string }
  done: boolean
}
