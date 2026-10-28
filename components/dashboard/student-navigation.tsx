"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function StudentNavigation() {
  const pathname = usePathname()
  const links = [
    { href: "/dashboard", label: "My courses" },
    { href: "/dashboard/assignments", label: "Upcoming assignments" },
    { href: "/dashboard/submissions", label: "Submission history" },
  ]
  return (
    <nav
      aria-label="Student navigation"
      className="mb-8 flex flex-wrap gap-x-6 gap-y-3 border-b pb-4 text-sm"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
          className="hover:underline aria-[current=page]:font-semibold aria-[current=page]:text-primary"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
