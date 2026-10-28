import CoursePage from "@/components/dashboard/course-page"

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  return <CoursePage courseId={courseId} view="submissions" />
}
