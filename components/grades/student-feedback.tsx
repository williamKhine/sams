"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GradesErrorBoundary } from "./grades-error-boundary"

import { formatDue } from "@/lib/format-date"

export default function StudentFeedback({
  assignmentId,
}: {
  assignmentId: Id<"assignments">
}) {
  return (
    <GradesErrorBoundary key={assignmentId}>
      <FeedbackDetails assignmentId={assignmentId} />
    </GradesErrorBoundary>
  )
}

function FeedbackDetails({
  assignmentId,
}: {
  assignmentId: Id<"assignments">
}) {
  const result = useQuery(api.grades.forStudent, { assignmentId })
  if (result === undefined)
    return <p role="status">Loading instructor feedback…</p>
  if (!result || result.evaluatedAt === null)
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Instructor feedback</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {result
              ? "Your submission is awaiting review."
              : "Feedback will appear here after your instructor reviews a submission."}
          </p>
        </CardContent>
      </Card>
    )

  const newerAttempt =
    result.evaluatedSubmissionId !== result.latestSubmissionId
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            <h2>Instructor feedback</h2>
          </CardTitle>
          <Badge variant="secondary">Reviewed</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Reviewed {formatDue(result.evaluatedAt)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.grade !== null && (
          <dl>
            <dt className="text-sm text-muted-foreground">Grade</dt>
            <dd className="text-3xl font-semibold text-primary">
              {result.grade}%
            </dd>
          </dl>
        )}
        {result.feedback ? (
          <div className="space-y-2">
            <h3 className="font-medium">Feedback</h3>
            <p className="break-words whitespace-pre-wrap">{result.feedback}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">No written feedback provided.</p>
        )}
        {newerAttempt && (
          <p
            role="status"
            className="rounded-md border bg-muted/50 p-3 text-sm"
          >
            A newer attempt is awaiting review. This feedback applies to your
            previously reviewed attempt.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
