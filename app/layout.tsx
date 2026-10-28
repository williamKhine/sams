import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

import { ClerkProvider } from "@clerk/nextjs"
import ConvexClientProvider from "@/components/ConvexClientProvider"

import Header from "@/components/header"
import Footer from "@/components/footer"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

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
