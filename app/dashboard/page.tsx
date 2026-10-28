"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import InstructorDashboard from "@/components/dashboard/instructor-dashboard"
import StudentDashboard from "@/components/dashboard/student-dashboard"

export default function DashboardPage() {
  const user = useQuery(api.users.current)
  if (!user?.role) return null
  return user.role === "instructor" ? (
    <InstructorDashboard name={user.name} />
  ) : (
    <StudentDashboard name={user.name} />
  )
}
