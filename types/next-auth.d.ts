import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      roles: string[]
      emailVerified?: Date | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email?: string | null
    roles: string[]
    emailVerified?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    roles: string[]
    emailVerified?: Date | null
  }
}