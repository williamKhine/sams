import { verifyWebhook } from "@clerk/backend/webhooks"
import { httpRouter } from "convex/server"
import { ConvexError } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { MAX_SUBMISSION_BYTES, validateFileName } from "./lib/submissions"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"

const http = httpRouter()

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
    const issuer = process.env.CLERK_FRONTEND_API_URL
    if (!signingSecret || !issuer) {
      console.error("Clerk webhook environment variables are missing")
      return new Response("Webhook is not configured", { status: 503 })
    }

    let event
    try {
      // Verify the original request body before reading any event data.
      event = await verifyWebhook(request, { signingSecret })
    } catch {
      return new Response("Invalid webhook signature", { status: 400 })
    }

    // Keep write errors outside the verification catch. A failed transaction
    // must produce a failure response so Clerk can retry the delivery.
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const user = event.data
        const primaryEmail = user.email_addresses.find(
          (email) => email.id === user.primary_email_address_id
        )
        await ctx.runMutation(internal.users.upsertFromClerk, {
          issuer,
          clerkId: user.id,
          name:
            [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
          imageUrl: user.image_url || null,
          email: primaryEmail?.email_address ?? null,
          sourceUpdatedAt: user.updated_at,
          eventTimestamp: event.timestamp,
        })
        break
      }
      case "user.deleted": {
        const clerkId = event.data.id
        if (!clerkId) {
          return new Response("Missing user ID", { status: 400 })
        }
        await ctx.runMutation(internal.users.deleteFromClerk, {
          issuer,
          clerkId,
          eventTimestamp: event.timestamp,
        })
        break
      }
    }

    return new Response(null, { status: 204 })
  }),
})

const submissionCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-File-Name, X-Submission-Key",
  "Access-Control-Max-Age": "86400",
}

http.route({
  path: "/assignment-submissions",
  method: "OPTIONS",
  handler: httpAction(
    async () => new Response(null, { status: 204, headers: submissionCors })
  ),
})

http.route({
  path: "/assignment-submissions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const respond = (body: object, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...submissionCors, "Content-Type": "application/json" },
      })
    let storageId: Id<"_storage"> | undefined
    try {
      if (!request.headers.get("Authorization"))
        return respond({ error: "Please sign in to submit work." }, 401)
      const assignmentId = new URL(request.url).searchParams.get(
        "assignmentId"
      ) as Id<"assignments"> | null
      const requestId = request.headers.get("X-Submission-Key")
      const fileName = decodeURIComponent(
        request.headers.get("X-File-Name") ?? ""
      )
      if (!assignmentId || !requestId || !fileName)
        return respond({ error: "Select an assignment and a file." }, 400)
      const previous = await ctx.runQuery(
        internal.submissions.authorizeUpload,
        { assignmentId, requestId }
      )
      if (previous) return respond({ submissionId: previous._id })
      validateFileName(fileName)
      if (Number(request.headers.get("Content-Length")) > MAX_SUBMISSION_BYTES)
        return respond({ error: "Files must be 25 MB or smaller." }, 413)
      const reader = request.body?.getReader()
      if (!reader) return respond({ error: "Select a non-empty file." }, 400)
      const chunks: ArrayBuffer[] = []
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_SUBMISSION_BYTES) {
          await reader.cancel()
          return respond({ error: "Files must be 25 MB or smaller." }, 413)
        }
        chunks.push(new Uint8Array(value).buffer)
      }
      if (size === 0) return respond({ error: "Select a non-empty file." }, 400)
      storageId = await ctx.storage.store(
        new Blob(chunks, {
          type:
            request.headers.get("Content-Type") ?? "application/octet-stream",
        })
      )
      // Recheck enrollment and assignment existence in the transaction that saves the receipt.
      const saved = await ctx.runMutation(internal.submissions.save, {
        assignmentId,
        requestId,
        fileName,
        storageId,
      })
      if (saved.storageId !== storageId) await ctx.storage.delete(storageId)
      storageId = undefined
      return respond({ submissionId: saved._id })
    } catch (error) {
      if (storageId) await ctx.storage.delete(storageId)
      return respond(
        {
          error:
            error instanceof ConvexError && typeof error.data === "string"
              ? error.data
              : "Upload failed. Please check your connection and try again.",
        },
        400
      )
    }
  }),
})

export default http
