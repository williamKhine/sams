"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  BookOpen01Icon,
  Folder01Icon,
  Clock01Icon,
  Mortarboard01Icon,
} from "@hugeicons/core-free-icons"

export default function DashboardNavigation({
  role,
}: {
  role: "student" | "instructor"
}) {
  const pathname = usePathname()
  const { courseId } = useParams<{ courseId?: string }>()
  const courseUrl = courseId
    ? `/dashboard/courses/${encodeURIComponent(courseId)}`
    : null
  const links = [
    {
      href: "/dashboard",
      label: "My courses",
      icon: BookOpen01Icon,
      active: !courseUrl,
    },
    ...(courseUrl
      ? [
          {
            href: courseUrl,
            label: "Course home",
            icon: Home01Icon,
            active: pathname === courseUrl,
          },
          {
            href: `${courseUrl}/assignments`,
            label: "Assignments",
            icon: Folder01Icon,
            active: pathname.startsWith(`${courseUrl}/assignments`),
          },
          ...(role === "student"
            ? [
                {
                  href: `${courseUrl}/grades`,
                  label: "Grades",
                  icon: Mortarboard01Icon,
                  active: pathname === `${courseUrl}/grades`,
                },
                {
                  href: `${courseUrl}/submissions`,
                  label: "Submission history",
                  icon: Clock01Icon,
                  active: pathname === `${courseUrl}/submissions`,
                },
              ]
            : []),
        ]
      : []),
  ]
  return (
    <div className="border-b bg-card">
      <nav
        aria-label={courseUrl ? "Course navigation" : "Dashboard navigation"}
        className="page-width flex gap-6 overflow-x-auto sm:gap-9"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.active ? "page" : undefined}
            className="flex shrink-0 items-center gap-2 border-b-[3px] border-transparent py-4 text-sm font-medium text-muted-foreground transition-colors hover:text-primary aria-[current=page]:border-primary aria-[current=page]:text-primary"
          >
            <HugeiconsIcon icon={link.icon} size={19} />
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
