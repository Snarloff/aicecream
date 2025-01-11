import type { Role } from "@ai/types/role"

export interface Chat {
  role: Role
  content: string
  done: boolean
  image?: string | null
}
