"use client"

import { usePaginatedQuery } from "convex/react"
import type { Doc } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/learning-ui"
import { ClassProgress } from "@/components/shared/class-progress"
import { LoadMore } from "@/components/shared/load-more"

import { EvaluationForm } from "./evaluation-form"

export default function InstructorReview({
  assignment,
  studentCount,
}: {
  assignment: Doc<"assignments">
  studentCount: number
}) {
  const submissions = usePaginatedQuery(
    api.grades.submissions,
    { assignmentId: assignment._id },
    { initialNumItems: 10 }
  )
  return (
    <section className="space-y-6" aria-label="Evaluate submissions">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Students submitted",
            value: `${assignment.completedCount ?? 0} / ${studentCount}`,
          },
          {
            label: "Submission attempts",
            value: assignment.submissionCount ?? 0,
          },
          {
            label: "Graded",
            value: `${assignment.gradedCount ?? 0} / ${assignment.completedCount ?? 0}`,
          },
        ].map((metric) => (
          <Card key={metric.label} size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent>
          <ClassProgress
            completed={assignment.completedCount ?? 0}
            expected={studentCount}
            label="Assignment completion"
          />
        </CardContent>
      </Card>
      <div>
        <h2 className="text-xl font-semibold">Submissions & feedback</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Review each student’s latest attempt. Saved grades and feedback are
          visible to the student immediately.
        </p>
      </div>
      {submissions.status === "LoadingFirstPage" ? (
        <p role="status">Loading student submissions…</p>
      ) : submissions.results.length === 0 ? (
        <EmptyState title="No submissions yet">
          Student work will appear here when files are submitted.
        </EmptyState>
      ) : (
        submissions.results.map((row) => (
          <EvaluationForm
            key={`${row._id}:${row.latestSubmissionId}`}
            row={row}
          />
        ))
      )}
      <LoadMore status={submissions.status} loadMore={submissions.loadMore} />
    </section>
  )
}
