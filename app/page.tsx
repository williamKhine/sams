"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SignInButton, useAuth } from "@clerk/nextjs"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"

type Role = "instructor" | "student"

export default function Page() {
  const { isLoaded, isSignedIn } = useAuth()
  const { isLoading, isAuthenticated } = useConvexAuth()

  return (
    <div className="container mx-auto py-12">
      {!isLoaded || isLoading ? (
        <p role="status">Loading your account…</p>
      ) : !isSignedIn ? (
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold">Welcome to SAMS.</h1>
          <p className="text-muted-foreground">
            Sign in or create an account to get started.
          </p>
          <SignInButton mode="modal" forceRedirectUrl="/">
            <Button>Sign in</Button>
          </SignInButton>
        </section>
      ) : !isAuthenticated ? (
        <p role="alert">
          We couldn’t connect your account. Please refresh the page or sign in
          again.
        </p>
      ) : (
        <AccountHome />
      )}
    </div>
  )
}

function AccountHome() {
  const router = useRouter()
  const user = useQuery(api.users.current)

  useEffect(() => {
    if (user?.role) router.replace("/dashboard")
  }, [router, user?.role])

  if (user === undefined) return <p role="status">Loading your profile…</p>
  if (!user?.role) return <RoleSelection />
  return <p role="status">Opening your dashboard…</p>
}

function RoleSelection() {
  const selectRole = useMutation(api.users.selectRole)
  const [pendingRole, setPendingRole] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function chooseRole(role: Role) {
    if (pendingRole) return
    setPendingRole(role)
    setError(null)
    try {
      await selectRole({ role })
      // The reactive current-user query redirects to the dashboard after save.
    } catch (error) {
      setError(
        error instanceof ConvexError && typeof error.data === "string"
          ? error.data
          : "We couldn’t save your role. Please try again."
      )
    } finally {
      setPendingRole(null)
    }
  }

  return (
    <section
      className="mx-auto max-w-2xl space-y-6"
      aria-busy={pendingRole !== null}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">How will you use SAMS?</h1>
        <p className="text-muted-foreground">
          Choose your role to get started. This choice cannot be changed later.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["instructor", "student"] as const).map((role) => (
          <div key={role} className="space-y-4 rounded-xl border p-6">
            <h2 className="text-xl font-semibold">
              {role === "instructor" ? "Instructor" : "Student"}
            </h2>
            <p className="text-muted-foreground">
              {role === "instructor"
                ? "Teach and manage your classes."
                : "Join classes and follow your learning."}
            </p>
            <Button
              disabled={pendingRole !== null}
              onClick={() => void chooseRole(role)}
            >
              {pendingRole === role ? "Saving…" : `Continue as ${role}`}
            </Button>
          </div>
        ))}
      </div>
      {pendingRole && <p role="status">Saving your role…</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
