/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"
import { api, internal } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.test.ts"])
const paginationOpts = { numItems: 100, cursor: null }
const issuer = "https://sams-test.clerk.accounts.dev"

async function setup() {
  const t = convexTest(schema, modules)
  const instructor = t.withIdentity({
    issuer,
    subject: "instructor",
    name: "Teacher",
  })
  const student = t.withIdentity({
    issuer,
    subject: "student",
    name: "Learner",
  })
  const otherStudent = t.withIdentity({ issuer, subject: "other-student" })
  const otherInstructor = t.withIdentity({
    issuer,
    subject: "other-instructor",
  })
  for (const [client, role] of [
    [instructor, "instructor"],
    [student, "student"],
    [otherStudent, "student"],
    [otherInstructor, "instructor"],
  ] as const)
    await client.mutation(api.users.selectRole, { role })
  const courseId = await instructor.mutation(api.courses.create, {
    name: "  Software Engineering  ",
    code: " cps714 ",
    maxStudents: 2,
    active: true,
  })
  const assignmentId = await instructor.mutation(api.assignments.create, {
    courseId,
    title: "  Project  ",
    description: "  Deliver the project.  ",
    dueDate: Date.now() + 86_400_000,
  })
  return {
    t,
    instructor,
    student,
    otherStudent,
    otherInstructor,
    courseId,
    assignmentId,
  }
}

type Setup = Awaited<ReturnType<typeof setup>>

async function enroll(s: Setup) {
  const enrollmentId = await s.student.mutation(api.enrollments.request, {
    courseId: s.courseId,
  })
  await s.instructor.mutation(api.enrollments.decide, {
    enrollmentId,
    decision: "approved",
  })
  return enrollmentId
}

async function submit(s: Setup, requestId = "submission-request-0001") {
  const storageId = await s.t.run((ctx) =>
    ctx.storage.store(new Blob(["Project contents"]))
  )
  return s.student.mutation(internal.submissions.save, {
    assignmentId: s.assignmentId,
    storageId,
    requestId,
    fileName: "project.txt",
  })
}

describe("student and instructor workflows", () => {
  test("course discovery, enrollment, assignment, submission, grading and history integrate", async () => {
    const s = await setup()
    const courses = await s.student.query(api.courses.active, {
      paginationOpts,
    })
    expect(courses.page).toHaveLength(1)
    expect(courses.page[0]).toMatchObject({
      name: "Software Engineering",
      code: "CPS714",
      enrollmentStatus: null,
    })
    const enrollmentId = await s.student.mutation(api.enrollments.request, {
      courseId: s.courseId,
    })
    expect(
      await s.student.mutation(api.enrollments.request, {
        courseId: s.courseId,
      })
    ).toBe(enrollmentId)
    expect(
      (
        await s.instructor.query(api.enrollments.pending, {
          courseId: s.courseId,
          paginationOpts,
        })
      ).page
    ).toHaveLength(1)
    await expect(
      s.student.query(api.assignments.getForStudent, {
        assignmentId: s.assignmentId,
      })
    ).rejects.toThrow("Assignment not found")
    await s.instructor.mutation(api.enrollments.decide, {
      enrollmentId,
      decision: "approved",
    })
    expect(
      (await s.student.query(api.enrollments.mine, { paginationOpts })).page[0]
        .status
    ).toBe("approved")
    const assignments = await s.student.query(
      api.assignments.forEnrolledCourse,
      { courseId: s.courseId, paginationOpts }
    )
    expect(assignments.page[0]).toMatchObject({
      title: "Project",
      description: "Deliver the project.",
      latestSubmissionId: null,
    })
    const receipt = await submit(s)
    expect(
      (
        await s.instructor.query(api.grades.submissions, {
          assignmentId: s.assignmentId,
          paginationOpts,
        })
      ).page[0].latestSubmissionId
    ).toBe(receipt._id)
    await s.instructor.mutation(api.grades.saveFeedback, {
      submissionId: receipt._id,
      grade: 88.5,
      feedback: "  Clear work.  ",
    })
    expect(
      await s.student.query(api.grades.forStudent, {
        assignmentId: s.assignmentId,
      })
    ).toMatchObject({
      grade: 88.5,
      feedback: "Clear work.",
      evaluatedSubmissionId: receipt._id,
    })
    const history = await s.student.query(api.submissions.forCourse, {
      courseId: s.courseId,
      paginationOpts,
    })
    expect(history.page).toHaveLength(1)
    expect(history.page[0]).toMatchObject({
      _id: receipt._id,
      fileName: "project.txt",
      courseName: "Software Engineering",
    })
    expect(history.page[0].url).toBeTruthy()
    expect(
      await s.instructor.query(api.courses.get, {
        courseId: s.courseId,
        role: "instructor",
      })
    ).toMatchObject({
      approvedCount: 1,
      assignmentCount: 1,
      submissionCount: 1,
      completedCount: 1,
      gradedCount: 1,
    })
  })

  test("rejection is final and inactive/full courses refuse enrollment", async () => {
    const s = await setup()
    const enrollmentId = await s.student.mutation(api.enrollments.request, {
      courseId: s.courseId,
    })
    await s.instructor.mutation(api.enrollments.decide, {
      enrollmentId,
      decision: "rejected",
    })
    await expect(
      s.student.mutation(api.enrollments.request, { courseId: s.courseId })
    ).rejects.toThrow("rejected")
    await expect(
      s.instructor.mutation(api.enrollments.decide, {
        enrollmentId,
        decision: "approved",
      })
    ).rejects.toThrow("already been decided")
    await s.instructor.mutation(api.courses.setActive, {
      courseId: s.courseId,
      active: false,
    })
    expect(
      (await s.otherStudent.query(api.courses.active, { paginationOpts })).page
    ).toHaveLength(0)
    await expect(
      s.otherStudent.mutation(api.enrollments.request, { courseId: s.courseId })
    ).rejects.toThrow("not open")
  })

  test("approval cannot exceed capacity or count repeated decisions twice", async () => {
    const s = await setup()
    await s.t.run((ctx) =>
      ctx.db.patch("courses", s.courseId, { maxStudents: 1 })
    )
    const first = await s.student.mutation(api.enrollments.request, {
      courseId: s.courseId,
    })
    const second = await s.otherStudent.mutation(api.enrollments.request, {
      courseId: s.courseId,
    })
    await s.instructor.mutation(api.enrollments.decide, {
      enrollmentId: first,
      decision: "approved",
    })
    await s.instructor.mutation(api.enrollments.decide, {
      enrollmentId: first,
      decision: "approved",
    })
    await expect(
      s.instructor.mutation(api.enrollments.decide, {
        enrollmentId: second,
        decision: "approved",
      })
    ).rejects.toThrow("full")
    expect(
      await s.t.run((ctx) => ctx.db.get("courses", s.courseId))
    ).toMatchObject({ approvedCount: 1 })
  })

  test("retries are idempotent; resubmission preserves prior evaluation and rejects stale grading", async () => {
    const s = await setup()
    await enroll(s)
    const first = await submit(s)
    expect((await submit(s))._id).toBe(first._id)
    await s.instructor.mutation(api.grades.saveFeedback, {
      submissionId: first._id,
      grade: 75,
      feedback: "First attempt",
    })
    const second = await submit(s, "submission-request-0002")
    expect(second._id).not.toBe(first._id)
    expect(
      await s.student.query(api.grades.forStudent, {
        assignmentId: s.assignmentId,
      })
    ).toMatchObject({
      latestSubmissionId: second._id,
      evaluatedSubmissionId: first._id,
      grade: 75,
    })
    await expect(
      s.instructor.mutation(api.grades.saveFeedback, {
        submissionId: first._id,
        grade: 90,
        feedback: "Stale",
      })
    ).rejects.toThrow("newer attempt")
    await s.instructor.mutation(api.grades.saveFeedback, {
      submissionId: second._id,
      grade: 90,
      feedback: "Revised",
    })
    expect(
      await s.student.query(api.grades.forStudent, {
        assignmentId: s.assignmentId,
      })
    ).toMatchObject({ grade: 90, evaluatedSubmissionId: second._id })
    expect(
      await s.t.run((ctx) => ctx.db.get("courses", s.courseId))
    ).toMatchObject({ submissionCount: 2, completedCount: 1, gradedCount: 1 })
    await s.instructor.mutation(api.grades.saveFeedback, {
      submissionId: second._id,
      grade: null,
      feedback: "Feedback only",
    })
    expect(
      await s.t.run((ctx) => ctx.db.get("courses", s.courseId))
    ).toMatchObject({ gradedCount: 0 })
  })

  test("assignment edits propagate and deletion updates progress while preserving receipt history", async () => {
    const s = await setup()
    await enroll(s)
    const receipt = await submit(s)
    await s.instructor.mutation(api.grades.saveFeedback, {
      submissionId: receipt._id,
      grade: 100,
      feedback: "Done",
    })
    await s.instructor.mutation(api.assignments.update, {
      assignmentId: s.assignmentId,
      title: "Revised project",
      description: "Updated",
      dueDate: Date.now() + 1000,
    })
    expect(
      await s.student.query(api.assignments.getForStudent, {
        assignmentId: s.assignmentId,
      })
    ).toMatchObject({ title: "Revised project" })
    await s.instructor.mutation(api.assignments.remove, {
      assignmentId: s.assignmentId,
    })
    expect(
      await s.t.run((ctx) => ctx.db.get("courses", s.courseId))
    ).toMatchObject({
      assignmentCount: 0,
      submissionCount: 0,
      completedCount: 0,
      gradedCount: 0,
    })
    expect(
      (
        await s.student.query(api.submissions.forCourse, {
          courseId: s.courseId,
          paginationOpts,
        })
      ).page[0]._id
    ).toBe(receipt._id)
    await expect(
      s.student.query(api.assignments.getForStudent, {
        assignmentId: s.assignmentId,
      })
    ).rejects.toThrow("not found")
  })
})

describe("authorization and isolation", () => {
  test("anonymous and wrong-role clients cannot use privileged functions", async () => {
    const s = await setup()
    await expect(
      s.t.query(api.courses.mine, { paginationOpts })
    ).rejects.toThrow("sign in")
    await expect(
      s.student.mutation(api.courses.create, {
        name: "Forged",
        code: "BAD",
        maxStudents: 1,
        active: true,
      })
    ).rejects.toThrow("instructor")
    await expect(
      s.instructor.mutation(api.enrollments.request, { courseId: s.courseId })
    ).rejects.toThrow("student")
  })

  test("other instructors cannot read or modify another instructor's course or work", async () => {
    const s = await setup()
    await enroll(s)
    const receipt = await submit(s)
    expect(
      await s.otherInstructor.query(api.courses.get, {
        courseId: s.courseId,
        role: "instructor",
      })
    ).toBeNull()
    await expect(
      s.otherInstructor.mutation(api.courses.setActive, {
        courseId: s.courseId,
        active: false,
      })
    ).rejects.toThrow("not found")
    await expect(
      s.otherInstructor.query(api.enrollments.pending, {
        courseId: s.courseId,
        paginationOpts,
      })
    ).rejects.toThrow("not found")
    await expect(
      s.otherInstructor.mutation(api.assignments.remove, {
        assignmentId: s.assignmentId,
      })
    ).rejects.toThrow("not found")
    await expect(
      s.otherInstructor.query(api.grades.submissions, {
        assignmentId: s.assignmentId,
        paginationOpts,
      })
    ).rejects.toThrow("not found")
    await expect(
      s.otherInstructor.mutation(api.grades.saveFeedback, {
        submissionId: receipt._id,
        grade: 100,
        feedback: "Forged",
      })
    ).rejects.toThrow("not found")
  })

  test("unenrolled students cannot read assignments, history, evaluations or upload", async () => {
    const s = await setup()
    await enroll(s)
    await submit(s)
    expect(
      await s.otherStudent.query(api.courses.get, {
        courseId: s.courseId,
        role: "student",
      })
    ).toBeNull()
    await expect(
      s.otherStudent.query(api.assignments.forEnrolledCourse, {
        courseId: s.courseId,
        paginationOpts,
      })
    ).rejects.toThrow("not enrolled")
    await expect(
      s.otherStudent.query(api.submissions.forCourse, {
        courseId: s.courseId,
        paginationOpts,
      })
    ).rejects.toThrow("enrolled")
    await expect(
      s.otherStudent.query(api.grades.forStudent, {
        assignmentId: s.assignmentId,
      })
    ).rejects.toThrow("not enrolled")
    await expect(
      s.otherStudent.query(internal.submissions.authorizeUpload, {
        assignmentId: s.assignmentId,
        requestId: "unauthorized-request-01",
      })
    ).rejects.toThrow("enrolled")
  })

  test("enrolled classmates only see their own submissions and evaluation", async () => {
    const s = await setup()
    await enroll(s)
    const request = await s.otherStudent.mutation(api.enrollments.request, {
      courseId: s.courseId,
    })
    await s.instructor.mutation(api.enrollments.decide, {
      enrollmentId: request,
      decision: "approved",
    })
    await submit(s)
    expect(
      (
        await s.otherStudent.query(api.submissions.forAssignment, {
          assignmentId: s.assignmentId,
          paginationOpts,
        })
      ).page
    ).toEqual([])
    expect(
      (await s.otherStudent.query(api.submissions.mine, { paginationOpts }))
        .page
    ).toEqual([])
    expect(
      await s.otherStudent.query(api.grades.forStudent, {
        assignmentId: s.assignmentId,
      })
    ).toBeNull()
  })

  test("assignment IDs cannot be used through a different course", async () => {
    const s = await setup()
    const otherCourse = await s.instructor.mutation(api.courses.create, {
      name: "Other",
      code: "OTHER",
      maxStudents: 2,
      active: true,
    })
    expect(
      await s.instructor.query(api.assignments.get, {
        courseId: otherCourse,
        assignmentId: s.assignmentId,
        role: "instructor",
      })
    ).toBeNull()
  })
})

describe("profile synchronization", () => {
  test("role selection is permanent and identities are scoped to their issuer", async () => {
    const s = await setup()
    await expect(
      s.student.mutation(api.users.selectRole, { role: "instructor" })
    ).rejects.toThrow("cannot be changed")
    expect(
      await s.student.mutation(api.users.selectRole, { role: "student" })
    ).toBe("student")
    const unrelated = s.t.withIdentity({
      issuer: "https://different.clerk.accounts.dev",
      subject: "instructor",
    })
    expect(await unrelated.query(api.users.current, {})).toBeNull()
    await expect(
      unrelated.query(api.courses.mine, { paginationOpts })
    ).rejects.toThrow("active instructor")
  })

  test("out-of-order profile events preserve newer data and deleted accounts stay inaccessible", async () => {
    const s = await setup()
    const profile = {
      issuer,
      clerkId: "student",
      name: "Updated learner",
      email: "learner@example.test",
      imageUrl: null,
      sourceUpdatedAt: 20,
      eventTimestamp: 20,
    }
    await s.t.mutation(internal.users.upsertFromClerk, profile)
    await s.t.mutation(internal.users.upsertFromClerk, {
      ...profile,
      name: "Stale learner",
      sourceUpdatedAt: 10,
      eventTimestamp: 30,
    })
    expect(await s.student.query(api.users.current, {})).toMatchObject({
      name: "Updated learner",
      role: "student",
    })
    await s.t.mutation(internal.users.deleteFromClerk, {
      issuer,
      clerkId: "student",
      eventTimestamp: 40,
    })
    await s.t.mutation(internal.users.upsertFromClerk, {
      ...profile,
      sourceUpdatedAt: 50,
      eventTimestamp: 50,
    })
    expect(await s.student.query(api.users.current, {})).toBeNull()
    await expect(
      s.student.mutation(api.users.selectRole, { role: "student" })
    ).rejects.toThrow("deleted")
    await expect(
      s.student.query(api.courses.active, { paginationOpts })
    ).rejects.toThrow("active student")
  })
})

describe("validation and upload boundaries", () => {
  test("HTTP preflight and malformed upload requests fail without creating receipts", async () => {
    const s = await setup()
    await enroll(s)
    const path = "/assignment-submissions"
    const preflight = await s.t.fetch(path, { method: "OPTIONS" })
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get("Access-Control-Allow-Headers")).toContain(
      "X-Submission-Key"
    )
    const headers = {
      Authorization: "Bearer test-identity",
      "X-File-Name": "report.txt",
      "X-Submission-Key": "malformed-request-01",
    }
    const missing = await s.student.fetch(path, {
      method: "POST",
      headers,
      body: "test",
    })
    expect(missing.status).toBe(400)
    const invalidId = await s.student.fetch(`${path}?assignmentId=invalid`, {
      method: "POST",
      headers,
      body: "test",
    })
    expect(invalidId.status).toBe(400)
    const malformedName = await s.student.fetch(
      `${path}?assignmentId=${s.assignmentId}`,
      {
        method: "POST",
        headers: { ...headers, "X-File-Name": "%E0%A4%A" },
        body: "test",
      }
    )
    expect(malformedName.status).toBe(400)
    expect(await malformedName.json()).toMatchObject({
      error: "Please select a file with a valid name (up to 255 characters).",
    })
    expect(
      (await s.student.query(api.submissions.mine, { paginationOpts })).page
    ).toEqual([])
  })

  test("HTTP upload saves authenticated bytes, retries once, and returns actionable errors", async () => {
    const s = await setup()
    await enroll(s)
    const url = `/assignment-submissions?assignmentId=${s.assignmentId}`
    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer test-identity",
        "Content-Type": "text/plain",
        "X-File-Name": encodeURIComponent("Project report.txt"),
        "X-Submission-Key": "http-upload-request-01",
      },
      body: "Project report content",
    }
    const response = await s.student.fetch(url, options)
    expect(response.status).toBe(200)
    const receipt = await response.json()
    expect(await (await s.student.fetch(url, options)).json()).toEqual(receipt)
    expect(
      (await s.student.query(api.submissions.mine, { paginationOpts })).page
    ).toHaveLength(1)
    const anonymous = await s.t.fetch(url, { method: "POST", body: "test" })
    expect(anonymous.status).toBe(401)
    expect(await anonymous.json()).toMatchObject({
      error: "Please sign in to submit work.",
    })
    const empty = await s.student.fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "X-Submission-Key": "http-empty-request-01",
      },
      body: "",
    })
    expect(empty.status).toBe(400)
    expect(await empty.json()).toMatchObject({
      error: "Select a non-empty file.",
    })
    const denied = await s.otherStudent.fetch(url, options)
    expect(denied.status).toBe(400)
    expect(await denied.json()).toMatchObject({
      error: "You must be enrolled in this course to submit work.",
    })
  })

  test("HTTP upload refuses oversized bodies and malformed file names without receipts", async () => {
    const s = await setup()
    await enroll(s)
    const url = `/assignment-submissions?assignmentId=${s.assignmentId}`
    const headers = {
      Authorization: "Bearer test-identity",
      "X-Submission-Key": "oversized-upload-request-01",
      "X-File-Name": "report.txt",
    }
    const oversized = await s.student.fetch(url, {
      method: "POST",
      headers,
      body: new Uint8Array(25 * 1024 * 1024 + 1),
    })
    expect(oversized.status).toBe(413)
    const invalidName = await s.student.fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        "X-File-Name": encodeURIComponent("bad\nname.txt"),
      },
      body: "test",
    })
    expect(invalidName.status).toBe(400)
    expect(await invalidName.json()).toMatchObject({
      error: "Please select a file with a valid name (up to 255 characters).",
    })
    expect(
      (await s.student.query(api.submissions.mine, { paginationOpts })).page
    ).toHaveLength(0)
  })

  test("course and assignment fields are validated on the server", async () => {
    const s = await setup()
    await expect(
      s.instructor.mutation(api.courses.create, {
        name: "Other",
        code: "cps714",
        maxStudents: 2,
        active: true,
      })
    ).rejects.toThrow("already have")
    await expect(
      s.instructor.mutation(api.courses.create, {
        name: " ",
        code: "VALID",
        maxStudents: 2,
        active: true,
      })
    ).rejects.toThrow("Course name")
    await expect(
      s.instructor.mutation(api.courses.create, {
        name: "Other",
        code: "NEW",
        maxStudents: 1.5,
        active: true,
      })
    ).rejects.toThrow("whole number")
    await expect(
      s.instructor.mutation(api.assignments.create, {
        courseId: s.courseId,
        title: " ",
        description: "",
        dueDate: 1,
      })
    ).rejects.toThrow("title")
    await expect(
      s.instructor.mutation(api.assignments.update, {
        assignmentId: s.assignmentId,
        title: "Valid",
        description: "",
        dueDate: NaN,
      })
    ).rejects.toThrow("valid due date")
    await expect(
      s.instructor.mutation(api.assignments.update, {
        assignmentId: s.assignmentId,
        title: "Valid",
        description: "",
        dueDate: Number.MAX_VALUE,
      })
    ).rejects.toThrow("valid due date")
  })

  test("empty files, malformed retry keys and cross-assignment key reuse are rejected", async () => {
    const s = await setup()
    await enroll(s)
    const storageId = await s.t.run((ctx) => ctx.storage.store(new Blob([])))
    await expect(
      s.student.mutation(internal.submissions.save, {
        assignmentId: s.assignmentId,
        storageId,
        requestId: "empty-upload-request-01",
        fileName: "empty.txt",
      })
    ).rejects.toThrow("non-empty")
    await expect(
      s.student.query(internal.submissions.authorizeUpload, {
        assignmentId: s.assignmentId,
        requestId: "bad",
      })
    ).rejects.toThrow("Invalid submission request")
    await submit(s)
    const second = await s.instructor.mutation(api.assignments.create, {
      courseId: s.courseId,
      title: "Second",
      description: "",
      dueDate: 1,
    })
    await expect(
      s.student.query(internal.submissions.authorizeUpload, {
        assignmentId: second,
        requestId: "submission-request-0001",
      })
    ).rejects.toThrow("Invalid submission request")
  })

  test("invalid grades and excessive feedback cannot overwrite saved evaluation", async () => {
    const s = await setup()
    await enroll(s)
    const receipt = await submit(s)
    for (const grade of [-1, 101, NaN, Infinity]) {
      await expect(
        s.instructor.mutation(api.grades.saveFeedback, {
          submissionId: receipt._id,
          grade,
          feedback: "",
        })
      ).rejects.toThrow("between 0 and 100")
    }
    await expect(
      s.instructor.mutation(api.grades.saveFeedback, {
        submissionId: receipt._id,
        grade: 50,
        feedback: "x".repeat(10_001),
      })
    ).rejects.toThrow("10,000")
    expect(
      await s.student.query(api.grades.forStudent, {
        assignmentId: s.assignmentId,
      })
    ).toMatchObject({ grade: null, evaluatedAt: null })
  })
})
