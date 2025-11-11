import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        }) as any

        if (!user || !user.hashedPassword) {
          return null
        }

        if (user.status === "suspended" || user.status === "banned") {
          throw new Error("Your account has been suspended. Please contact support.")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isPasswordValid) {
          return null
        }

        // Enforce email verification - block sign-in if email not verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email address before signing in. Check your inbox for the verification link.")
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() } as any,
        })

        return {
          id: user.id,
          email: user.email,
          roles: user.roles,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.roles = user.roles
        token.emailVerified = (user as any).emailVerified
      }

      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { emailVerified: true, status: true } as any,
        }) as any
        if (dbUser) {
          token.emailVerified = dbUser.emailVerified
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.roles = token.roles as string[]
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        }) as any

        if (!dbUser) {
          return false
        }

        if (dbUser.status === "suspended" || dbUser.status === "banned") {
          return false
        }
      }
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
  debug: process.env.NODE_ENV === "development",
}


