"use client"

import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  BookOpen01Icon,
  Calendar03Icon,
  Folder01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

const colors = [
  "#195e85",
  "#507a62",
  "#786391",
  "#a36b47",
  "#477e85",
  "#9b5f76",
]
export function CourseArtwork({
  code,
  index = 0,
}: {
  code: string
  index?: number
}) {
  return (
    <div
      className="course-art relative flex h-32 items-end overflow-hidden px-5 py-4 text-white"
      style={
        { "--course-color": colors[index % colors.length] } as CSSProperties
      }
    >
      <HugeiconsIcon
        icon={BookOpen01Icon}
        size={58}
        strokeWidth={1}
        className="absolute top-5 right-5 opacity-35"
      />
      <span className="relative z-10 text-xl font-semibold tracking-wide">
        {code}
      </span>
    </div>
  )
}
export function WelcomeBanner({
  name,
  instructor = false,
}: {
  name: string | null
  instructor?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card px-6 py-7 sm:px-8">
      <div className="absolute inset-y-0 right-0 w-2/5 bg-linear-to-l from-primary/8 to-transparent" />
      <div className="relative">
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          {instructor ? "Instructor workspace" : "Your learning starts here"}
        </p>
        <h1>Welcome back{name ? `, ${name.split(" ")[0]}` : ""}.</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {instructor
            ? "A space to teach, connect, and keep your courses moving forward."
            : "Your courses, your assignments, your next step. All in one place."}
        </p>
      </div>
    </div>
  )
}
export function EmptyState({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-8 text-center">
      <HugeiconsIcon
        icon={BookOpen01Icon}
        size={28}
        className="mb-3 text-muted-foreground"
      />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>
    </div>
  )
}
export function CourseSkeletons() {
  return (
    <div role="status" className="grid gap-5 sm:grid-cols-2">
      <span className="sr-only">Loading courses…</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-lg border">
          <Skeleton className="h-32 rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-6 h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
export function LearningSidebar({
  children,
  instructor = false,
}: {
  children?: ReactNode
  instructor?: boolean
}) {
  return (
    <aside className="space-y-6" aria-label="Learning widgets">
      {children}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={20}
              className="text-primary"
            />
            Keep your learning on track
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="leading-relaxed text-muted-foreground">
            {instructor
              ? "Keep course details up to date and review enrollment requests from each course home."
              : "Check your course assignments regularly. Open a course to find its grades, feedback, and submission history."}
          </p>
          <Separator />
          <Link
            href="/dashboard#my-courses"
            className="flex items-center justify-between font-medium text-primary"
          >
            {instructor ? "Manage your courses" : "Open a course"}
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={HelpCircleIcon}
              size={20}
              className="text-primary"
            />
            Getting started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <HugeiconsIcon icon={BookOpen01Icon} size={17} />
            </span>
            <div>
              <p className="font-medium">
                {instructor ? "Build your classroom" : "Find your classroom"}
              </p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {instructor
                  ? "Create a course and open it for enrollment."
                  : "Browse courses and request a place. Your instructor will approve your enrollment."}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <HugeiconsIcon icon={Folder01Icon} size={17} />
            </span>
            <div>
              <p className="font-medium">
                {instructor ? "Set the next milestone" : "Make progress"}
              </p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {instructor
                  ? "Open a course to add assignments and manage deadlines."
                  : "Open your course to view instructions, deadlines, and upload your work."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
