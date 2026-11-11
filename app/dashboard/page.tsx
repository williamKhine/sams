"use client"

import { useDashboardUser } from "@/components/layout/dashboard-shell"
import InstructorDashboard from "@/components/dashboard/instructor-dashboard"
import StudentDashboard from "@/components/dashboard/student-dashboard"

export default function DashboardPage() {
  const user = useDashboardUser()
  return user.role === "instructor" ? (
    <InstructorDashboard name={user.name} />
  ) : (
    <StudentDashboard name={user.name} />
  )
}
