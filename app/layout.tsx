import { Geist, Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

import { Metadata } from "next";

import { ClerkProvider } from '@clerk/nextjs'
import Header from "@/components/header";
import Footer from "@/components/footer";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "SAMS - Student Assignment Management System",
  description: "A student assignment management system built with Next.js, Clerk, and Tailwind CSS.",
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
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider>
          <ClerkProvider>
            <Header />
            <main className="flex flex-col grow">
              {children}
            </main>
            <Footer />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
