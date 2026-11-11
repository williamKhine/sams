"use client"

import { createContext, useContext, useEffect } from "react"
import type { FunctionReturnType } from "convex/server"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import DashboardNavigation from "@/components/layout/dashboard-navigation"

type DashboardUser = NonNullable<
  FunctionReturnType<typeof api.users.current>
> & { role: "student" | "instructor" }
const DashboardUserContext = createContext<DashboardUser | null>(null)

export function useDashboardUser() {
  const user = useContext(DashboardUserContext)
  if (!user)
    throw new Error("Dashboard content requires an authenticated profile.")
  return user
}

export default function DashboardShell({
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
    <div className="flex flex-1 flex-col [&>p]:mx-auto [&>p]:py-16">
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
        <DashboardUserContext.Provider value={{ ...user, role: user.role }}>
          <DashboardNavigation role={user.role} />
          <div className="page-width dashboard-content w-full flex-1 py-8 sm:py-10">
            {children}
          </div>
        </DashboardUserContext.Provider>
      )}
    </div>
  )
}
