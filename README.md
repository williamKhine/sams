# SAMS — Student Assignment Management System

CPS714 · Software Project Management · Fall 2026 · Group 8

William Khine, Ngu Eain Zin, Vyshnavi Vijendran

SAMS uses Next.js App Router, React, Clerk authentication, Convex, and shadcn/ui. Students enroll in courses, submit assignments, and read grades and feedback. Instructors manage courses, approve enrollments, and evaluate submissions.

## Development

Install dependencies with `npm ci`. Configure `.env.local` with your development environment's `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`. `NEXT_PUBLIC_CONVEX_SITE_URL` is optional for standard Convex cloud deployments; uploads derive the HTTP site URL from the cloud URL otherwise. Never commit credentials.

The Convex deployment also needs `CLERK_FRONTEND_API_URL` and `CLERK_WEBHOOK_SIGNING_SECRET`. Configure Clerk's Convex authentication integration and the user webhook endpoint in `convex/http.ts` for your environment.

Run `npx convex dev` and `npm run dev` in separate terminals. The application opens at `http://localhost:3000`. Verify the Convex deployment target before pushing backend changes.

## Structure

- `app/`: route entry points, nested layouts, redirects, and route error handling.
- `components/layout/`: header, footer, dashboard authentication boundary, and dynamic navigation.
- `components/providers/`: Convex and theme providers.
- `components/dashboard/`: student and instructor dashboard composition.
- `components/courses/`: course shell/context, course screens, cards, creation, enrollments, and teaching overview.
- `components/assignments/`: assignment management, student list, details, and deadline status.
- `components/grades/`: evaluation forms, grade tables, feedback, and grade error handling.
- `components/submissions/`: upload form, receipts, and course submission history.
- `components/shared/`: shared learning visuals, pagination, and progress.
- `components/ui/`: shadcn/ui primitives.
- `lib/`: route builders, date formatting, error messages, token retrieval, and pure status logic.
- `convex/`: validated queries/mutations, HTTP uploads, schema, and backend helpers. Generated files are owned by Convex.

## Routing and data boundaries

`/dashboard` is My courses. Course tools live under `/dashboard/courses/[courseId]`: course home, `assignments`, `assignments/[assignmentId]`, `grades`, and `submissions`. Legacy dashboard-wide tool URLs redirect to My courses. Navigation changes with course context and role; grades and submission history are student tools.

The dashboard shell resolves the signed-in profile once and shares it with descendants. The course shell resolves authorized course access and shares the course and role. Individual route screens own their feature queries instead of branching through one multipurpose page. Client checks control presentation; Convex independently enforces every permission.

`convex/lib/access.ts` centralizes course ownership and approved enrollment checks. `convex/lib/submissions.ts` centralizes upload validation and retry-key lookups. Progress counters and latest submission tracking remain transactional. Repeated upload requests use the same key to avoid duplicate attempts. Grades and feedback belong to a specific evaluated attempt; a newer submission remains visible as needing review.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build` (or `npm run build -- --webpack` where Turbopack cannot run)

No test framework is installed. For manual verification, check both roles: course navigation, enrollment controls, assignment management, uploads/history, and saved grades/feedback. Keep test credentials outside the repository.
