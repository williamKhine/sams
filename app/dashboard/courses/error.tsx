"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CourseError({ retry }: { retry: () => void }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Unable to open this page</h1>
      <p>
        The link may be invalid, your access may have changed, or the connection
        may be unavailable.
      </p>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => retry()}>
          Try again
        </Button>
        <Link className="text-primary hover:underline" href="/dashboard">
          Back to courses
        </Link>
      </div>
    </section>
  )
}
