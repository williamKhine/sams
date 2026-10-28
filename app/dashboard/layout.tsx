"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import StudentNavigation from "@/components/dashboard/student-navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip")

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/")
    } else if (isAuthenticated && user !== undefined && !user?.role) {
      router.replace("/")
    }
  }, [router, isLoaded, isSignedIn, isAuthenticated, user])

  return (
    <main className="container mx-auto py-12">
      {!isLoaded || isLoading ? (
        <p role="status">Loading your account…</p>
      ) : !isSignedIn ? (
        <p role="status">Returning to sign in…</p>
      ) : !isAuthenticated ? (
        <p role="alert">
          We couldn’t connect your account. Please refresh the page or sign in
          again.
        </p>
      ) : user === undefined ? (
        <p role="status">Loading your profile…</p>
      ) : !user?.role ? (
        <p role="status">Returning to role selection…</p>
      ) : (
        <>
          {user.role === "student" && <StudentNavigation />}
          {children}
        </>
      )}
    </main>
  )
}
