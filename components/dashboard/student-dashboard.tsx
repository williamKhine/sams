"use client"

import { useState } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { courseError, LoadMore } from "./course-ui"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CourseArtwork,
  WelcomeBanner,
  EmptyState,
  CourseSkeletons,
  LearningSidebar,
} from "./learning-ui"

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
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")
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

  const filtered = courses.results.filter(
    (course) =>
      `${course.name} ${course.code} ${course.instructorName ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (tab === "all" ||
        (tab === "enrolled"
          ? course.enrollmentStatus === "approved"
          : course.enrollmentStatus === "pending"))
  )

  return (
    <section className="space-y-7">
      <WelcomeBanner name={name} />
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-md border border-primary/20 bg-secondary p-4 text-sm"
        >
          {notice}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <Card id="my-courses" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                My courses
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Explore your courses and pick up where you left off.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <Tabs
                  value={tab}
                  onValueChange={(value) => setTab(String(value))}
                >
                  <TabsList variant="line">
                    <TabsTrigger value="all">All courses</TabsTrigger>
                    <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-full sm:w-52">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={17}
                    className="absolute top-2.5 left-3 text-muted-foreground"
                  />
                  <Input
                    aria-label="Search courses"
                    placeholder="Search courses"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {courses.status === "LoadingFirstPage" ? (
                <CourseSkeletons />
              ) : filtered.length === 0 ? (
                <EmptyState
                  title={
                    search ? "No matching courses" : "No courses to display"
                  }
                >
                  {search
                    ? "Try another course name or code."
                    : "Courses will appear here when they are available. Browse All courses to find a class to join."}
                </EmptyState>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {filtered.map((course, index) => (
                    <Card
                      key={course._id}
                      className="gap-0 py-0 shadow-none transition-shadow hover:shadow-md"
                    >
                      <CourseArtwork code={course.code} index={index} />
                      <CardContent className="flex-1 space-y-3 p-5">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {course.code}
                        </p>
                        <h3 className="text-base leading-snug font-semibold">
                          {course.enrollmentStatus === "approved" ? (
                            <Link
                              className="hover:text-primary hover:underline"
                              href={`/dashboard/courses/${course._id}`}
                            >
                              {course.name}
                            </Link>
                          ) : (
                            course.name
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {course.instructorName ??
                            "Instructor to be announced"}
                        </p>
                        <Badge variant="secondary">
                          {course.enrollmentStatus
                            ? statusLabel[course.enrollmentStatus]
                            : "Open for enrollment"}
                        </Badge>
                      </CardContent>
                      <CardFooter className="flex-wrap justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
                        <span>
                          {course.approvedCount} / {course.maxStudents} students
                        </span>
                        {course.enrollmentStatus === "approved" ? (
                          <Link
                            href={`/dashboard/courses/${course._id}`}
                            className="flex items-center gap-1 font-medium text-primary"
                          >
                            Open course{" "}
                            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                          </Link>
                        ) : !course.enrollmentStatus ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              busy || course.approvedCount >= course.maxStudents
                            }
                            onClick={() => void enroll(course._id)}
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
                  ))}
                </div>
              )}
              <LoadMore status={courses.status} loadMore={courses.loadMore} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Enrollment activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollments.status === "LoadingFirstPage" ? (
                <p role="status" className="text-muted-foreground">
                  Loading enrollments…
                </p>
              ) : enrollments.results.length === 0 ? (
                <p className="text-muted-foreground">
                  Your enrollment requests and their status will appear here.
                </p>
              ) : (
                enrollments.results.map((enrollment) => (
                  <div
                    key={enrollment._id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {enrollment.status === "approved" ? (
                          <Link
                            className="hover:text-primary hover:underline"
                            href={`/dashboard/courses/${enrollment.courseId}`}
                          >
                            {enrollment.courseName}
                          </Link>
                        ) : (
                          enrollment.courseName
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {enrollment.courseCode}
                        {!enrollment.courseActive ? " · Course inactive" : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {statusLabel[enrollment.status]}
                    </Badge>
                  </div>
                ))
              )}
              <LoadMore
                status={enrollments.status}
                loadMore={enrollments.loadMore}
              />
            </CardContent>
          </Card>
        </div>
        <LearningSidebar />
      </div>
    </section>
  )
}
