"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { PendingRequests } from "./instructor-dashboard"
import AssignmentsPanel from "./assignments-panel"
import StudentAssignments from "./student-assignments"
import { formatDue } from "./course-ui"
import StudentSubmission from "./student-submission"
import { useAssignmentClock } from "./assignment-status"

export default function CoursePage({
  courseId,
  view = "overview",
  assignmentId,
}: {
  courseId: string
  view?: "overview" | "assignments"
  assignmentId?: string
}) {
  const user = useQuery(api.users.current)
  const course = useQuery(
    api.courses.get,
    user?.role
      ? {
          courseId: courseId as Id<"courses">,
          role: user.role,
        }
      : "skip"
  )
  const assignment = useQuery(
    api.assignments.get,
    user?.role && course && assignmentId
      ? {
          courseId: course._id,
          assignmentId: assignmentId as Id<"assignments">,
          role: user.role,
        }
      : "skip"
  )
  const now = useAssignmentClock()
  const courseUrl = `/dashboard/courses/${courseId}`

  if (course === undefined) return <p role="status">Loading course…</p>
  if (course === null)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Course unavailable</h1>
        <p>This course could not be found or you do not have access.</p>
        <Link className="text-primary hover:underline" href="/dashboard">
          Back to courses
        </Link>
      </div>
    )

  return (
    <section className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm">
        <Link className="hover:underline" href="/dashboard">
          My courses
        </Link>
        <span aria-hidden="true">/</span>
        <Link className="hover:underline" href={courseUrl}>
          {course.code}
        </Link>
        {(view === "assignments" || assignmentId) && (
          <>
            <span aria-hidden="true">/</span>
            <Link className="hover:underline" href={`${courseUrl}/assignments`}>
              Assignments
            </Link>
          </>
        )}
        {assignmentId && (
          <>
            <span aria-hidden="true">/</span>
            <span>{assignment?.title ?? "Assignment"}</span>
          </>
        )}
      </nav>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{course.name}</h1>
        <p>
          {course.code} · {course.active ? "Active" : "Inactive"}
        </p>
      </div>
      <nav aria-label="Course navigation" className="flex gap-6 border-b pb-3">
        <Link
          className="hover:underline aria-[current=page]:font-semibold"
          aria-current={
            view === "overview" && !assignmentId ? "page" : undefined
          }
          href={courseUrl}
        >
          Course home
        </Link>
        <Link
          className="hover:underline aria-[current=page]:font-semibold"
          aria-current={
            view === "assignments" || assignmentId ? "page" : undefined
          }
          href={`${courseUrl}/assignments`}
        >
          Assignments
        </Link>
      </nav>
      {assignmentId ? (
        assignment === undefined ? (
          <p role="status">Loading assignment…</p>
        ) : assignment === null ? (
          <p role="alert">
            Assignment unavailable. It may have been deleted or you may not have
            access.
          </p>
        ) : (
          <div className="space-y-6">
            <article className="space-y-4 rounded-xl border p-6">
              <h2 className="text-2xl font-semibold">{assignment.title}</h2>
              <p>
                Due {formatDue(assignment.dueDate)}
                {assignment.dueDate < now ? " · Past due" : ""}
              </p>
              <div className="space-y-2">
                <h3 className="font-semibold">Description</h3>
                <p className="whitespace-pre-wrap">
                  {assignment.description || "No description provided."}
                </p>
              </div>
              {user?.role === "instructor" && (
                <Link
                  className="text-primary hover:underline"
                  href={`${courseUrl}/assignments`}
                >
                  Manage assignments
                </Link>
              )}
            </article>
            {user?.role === "student" && (
              <StudentSubmission
                key={assignment._id}
                assignmentId={assignment._id}
                dueDate={assignment.dueDate}
              />
            )}
          </div>
        )
      ) : view === "assignments" ? (
        user?.role === "instructor" ? (
          <AssignmentsPanel key={course._id} course={course} />
        ) : (
          <StudentAssignments key={course._id} courseId={course._id} />
        )
      ) : (
        <div className="space-y-6">
          <p>
            {course.approvedCount} / {course.maxStudents} students enrolled
          </p>
          <Link
            className="inline-block text-primary hover:underline"
            href={`${courseUrl}/assignments`}
          >
            View assignments →
          </Link>
          {user?.role === "instructor" && <PendingRequests course={course} />}
        </div>
      )}
    </section>
  )
}
