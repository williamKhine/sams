import AssignmentDetail from "@/components/assignments/assignment-detail"

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>
}) {
  const { assignmentId } = await params
  return <AssignmentDetail assignmentId={assignmentId} />
}
