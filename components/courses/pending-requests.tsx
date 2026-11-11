"use client"

import { useState } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { courseError } from "@/lib/errors"
import { LoadMore } from "@/components/shared/load-more"

export function PendingRequests({ course }: { course: Doc<"courses"> }) {
  const requests = usePaginatedQuery(
    api.enrollments.pending,
    { courseId: course._id },
    { initialNumItems: 20 }
  )
  const decide = useMutation(api.enrollments.decide)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function respond(
    enrollmentId: Id<"enrollments">,
    decision: "approved" | "rejected"
  ) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await decide({ enrollmentId, decision })
    } catch (error) {
      setError(courseError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">
        Requests for {course.name} ({course.code})
      </h2>
      {!course.active && <p>Activate this course to approve requests.</p>}
      {course.approvedCount >= course.maxStudents && (
        <p>This course is full. Pending requests cannot be approved.</p>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {requests.status === "LoadingFirstPage" ? (
        <p role="status">Loading requests…</p>
      ) : requests.results.length === 0 ? (
        <p>No pending requests for this course.</p>
      ) : null}
      {requests.results.map((request) => (
        <div
          key={request._id}
          className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
        >
          <p>{request.studentName ?? `Student ${request.studentId}`}</p>
          <div className="flex gap-2">
            <Button
              disabled={
                busy ||
                !course.active ||
                course.approvedCount >= course.maxStudents
              }
              onClick={() => void respond(request._id, "approved")}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void respond(request._id, "rejected")}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
      <LoadMore status={requests.status} loadMore={requests.loadMore} />
    </section>
  )
}
