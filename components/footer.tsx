import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t p-4 text-center font-mono text-xs text-muted-foreground">
      SAMS © 2026 · CPS714 F2026 ·{" "}
      <Link href="/group-8" className="underline">
        Group 8
      </Link>
    </footer>
  )
}