import type { User } from '../../types'

export {}

declare module 'h3' {
  interface H3EventContext {
    user: User | null
  }
}
