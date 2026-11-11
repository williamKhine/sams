"use client"

import { EnrollmentActivity } from "@/components/courses/enrollment-activity"
import { StudentCourseCard } from "@/components/courses/course-cards"
import { useState } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { courseError } from "@/lib/errors"
import { LoadMore } from "@/components/shared/load-more"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  WelcomeBanner,
  EmptyState,
  CourseSkeletons,
  LearningSidebar,
} from "@/components/shared/learning-ui"

export default function StudentDashboard({ name }: { name: string | null }) {
  const courses = usePaginatedQuery(
    api.courses.active,
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
                    <StudentCourseCard
                      key={course._id}
                      course={course}
                      index={index}
                      busy={busy}
                      onEnroll={enroll}
                    />
                  ))}
                </div>
              )}
              <LoadMore status={courses.status} loadMore={courses.loadMore} />
            </CardContent>
          </Card>
          <EnrollmentActivity />
        </div>
        <LearningSidebar />
      </div>
    </section>
  )
}
