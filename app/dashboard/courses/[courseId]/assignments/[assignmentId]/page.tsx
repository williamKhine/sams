import CoursePage from "@/components/dashboard/course-page"

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>
}) {
  const { courseId, assignmentId } = await params
  return <CoursePage courseId={courseId} assignmentId={assignmentId} />
}
