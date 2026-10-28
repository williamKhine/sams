"use client"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import Link from "next/link"
import { EmptyState } from "./learning-ui"
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
        <EmptyState title="No assignments yet">
          Assignments will appear here when your instructor posts them.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table className="w-full text-left text-sm">
            <TableHeader className="border-b bg-muted/50">
              <TableRow>
                <TableHead scope="col" className="p-4">
                  Assignment
                </TableHead>
                <TableHead scope="col" className="p-4">
                  Due date
                </TableHead>
                <TableHead scope="col" className="p-4">
                  Completion status
                </TableHead>
                <TableHead scope="col" className="p-4">
                  Grade & feedback
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.results.map((assignment) => (
                <TableRow
                  key={assignment._id}
                  className="border-b last:border-0"
                >
                  <TableCell className="p-4">
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
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    {formatDue(assignment.dueDate)}
                  </TableCell>
                  <TableCell className="p-4">
                    <AssignmentStatus
                      submittedAt={assignment.submittedAt}
                      dueDate={assignment.dueDate}
                      now={now}
                    />
                  </TableCell>
                  <TableCell className="p-4">
                    <p className="font-medium">
                      {assignment.grade !== null
                        ? `${assignment.grade}%`
                        : "Not graded"}
                    </p>
                    {assignment.evaluatedAt !== null && (
                      <Link
                        className="mt-1 inline-block text-xs text-primary hover:underline"
                        href={`/dashboard/courses/${courseId}/assignments/${assignment._id}`}
                      >
                        View feedback
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <LoadMore status={assignments.status} loadMore={assignments.loadMore} />
    </section>
  )
}
