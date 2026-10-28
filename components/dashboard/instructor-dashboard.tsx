"use client"

import { Label } from "@/components/ui/label"

import { useState, type FormEvent } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { courseError, inputClassName, LoadMore } from "./course-ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassProgress } from "./class-progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  CourseArtwork,
  WelcomeBanner,
  LearningSidebar,
  CourseSkeletons,
  EmptyState,
} from "./learning-ui"

export default function InstructorDashboard({ name }: { name: string | null }) {
  const courses = usePaginatedQuery(
    api.courses.mine,
    {},
    { initialNumItems: 20 }
  )
  const create = useMutation(api.courses.create)
  const setActive = useMutation(api.courses.setActive)
  const [search, setSearch] = useState("")
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

  const totals = courses.results.reduce(
    (sum, course) => ({
      assignments: sum.assignments + (course.assignmentCount ?? 0),
      submissions: sum.submissions + (course.submissionCount ?? 0),
      completed: sum.completed + (course.completedCount ?? 0),
      graded: sum.graded + (course.gradedCount ?? 0),
      expected:
        sum.expected + (course.assignmentCount ?? 0) * course.approvedCount,
    }),
    { assignments: 0, submissions: 0, completed: 0, graded: 0, expected: 0 }
  )

  return (
    <section className="space-y-8">
      <WelcomeBanner name={name} instructor />
      <section aria-label="Teaching overview" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Teaching overview</h2>
          <p className="text-xs text-muted-foreground">
            {courses.status === "LoadingFirstPage"
              ? "Loading…"
              : `Across ${courses.results.length} loaded courses`}
            {courses.status === "CanLoadMore"
              ? " · Load more courses for additional totals"
              : ""}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Assignments", value: totals.assignments },
            { label: "Submission attempts", value: totals.submissions },
            {
              label: "Students’ work submitted",
              value: `${totals.completed} / ${totals.expected}`,
            },
            {
              label: "Graded submissions",
              value: `${totals.graded} / ${totals.completed}`,
            },
          ].map((metric) => (
            <Card key={metric.label} size="sm">
              <CardContent>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {courses.status === "LoadingFirstPage" ? "—" : metric.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent>
            <ClassProgress
              completed={totals.completed}
              expected={totals.expected}
            />
          </CardContent>
        </Card>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <Card id="my-courses" className="scroll-mt-6">
            <CardHeader className="gap-4 sm:flex sm:items-center sm:justify-between">
              <CardTitle className="text-xl font-semibold">
                My courses
              </CardTitle>
              <Input
                className="sm:w-56"
                placeholder="Search courses"
                aria-label="Search courses"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </CardHeader>
            <CardContent className="space-y-5">
              {courses.status === "LoadingFirstPage" ? (
                <CourseSkeletons />
              ) : courses.results.length === 0 ? (
                <EmptyState title="Your classroom starts here">
                  Create your first course below, then add assignments and
                  welcome your students.
                </EmptyState>
              ) : null}
              {courses.status !== "LoadingFirstPage" &&
                courses.results.length > 0 &&
                !courses.results.some((course) =>
                  `${course.name} ${course.code}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
                ) && (
                  <EmptyState title="No matching courses">
                    Try another course name or code.
                  </EmptyState>
                )}
              <div className="grid gap-5 sm:grid-cols-2">
                {courses.results
                  .filter((course) =>
                    `${course.name} ${course.code}`
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((course, index) => (
                    <Card key={course._id} className="gap-0 py-0 shadow-none">
                      <CourseArtwork code={course.code} index={index} />
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {course.code}
                          </span>
                          <Badge
                            variant={course.active ? "secondary" : "outline"}
                          >
                            {course.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <h3 className="text-base font-semibold">
                          <Link
                            className="hover:text-primary hover:underline"
                            href={`/dashboard/courses/${course._id}`}
                          >
                            {course.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {course.approvedCount} / {course.maxStudents} students
                          enrolled
                        </p>
                        <div className="space-y-3 border-t pt-3">
                          <p className="text-xs text-muted-foreground">
                            {course.assignmentCount ?? 0} assignments ·{" "}
                            {course.submissionCount ?? 0} submission attempts ·{" "}
                            {course.gradedCount ?? 0} graded
                          </p>
                          <ClassProgress
                            completed={course.completedCount ?? 0}
                            expected={
                              (course.assignmentCount ?? 0) *
                              course.approvedCount
                            }
                            label={`${course.code} completion`}
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                          <Link
                            className="text-sm font-medium text-primary hover:underline"
                            href={`/dashboard/courses/${course._id}`}
                          >
                            Open course →
                          </Link>
                          <Link
                            className="text-sm text-primary hover:underline"
                            href={`/dashboard/courses/${course._id}/assignments`}
                          >
                            Assignments
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void toggleActive(course)}
                          >
                            {course.active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              <LoadMore status={courses.status} loadMore={courses.loadMore} />
            </CardContent>
          </Card>
          <form
            onSubmit={createCourse}
            className="grid gap-5 rounded-lg border bg-card p-6 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <h2 className="text-lg font-semibold">Create a course</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up a new learning space for your students.
              </p>
            </div>
            <Label className="block space-y-1">
              <span>Course name</span>
              <Input
                className={inputClassName}
                name="name"
                required
                maxLength={120}
                disabled={busy}
              />
            </Label>
            <Label className="block space-y-1">
              <span>Course code</span>
              <Input
                className={inputClassName}
                name="code"
                required
                maxLength={40}
                disabled={busy}
                placeholder="e.g. CPS714"
              />
            </Label>
            <Label className="block space-y-1">
              <span>Maximum students</span>
              <Input
                className={inputClassName}
                name="maxStudents"
                type="number"
                min={1}
                step={1}
                required
                disabled={busy}
              />
            </Label>
            <Label className="flex items-center gap-2">
              <input
                name="active"
                type="checkbox"
                defaultChecked
                disabled={busy}
              />
              Open for enrollment
            </Label>
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
        </div>
        <LearningSidebar instructor />
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
