"use client"

import { useState } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { courseError, LoadMore } from "./course-ui"
import StudentAssignments from "./student-assignments"

const statusLabel = {
  pending: "Awaiting instructor approval",
  approved: "Enrolled",
  rejected: "Request rejected",
}

export default function StudentDashboard({ name }: { name: string | null }) {
  const courses = usePaginatedQuery(
    api.courses.active,
    {},
    { initialNumItems: 20 }
  )
  const enrollments = usePaginatedQuery(
    api.enrollments.mine,
    {},
    { initialNumItems: 20 }
  )
  const request = useMutation(api.enrollments.request)
  const [openCourse, setOpenCourse] = useState<Id<"courses"> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function enroll(courseId: Id<"courses">) {
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await request({ courseId })
      setNotice(
        "Enrollment requested. Your instructor must approve it before you are enrolled."
      )
    } catch (error) {
      setError(courseError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Student dashboard</h1>
        <p>Welcome{name ? `, ${name}` : ""}!</p>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active courses</h2>
        {courses.status === "LoadingFirstPage" ? (
          <p role="status">Loading courses…</p>
        ) : courses.results.length === 0 ? (
          <p>No active courses are available yet.</p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {courses.results.map((course) => (
            <article
              key={course._id}
              className="space-y-3 rounded-xl border p-5"
            >
              <h3 className="text-lg font-semibold">{course.name}</h3>
              <p>
                {course.code}
                {course.instructorName ? ` · ${course.instructorName}` : ""}
              </p>
              <p>
                {course.approvedCount} / {course.maxStudents} students enrolled
              </p>
              {course.enrollmentStatus ? (
                <p>{statusLabel[course.enrollmentStatus]}</p>
              ) : (
                <Button
                  disabled={busy || course.approvedCount >= course.maxStudents}
                  onClick={() => void enroll(course._id)}
                >
                  {course.approvedCount >= course.maxStudents
                    ? "Course full"
                    : "Request enrollment"}
                </Button>
              )}
            </article>
          ))}
        </div>
        <LoadMore status={courses.status} loadMore={courses.loadMore} />
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your enrollments</h2>
        {enrollments.status === "LoadingFirstPage" ? (
          <p role="status">Loading enrollments…</p>
        ) : enrollments.results.length === 0 ? (
          <p>You haven’t requested enrollment in any courses yet.</p>
        ) : null}
        {enrollments.results.map((enrollment) => (
          <article
            key={enrollment._id}
            className="space-y-1 rounded-xl border p-4"
          >
            <h3 className="font-semibold">
              {enrollment.courseName} · {enrollment.courseCode}
            </h3>
            <p>
              {statusLabel[enrollment.status]}
              {!enrollment.courseActive ? " · Course inactive" : ""}
            </p>
            {enrollment.status === "approved" && (
              <>
                <Button
                  variant="secondary"
                  aria-expanded={openCourse === enrollment.courseId}
                  onClick={() =>
                    setOpenCourse(
                      openCourse === enrollment.courseId
                        ? null
                        : enrollment.courseId
                    )
                  }
                >
                  {openCourse === enrollment.courseId
                    ? "Hide assignments"
                    : "View assignments"}
                </Button>
                {openCourse === enrollment.courseId && (
                  <StudentAssignments courseId={enrollment.courseId} />
                )}
              </>
            )}
          </article>
        ))}
        <LoadMore status={enrollments.status} loadMore={enrollments.loadMore} />
      </div>
    </section>
  )
}
