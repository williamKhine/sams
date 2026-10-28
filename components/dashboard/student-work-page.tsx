"use client"

import Link from "next/link"
import { usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { formatDue, LoadMore } from "./course-ui"
import { AssignmentStatus, useAssignmentClock } from "./assignment-status"

export default function StudentWorkPage({
  view,
}: {
  view: "upcoming" | "history"
}) {
  const user = useQuery(api.users.current)
  if (user === undefined) return <p role="status">Loading account…</p>
  if (user?.role !== "student")
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Student view</h1>
        <p>This page is available to students.</p>
        <Link className="text-primary hover:underline" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    )
  return view === "upcoming" ? <UpcomingAssignments /> : <SubmissionHistory />
}

function UpcomingAssignments() {
  const now = useAssignmentClock()
  const assignments = usePaginatedQuery(
    api.assignments.upcoming,
    { now },
    { initialNumItems: 20 }
  )
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Upcoming assignments</h1>
        <p className="text-muted-foreground">
          Outstanding work across your enrolled courses, ordered by deadline.
          Assignments due within seven days are marked Due soon.
        </p>
        <p className="text-sm text-muted-foreground">
          For overdue work, open the Assignments page in your course.
        </p>
      </div>
      {assignments.status === "LoadingFirstPage" ? (
        <p role="status">Loading upcoming assignments…</p>
      ) : assignments.results.length === 0 ? (
        <p>
          {assignments.status === "Exhausted"
            ? "You’re all caught up. No upcoming assignments are outstanding."
            : "No upcoming assignments in this batch. Load more to check the next deadlines."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th scope="col" className="p-4">
                  Assignment
                </th>
                <th scope="col" className="p-4">
                  Course
                </th>
                <th scope="col" className="p-4">
                  Due date
                </th>
                <th scope="col" className="p-4">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.results.map((assignment) => (
                <tr key={assignment._id} className="border-b last:border-0">
                  <td className="p-4">
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/dashboard/courses/${assignment.courseId}/assignments/${assignment._id}`}
                    >
                      {assignment.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <Link
                      className="hover:underline"
                      href={`/dashboard/courses/${assignment.courseId}`}
                    >
                      {assignment.courseCode} · {assignment.courseName}
                    </Link>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {formatDue(assignment.dueDate)}
                  </td>
                  <td className="p-4">
                    <AssignmentStatus
                      submittedAt={null}
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

function SubmissionHistory() {
  const history = usePaginatedQuery(
    api.submissions.mine,
    {},
    { initialNumItems: 20 }
  )
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Submission history</h1>
        <p className="text-muted-foreground">
          Your saved attempts across all courses, newest first. Each receipt
          includes the file and the date and time it was submitted.
        </p>
      </div>
      {history.status === "LoadingFirstPage" ? (
        <p role="status">Loading submission history…</p>
      ) : history.results.length === 0 ? (
        <p>You haven’t submitted any assignments yet.</p>
      ) : null}
      {history.results.map((submission) => (
        <article
          key={submission._id}
          className="space-y-3 rounded-xl border p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                {submission.assignmentTitle}
              </h2>
              <p className="text-sm text-muted-foreground">
                {submission.courseCode} · {submission.courseName}
              </p>
            </div>
            <span className="rounded-full border bg-emerald-500/10 px-3 py-1 text-xs font-medium">
              Submitted
              {submission._creationTime > submission.dueDate ? " late" : ""}
            </span>
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
              href={`/dashboard/courses/${submission.courseId}/assignments/${submission.assignmentId}`}
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
