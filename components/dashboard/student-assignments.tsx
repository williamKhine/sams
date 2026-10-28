"use client"

import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import Link from "next/link"
import { formatDue, LoadMore } from "./course-ui"
import { AssignmentStatus, useAssignmentClock } from "./assignment-status"

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
  const now = useAssignmentClock()
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Assignments</h2>
        <p className="text-sm text-muted-foreground">
          Open an assignment to read the instructions, submit a file, or review
          your previous attempts.
        </p>
      </div>
      {assignments.status === "LoadingFirstPage" ? (
        <p role="status">Loading assignments…</p>
      ) : assignments.results.length === 0 ? (
        <p>No assignments have been posted for this course yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th scope="col" className="p-4">
                  Assignment
                </th>
                <th scope="col" className="p-4">
                  Due date
                </th>
                <th scope="col" className="p-4">
                  Completion status
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.results.map((assignment) => (
                <tr key={assignment._id} className="border-b last:border-0">
                  <td className="p-4">
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/dashboard/courses/${courseId}/assignments/${assignment._id}`}
                    >
                      {assignment.title}
                    </Link>
                    {assignment.submittedAt !== null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last submitted {formatDue(assignment.submittedAt)}
                      </p>
                    )}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {formatDue(assignment.dueDate)}
                  </td>
                  <td className="p-4">
                    <AssignmentStatus
                      submittedAt={assignment.submittedAt}
                      dueDate={assignment.dueDate}
                      now={now}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <LoadMore status={assignments.status} loadMore={assignments.loadMore} />
    </section>
  )
}
