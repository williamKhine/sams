"use client"

import { courseRoutes } from "@/lib/routes"

import Link from "next/link"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/learning-ui"
import { formatDue } from "@/lib/format-date"
import { LoadMore } from "@/components/shared/load-more"
import { GradesErrorBoundary } from "./grades-error-boundary"

export function CourseGrades({ courseId }: { courseId: Id<"courses"> }) {
  return (
    <GradesErrorBoundary key={courseId}>
      <CourseGradesTable courseId={courseId} />
    </GradesErrorBoundary>
  )
}

function CourseGradesTable({ courseId }: { courseId: Id<"courses"> }) {
  const assignments = usePaginatedQuery(
    api.assignments.forEnrolledCourse,
    { courseId },
    { initialNumItems: 20 }
  )
  return (
    <div className="space-y-4">
      {assignments.status === "LoadingFirstPage" ? (
        <p role="status">Loading assignment grades…</p>
      ) : assignments.results.length === 0 ? (
        <EmptyState title="No assignments yet">
          Grades and feedback will appear here as your instructor reviews
          assignments.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table aria-label="Assignment grades and feedback">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead scope="col">Assignment</TableHead>
                <TableHead scope="col">Grade</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.results.map((assignment) => {
                const reviewed = assignment.evaluatedAt !== null
                const newerAttempt =
                  reviewed &&
                  assignment.evaluatedSubmissionId !==
                    assignment.latestSubmissionId
                return (
                  <TableRow key={assignment._id}>
                    <TableCell className="min-w-48 whitespace-normal">
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={courseRoutes(courseId).assignment(assignment._id)}
                      >
                        {assignment.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due {formatDue(assignment.dueDate)}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {reviewed && assignment.grade !== null ? (
                        `${assignment.grade}%`
                      ) : (
                        <span className="font-normal text-muted-foreground">
                          Not graded
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-40 whitespace-normal">
                      <Badge variant={reviewed ? "secondary" : "outline"}>
                        {reviewed
                          ? "Reviewed"
                          : assignment.submittedAt !== null
                            ? "Awaiting review"
                            : "Not submitted"}
                      </Badge>
                      {assignment.evaluatedAt !== null && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Reviewed {formatDue(assignment.evaluatedAt)}
                        </p>
                      )}
                      {newerAttempt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Newer attempt awaiting review
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-lg min-w-48 whitespace-normal">
                      {reviewed && assignment.feedback ? (
                        <p className="break-words whitespace-pre-wrap">
                          {assignment.feedback}
                        </p>
                      ) : (
                        <span className="text-muted-foreground">
                          {reviewed ? "No written feedback" : "No feedback yet"}
                        </span>
                      )}
                      {newerAttempt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Grade and feedback apply to the previously reviewed
                          attempt.
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <LoadMore status={assignments.status} loadMore={assignments.loadMore} />
    </div>
  )
}
