"use client"

import { courseRoutes } from "@/lib/routes"

import Link from "next/link"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/learning-ui"
import { formatDue } from "@/lib/format-date"
import { LoadMore } from "@/components/shared/load-more"

export default function CourseSubmissionHistory({
  courseId,
}: {
  courseId: Id<"courses">
}) {
  const history = usePaginatedQuery(
    api.submissions.forCourse,
    { courseId },
    { initialNumItems: 20 }
  )
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Submission history</h2>
        <p className="text-muted-foreground">
          Your saved attempts in this course, newest first. Each receipt
          includes the file and the date and time it was submitted.
        </p>
      </div>
      {history.status === "LoadingFirstPage" ? (
        <p role="status">Loading submission history…</p>
      ) : history.results.length === 0 ? (
        <EmptyState title="No submissions yet">
          Your assignment receipts will appear here after you submit work in
          this course.
        </EmptyState>
      ) : null}
      {history.results.map((submission) => (
        <article
          key={submission._id}
          className="space-y-3 rounded-xl border p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {submission.assignmentTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {submission.courseCode} · {submission.courseName}
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              Submitted
              {submission._creationTime > submission.dueDate ? " late" : ""}
            </Badge>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd>{formatDue(submission._creationTime)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">File</dt>
              <dd className="break-all">
                {submission.fileName} ·{" "}
                {(submission.size / 1024).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}{" "}
                KB
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              className="text-primary hover:underline"
              href={courseRoutes(submission.courseId).assignment(
                submission.assignmentId
              )}
            >
              Assignment details
            </Link>
            {submission.url ? (
              <a
                className="text-primary hover:underline"
                href={submission.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View submitted file ↗
              </a>
            ) : (
              <span className="text-muted-foreground">File unavailable</span>
            )}
          </div>
        </article>
      ))}
      <LoadMore status={history.status} loadMore={history.loadMore} />
    </section>
  )
}
