"use client"

import Link from "next/link"
import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  GridViewIcon,
  HelpCircleIcon,
  Mortarboard01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <header className="border-t-4 border-b border-t-primary bg-card">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-4"
      >
        Skip to content
      </a>
      <div className="page-width flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="SAMS home"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HugeiconsIcon icon={Mortarboard01Icon} size={28} />
          </span>
          <span className="text-2xl font-bold tracking-tight">
            SAMS<span className="text-primary">.</span>
          </span>
          <Separator
            orientation="vertical"
            className="mx-3 hidden h-8! sm:block"
          />
          <span className="hidden text-sm font-medium text-muted-foreground sm:block">
            Learning environment
          </span>
        </Link>
        <nav
          aria-label="Account and utilities"
          className="flex items-center gap-1 sm:gap-3"
        >
          <Show when="signed-in">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Quick navigation"
                  />
                }
              >
                <HugeiconsIcon icon={GridViewIcon} size={22} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  My courses
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Learning help"
                />
              }
            >
              <HugeiconsIcon icon={HelpCircleIcon} size={22} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-4">
              <p className="font-semibold">Welcome to your learning space</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Open a course to find assignments. Students can request
                enrollment from My courses. Open a course to access its
                assignments, grades, and submission history.
              </p>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle color theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <HugeiconsIcon icon={Sun03Icon} size={22} />
          </Button>
          <Separator orientation="vertical" className="mx-2 h-7!" />
          <Show when="signed-in">
            <UserButton appearance={{ elements: { avatarBox: "size-9" } }} />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          </Show>
        </nav>
      </div>
    </header>
  )
}
