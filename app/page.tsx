"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SignInButton, useAuth } from "@clerk/nextjs"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  Folder01Icon,
  Mortarboard01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"

type Role = "instructor" | "student"

export default function Page() {
  const { isLoaded, isSignedIn } = useAuth()
  const { isLoading, isAuthenticated } = useConvexAuth()

  return (
    <div className="page-width flex flex-1 flex-col justify-center py-12 sm:py-20">
      {!isLoaded || isLoading ? (
        <p role="status">Loading your account…</p>
      ) : !isSignedIn ? (
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <section className="space-y-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Welcome to your learning environment
            </p>
            <h1 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              A place to learn.
              <br />
              <span className="text-primary">A space to grow.</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
              Connect with your courses, stay on top of assignments, and take
              the next step in your learning journey with SAMS.
            </p>
            <SignInButton mode="modal" forceRedirectUrl="/">
              <Button size="lg">
                Sign in to your account{" "}
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </Button>
            </SignInButton>
            <p className="text-xs text-muted-foreground">
              Your classroom, wherever you are.
            </p>
          </section>
          <Card className="gap-0 overflow-hidden py-0">
            <div className="course-art relative overflow-hidden bg-[#195e85] px-7 py-10 text-white">
              <HugeiconsIcon
                icon={Mortarboard01Icon}
                size={42}
                strokeWidth={1.5}
                className="mb-5"
              />
              <h2 className="relative z-10 text-2xl font-semibold">
                Everything you need.
                <br />
                One learning space.
              </h2>
            </div>
            <CardContent className="space-y-6 p-7">
              {[
                {
                  icon: BookOpen01Icon,
                  title: "Your courses, connected",
                  detail:
                    "Find your classes and stay connected to your instructors.",
                },
                {
                  icon: Folder01Icon,
                  title: "Every assignment in view",
                  detail:
                    "Follow deadlines, upload your work, and track your submissions.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <HugeiconsIcon icon={item.icon} size={22} />
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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
          <Card key={role} className="gap-4 p-6">
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
          </Card>
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
