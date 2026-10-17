"use client"

import { useState } from "react"
import { usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { formatDue, LoadMore } from "./course-ui"

export default function StudentAssignments({
  courseId,
}: {
  courseId: Id<"courses">
}) {
  const assignments = usePaginatedQuery(
    api.assignments.forEnrolledCourse,
    { courseId },
    { initialNumItems: 20 }
  )
  const [selected, setSelected] = useState<Id<"assignments"> | null>(null)
  // Captured once on mount; good enough to flag already-past due dates.
  const [now] = useState(() => Date.now())

  if (selected) {
    return (
      <AssignmentDetails
        assignmentId={selected}
        now={now}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="space-y-3 pt-2">
      {assignments.status === "LoadingFirstPage" ? (
        <p role="status">Loading assignments…</p>
      ) : assignments.results.length === 0 ? (
        <p>No assignments have been posted for this course yet.</p>
      ) : null}
      {assignments.results.map((assignment) => (
        <div
          key={assignment._id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="space-y-1">
            <h4 className="font-semibold">{assignment.title}</h4>
            <p className="text-sm">
              Due {formatDue(assignment.dueDate)}
              {assignment.dueDate < now ? " · Past due" : ""}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSelected(assignment._id)}
          >
            View details
          </Button>
        </div>
      ))}
      <LoadMore status={assignments.status} loadMore={assignments.loadMore} />
    </div>
  )
}

function AssignmentDetails({
  assignmentId,
  now,
  onBack,
}: {
  assignmentId: Id<"assignments">
  now: number
  onBack: () => void
}) {
  const assignment = useQuery(api.assignments.getForStudent, { assignmentId })

  return (
    <div className="space-y-3 pt-2">
      <Button variant="outline" onClick={onBack}>
        ← Back to assignments
      </Button>
      {assignment === undefined ? (
        <p role="status">Loading assignment…</p>
      ) : (
        <article className="space-y-2 rounded-lg border p-4">
          <p className="text-sm">{assignment.courseName}</p>
          <h4 className="text-lg font-semibold">{assignment.title}</h4>
          <p>
            <span className="font-medium">Due:</span>{" "}
            {formatDue(assignment.dueDate)}
            {assignment.dueDate < now ? " · Past due" : ""}
          </p>
          <div>
            <p className="font-medium">Description</p>
            <p className="whitespace-pre-wrap">
              {assignment.description || "No description provided."}
            </p>
          </div>
        </article>
      )}
    </div>
  )
}
