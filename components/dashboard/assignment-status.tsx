"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { deadlineLabel } from "@/lib/assignment-status"

export function useAssignmentClock() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 60000) * 60000)
  useEffect(() => {
    const timer = setInterval(
      () => setNow(Math.floor(Date.now() / 60000) * 60000),
      60000
    )
    return () => clearInterval(timer)
  }, [])
  return now
}

export function AssignmentStatus({
  submittedAt,
  dueDate,
  now,
}: {
  submittedAt: number | null
  dueDate: number
  now: number
}) {
  const deadline = submittedAt === null ? deadlineLabel(dueDate, now) : null
  return (
    <div className="flex flex-wrap gap-2 text-xs font-medium">
      <Badge
        variant="outline"
        className={
          submittedAt !== null
            ? "rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300"
            : "rounded-full border bg-muted px-2.5 py-1"
        }
      >
        {submittedAt !== null ? "Submitted" : "Outstanding"}
      </Badge>
      {deadline && (
        <Badge
          variant="outline"
          className="rounded-full border border-amber-600/30 bg-amber-500/10 px-2.5 py-1 text-amber-800 dark:text-amber-300"
        >
          {deadline}
        </Badge>
      )}
      {submittedAt !== null && submittedAt > dueDate && (
        <Badge variant="outline" className="rounded-full border px-2.5 py-1">
          Submitted late
        </Badge>
      )}
    </div>
  )
}
