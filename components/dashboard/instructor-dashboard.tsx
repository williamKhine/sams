"use client"

import { useState, type FormEvent } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { courseError, inputClassName, LoadMore } from "./course-ui"

export default function InstructorDashboard({ name }: { name: string | null }) {
  const courses = usePaginatedQuery(
    api.courses.mine,
    {},
    { initialNumItems: 20 }
  )
  const create = useMutation(api.courses.create)
  const setActive = useMutation(api.courses.setActive)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await create({
        name: String(data.get("name")),
        code: String(data.get("code")),
        maxStudents: Number(data.get("maxStudents")),
        active: data.get("active") === "on",
      })
      form.reset()
      setNotice("Course created.")
    } catch (error) {
      setError(courseError(error))
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(course: Doc<"courses">) {
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await setActive({ courseId: course._id, active: !course.active })
    } catch (error) {
      setError(courseError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Instructor dashboard</h1>
        <p>Welcome{name ? `, ${name}` : ""}!</p>
      </div>
      <form
        onSubmit={createCourse}
        className="max-w-xl space-y-4 rounded-xl border p-6"
      >
        <h2 className="text-xl font-semibold">Create a course</h2>
        <label className="block space-y-1">
          <span>Course name</span>
          <input
            className={inputClassName}
            name="name"
            required
            maxLength={120}
            disabled={busy}
          />
        </label>
        <label className="block space-y-1">
          <span>Course code</span>
          <input
            className={inputClassName}
            name="code"
            required
            maxLength={40}
            disabled={busy}
            placeholder="e.g. CPS714"
          />
        </label>
        <label className="block space-y-1">
          <span>Maximum students</span>
          <input
            className={inputClassName}
            name="maxStudents"
            type="number"
            min={1}
            step={1}
            required
            disabled={busy}
          />
        </label>
        <label className="flex items-center gap-2">
          <input name="active" type="checkbox" defaultChecked disabled={busy} />
          Open for enrollment
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? "Please wait…" : "Create course"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your courses</h2>
        {courses.status === "LoadingFirstPage" ? (
          <p role="status">Loading courses…</p>
        ) : courses.results.length === 0 ? (
          <p>You haven’t created any courses yet.</p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {courses.results.map((course) => (
            <article
              key={course._id}
              className="space-y-3 rounded-xl border p-5"
            >
              <h3 className="text-lg font-semibold">
                <Link
                  className="hover:underline"
                  href={`/dashboard/courses/${course._id}`}
                >
                  {course.name}
                </Link>
              </h3>
              <p>
                {course.code} · {course.active ? "Active" : "Inactive"}
              </p>
              <p>
                {course.approvedCount} / {course.maxStudents} students enrolled
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void toggleActive(course)}
                >
                  {course.active ? "Deactivate" : "Activate"}
                </Button>
                <Link
                  className="text-primary hover:underline"
                  href={`/dashboard/courses/${course._id}`}
                >
                  Open course
                </Link>
                <Link
                  className="text-primary hover:underline"
                  href={`/dashboard/courses/${course._id}/assignments`}
                >
                  Assignments
                </Link>
              </div>
            </article>
          ))}
        </div>
        <LoadMore status={courses.status} loadMore={courses.loadMore} />
      </div>
    </section>
  )
}

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
