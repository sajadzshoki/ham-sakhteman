import type { User } from '../../shared/types'

export {}

declare module 'h3' {
  interface H3EventContext {
    user: User | null
  }
}
