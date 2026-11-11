"use client"

import { createContext, useContext, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useDashboardUser } from "@/components/layout/dashboard-shell"
import { courseRoutes } from "@/lib/routes"
import { Badge } from "@/components/ui/badge"

type CourseContext = { course: Doc<"courses">; role: "student" | "instructor" }
const CourseShellContext = createContext<CourseContext | null>(null)

export function useCourseShell() {
  const context = useContext(CourseShellContext)
  if (!context)
    throw new Error("Course content must be rendered inside the course shell.")
  return context
}

export default function CourseShell({
  courseId,
  children,
}: {
  courseId: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const user = useDashboardUser()
  const course = useQuery(api.courses.get, {
    courseId: courseId as Id<"courses">,
    role: user.role,
  })
  const routes = courseRoutes(courseId)
  const courseUrl = routes.home
  const section = [
    { label: "Assignments", href: routes.assignments },
    { label: "Grades", href: routes.grades },
    { label: "Submission history", href: routes.submissions },
  ].find(({ href }) => pathname === href || pathname.startsWith(`${href}/`))

  if (course === undefined) return <p role="status">Loading course…</p>
  if (!course)
    return (
      <section className="space-y-4">
        <h1>Course unavailable</h1>
        <p>This course could not be found or you do not have access.</p>
        <Link href="/dashboard" className="text-primary hover:underline">
          Back to My courses
        </Link>
      </section>
    )

  return (
    <CourseShellContext.Provider value={{ course, role: user.role }}>
      <div className="space-y-6">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <Link
            href="/dashboard"
            className="hover:text-primary hover:underline"
          >
            My courses
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={courseUrl}
            aria-current={!section ? "page" : undefined}
            className="hover:text-primary hover:underline"
          >
            {course.code}
          </Link>
          {section && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                href={section.href}
                aria-current={pathname === section.href ? "page" : undefined}
                className="hover:text-primary hover:underline"
              >
                {section.label}
              </Link>
            </>
          )}
        </nav>
        <div className="course-art relative overflow-hidden rounded-lg bg-[#195e85] px-6 py-9 text-white sm:px-8">
          <div className="relative z-10">
            <p className="mb-3 text-sm font-medium tracking-widest uppercase">
              {course.code}
            </p>
            <h1>{course.name}</h1>
            <Badge
              className="mt-4 border-white/30 bg-white/15 text-white"
              variant="outline"
            >
              {course.active ? "Active course" : "Inactive course"}
            </Badge>
          </div>
        </div>
        {children}
      </div>
    </CourseShellContext.Provider>
  )
}
