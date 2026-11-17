import Link from "next/link"

export default function NotFound() {
  return (
    <section className="page-width flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        This page may have moved, or the link may be incomplete.
      </p>
      <Link
        className="text-primary underline underline-offset-4"
        href="/dashboard"
      >
        Back to my courses
      </Link>
    </section>
  )
}
