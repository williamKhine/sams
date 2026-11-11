import { courseRoutes } from "@/lib/routes"
import Link from "next/link"
import type { FunctionReturnType } from "convex/server"
import type { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { CourseArtwork } from "@/components/shared/learning-ui"
import { ClassProgress } from "@/components/shared/class-progress"
import { enrollmentStatusLabels } from "./enrollment-status"

type StudentCourse = FunctionReturnType<
  typeof api.courses.active
>["page"][number]

export function StudentCourseCard({
  course,
  index,
  busy,
  onEnroll,
}: {
  course: StudentCourse
  index: number
  busy: boolean
  onEnroll: (courseId: Id<"courses">) => Promise<void>
}) {
  return (
    <Card className="gap-0 py-0 shadow-none transition-shadow hover:shadow-md">
      <CourseArtwork code={course.code} index={index} />
      <CardContent className="flex-1 space-y-3 p-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {course.code}
        </p>
        <h3 className="text-base leading-snug font-semibold">
          {course.enrollmentStatus === "approved" ? (
            <Link
              className="hover:text-primary hover:underline"
              href={courseRoutes(course._id).home}
            >
              {course.name}
            </Link>
          ) : (
            course.name
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          {course.instructorName ?? "Instructor to be announced"}
        </p>
        <Badge variant="secondary">
          {course.enrollmentStatus
            ? enrollmentStatusLabels[course.enrollmentStatus]
            : "Open for enrollment"}
        </Badge>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
        <span>
          {course.approvedCount} / {course.maxStudents} students
        </span>
        {course.enrollmentStatus === "approved" ? (
          <Link
            href={courseRoutes(course._id).home}
            className="flex items-center gap-1 font-medium text-primary"
          >
            Open course <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        ) : !course.enrollmentStatus ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy || course.approvedCount >= course.maxStudents}
            onClick={() => void onEnroll(course._id)}
          >
            {course.approvedCount >= course.maxStudents
              ? "Course full"
              : "Request enrollment"}
          </Button>
        ) : (
          <span>
            {course.enrollmentStatus === "pending"
              ? "Approval pending"
              : "Contact your instructor"}
          </span>
        )}
      </CardFooter>
    </Card>
  )
}

export function InstructorCourseCard({
  course,
  index,
  busy,
  onToggleActive,
}: {
  course: Doc<"courses">
  index: number
  busy: boolean
  onToggleActive: (course: Doc<"courses">) => Promise<void>
}) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CourseArtwork code={course.code} index={index} />
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{course.code}</span>
          <Badge variant={course.active ? "secondary" : "outline"}>
            {course.active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <h3 className="text-base font-semibold">
          <Link
            className="hover:text-primary hover:underline"
            href={courseRoutes(course._id).home}
          >
            {course.name}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {course.approvedCount} / {course.maxStudents} students enrolled
        </p>
        <div className="space-y-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            {course.assignmentCount ?? 0} assignments ·{" "}
            {course.submissionCount ?? 0} submission attempts ·{" "}
            {course.gradedCount ?? 0} graded
          </p>
          <ClassProgress
            completed={course.completedCount ?? 0}
            expected={(course.assignmentCount ?? 0) * course.approvedCount}
            label={`${course.code} completion`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t pt-3">
          <Link
            className="text-sm font-medium text-primary hover:underline"
            href={courseRoutes(course._id).home}
          >
            Open course →
          </Link>
          <Link
            className="text-sm text-primary hover:underline"
            href={courseRoutes(course._id).assignments}
          >
            Assignments
          </Link>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void onToggleActive(course)}
          >
            {course.active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
