"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardError({ retry }: { retry: () => void }) {
  return (
    <section className="page-width space-y-4 py-12">
      <h1 className="text-2xl font-semibold">Unable to load your dashboard</h1>
      <p role="alert" className="max-w-lg text-muted-foreground">
        Check your connection and try again. If the problem continues, refresh
        the page or sign in again.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
        <Link className="text-primary underline underline-offset-4" href="/">
          Back to home
        </Link>
      </div>
    </section>
  )
}
