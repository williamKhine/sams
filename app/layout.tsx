import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

import { ClerkProvider } from "@clerk/nextjs"
import ConvexClientProvider from "@/components/providers/convex-provider"

import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: { default: "SAMS | My learning", template: "%s | SAMS" },
  description:
    "Manage courses, assignments, submissions, grades, and instructor feedback.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider defaultTheme="light">
          <ClerkProvider>
            <ConvexClientProvider>
              <Header />
              <main id="main-content" className="flex flex-1 flex-col">
                {children}
              </main>
              <Footer />
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
