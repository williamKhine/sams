export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="page-width flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">SAMS.</span> Student
          Assignment Management System
        </p>
        <p>© {new Date().getFullYear()} SAMS · CPS714 · Group 8</p>
      </div>
    </footer>
  )
}
