import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/signin")
  }
  
  if (!session.user.roles?.includes("admin")) {
    throw new Error("Unauthorized: Admin access required")
  }
  
  return session
}

export function isAdmin(roles?: string[]): boolean {
  return roles?.includes("admin") ?? false
}

