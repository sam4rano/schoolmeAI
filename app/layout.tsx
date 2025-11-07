import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/lib/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EduRepo-NG-AI | Nigerian Tertiary Admissions Guide",
  description: "AI-powered educational repository and guidance system for Nigerian tertiary admissions",
  keywords: ["Nigerian universities", "admission calculator", "JAMB", "UTME", "tertiary education"],
  authors: [{ name: "EduRepo-NG-AI Initiative" }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

