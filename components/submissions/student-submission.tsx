"use client"

import { SubmissionUploadForm } from "./submission-upload-form"
import StudentFeedback from "@/components/grades/student-feedback"

import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { formatDue } from "@/lib/format-date"
import { LoadMore } from "@/components/shared/load-more"
import { AssignmentStatus } from "@/components/assignments/assignment-status"
import { useAssignmentClock } from "@/components/assignments/use-assignment-clock"

export default function StudentSubmission({
  assignmentId,
  dueDate,
}: {
  assignmentId: Id<"assignments">
  dueDate: number
}) {
  const history = usePaginatedQuery(
    api.submissions.forAssignment,
    { assignmentId },
    { initialNumItems: 10 }
  )
  const now = useAssignmentClock()
  const latest = history.results[0]

  return (
    <section className="space-y-6 rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">My submission</h2>
        {history.status !== "LoadingFirstPage" && (
          <AssignmentStatus
            submittedAt={latest?._creationTime ?? null}
            dueDate={dueDate}
            now={now}
          />
        )}
      </div>
      {latest && (
        <p className="text-sm text-muted-foreground">
          Last submitted {formatDue(latest._creationTime)}
        </p>
      )}
      <StudentFeedback assignmentId={assignmentId} />
      <SubmissionUploadForm
        assignmentId={assignmentId}
        dueDate={dueDate}
        now={now}
        hasSubmission={Boolean(latest)}
      />
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Submission history</h3>
        {history.status === "LoadingFirstPage" ? (
          <p role="status">Loading submissions…</p>
        ) : history.results.length === 0 ? (
          <p className="text-muted-foreground">
            No submissions yet. Select a file and submit it to complete this
            assignment.
          </p>
        ) : null}
        {history.results.map((submission) => (
          <article
            key={submission._id}
            className="space-y-2 rounded-lg border p-4"
          >
            <p className="font-medium">{submission.fileName}</p>
            <p className="text-sm">
              Submitted {formatDue(submission._creationTime)} ·{" "}
              {(submission.size / 1024).toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}{" "}
              KB
              {submission._creationTime > submission.dueDate
                ? " · Late"
                : " · On time"}
            </p>
            {submission.url ? (
              <a
                className="text-sm text-primary hover:underline"
                href={submission.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View submitted file ↗
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">File unavailable</p>
            )}
          </article>
        ))}
        <LoadMore status={history.status} loadMore={history.loadMore} />
      </div>
    </section>
  )
}
