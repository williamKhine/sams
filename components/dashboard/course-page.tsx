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
import InstructorReview from "./instructor-review"
import { CourseGrades } from "./student-grades"
import { ClassProgress } from "./class-progress"
import { useAssignmentClock } from "./assignment-status"
import { useCourseShell } from "./course-shell"
import CourseSubmissionHistory from "./student-work-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CoursePage({
  courseId,
  view = "overview",
  assignmentId,
}: {
  courseId: string
  view?: "overview" | "assignments" | "grades" | "submissions"
  assignmentId?: string
}) {
  const { course, role } = useCourseShell()
  const assignment = useQuery(
    api.assignments.get,
    role && course && assignmentId
      ? {
          courseId: course._id,
          assignmentId: assignmentId as Id<"assignments">,
          role: role,
        }
      : "skip"
  )
  const now = useAssignmentClock()
  const courseUrl = `/dashboard/courses/${courseId}`

  return (
    <section className="space-y-6">
      {view === "submissions" ? (
        role === "student" ? (
          <CourseSubmissionHistory courseId={course._id} />
        ) : (
          <p>Submission history is available to students.</p>
        )
      ) : view === "grades" ? (
        role === "student" ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Grades</h2>
            <CourseGrades courseId={course._id} />
          </div>
        ) : (
          <p>This grades view is available to students.</p>
        )
      ) : assignmentId ? (
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
              {role === "instructor" && (
                <Link
                  className="text-primary hover:underline"
                  href={`${courseUrl}/assignments`}
                >
                  Manage assignments
                </Link>
              )}
            </article>
            {role === "instructor" && (
              <InstructorReview
                assignment={assignment}
                studentCount={course.approvedCount}
              />
            )}
            {role === "student" && (
              <StudentSubmission
                key={assignment._id}
                assignmentId={assignment._id}
                dueDate={assignment.dueDate}
              />
            )}
          </div>
        )
      ) : view === "assignments" ? (
        role === "instructor" ? (
          <AssignmentsPanel key={course._id} course={course} />
        ) : (
          <StudentAssignments key={course._id} courseId={course._id} />
        )
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to your course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Find your assignments, review instructions, and keep track of
                  deadlines in your course workspace.
                </p>
                <Link
                  className="inline-block text-sm font-medium text-primary hover:underline"
                  href={`${courseUrl}/assignments`}
                >
                  View assignments →
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Course information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Course code</dt>
                    <dd className="font-medium">{course.code}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t pt-3">
                    <dt className="text-muted-foreground">Enrollment</dt>
                    <dd>
                      {course.approvedCount} / {course.maxStudents} students
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
          {role === "instructor" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Class progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {course.assignmentCount ?? 0} assignments ·{" "}
                    {course.submissionCount ?? 0} submission attempts ·{" "}
                    {course.gradedCount ?? 0} graded
                  </p>
                  <ClassProgress
                    completed={course.completedCount ?? 0}
                    expected={
                      (course.assignmentCount ?? 0) * course.approvedCount
                    }
                  />
                </CardContent>
              </Card>
              <PendingRequests course={course} />
            </>
          )}
        </div>
      )}
    </section>
  )
}
