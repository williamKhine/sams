import { ConvexError, v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"

const nullableString = v.union(v.string(), v.null())
const roleValidator = v.union(v.literal("instructor"), v.literal("student"))

export const selectRole = mutation({
  args: { role: roleValidator },
  returns: roleValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Sign in to select your role.")
    const user = await ctx.db
      .query("users")
      .withIndex("by_issuer_and_clerkId", (q) =>
        q.eq("issuer", identity.issuer).eq("clerkId", identity.subject)
      )
      .unique()

    if (user) {
      if (user.deletedAt !== null)
        throw new ConvexError("This account has been deleted.")
      if (user.role) {
        if (user.role !== args.role) {
          throw new ConvexError(
            "Your role has already been selected and cannot be changed."
          )
        }
        return user.role
      }
      await ctx.db.patch("users", user._id, {
        role: args.role,
        roleSelectedAt: Date.now(),
      })
    } else {


      await ctx.db.insert("users", {
        issuer: identity.issuer,
        clerkId: identity.subject,
        name: identity.name ?? null,
        email: identity.email ?? null,
        imageUrl: identity.pictureUrl ?? null,
        sourceUpdatedAt: 0,
        eventTimestamp: 0,
        deletedAt: null,
        role: args.role,
        roleSelectedAt: Date.now(),
      })
    }
    return args.role
  },
})


export const current = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      name: nullableString,
      imageUrl: nullableString,
      email: nullableString,
      role: v.optional(v.union(v.literal("instructor"), v.literal("student"))),
      roleSelectedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_issuer_and_clerkId", (q) =>
        q.eq("issuer", identity.issuer).eq("clerkId", identity.subject)
      )
      .unique()
    if (!user || user.deletedAt !== null) return null

    return {
      _id: user._id,
      name: user.name,
      imageUrl: user.imageUrl,
      email: user.email,
      role: user.role,
      roleSelectedAt: user.roleSelectedAt,
    }
  },
})

export const upsertFromClerk = internalMutation({
  args: {
    issuer: v.string(),
    clerkId: v.string(),
    name: nullableString,
    imageUrl: nullableString,
    email: nullableString,
    sourceUpdatedAt: v.number(),
    eventTimestamp: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_issuer_and_clerkId", (q) =>
        q.eq("issuer", args.issuer).eq("clerkId", args.clerkId)
      )
      .unique()

    if (existing) {

      if (existing.deletedAt !== null) return null
      if (
        args.sourceUpdatedAt < existing.sourceUpdatedAt ||
        (args.sourceUpdatedAt === existing.sourceUpdatedAt &&
          args.eventTimestamp <= existing.eventTimestamp)
      ) {
        return null
      }
      await ctx.db.patch("users", existing._id, args)
    } else {
      await ctx.db.insert("users", { ...args, deletedAt: null })
    }
    return null
  },
})

export const deleteFromClerk = internalMutation({
  args: {
    issuer: v.string(),
    clerkId: v.string(),
    eventTimestamp: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_issuer_and_clerkId", (q) =>
        q.eq("issuer", args.issuer).eq("clerkId", args.clerkId)
      )
      .unique()
    if (existing?.deletedAt !== undefined && existing.deletedAt !== null) {
      return null
    }


    const tombstone = {
      ...args,
      name: null,
      imageUrl: null,
      email: null,
      sourceUpdatedAt: existing?.sourceUpdatedAt ?? 0,
      deletedAt: args.eventTimestamp,
    }
    if (existing) {
      await ctx.db.patch("users", existing._id, tombstone)
    } else {
      await ctx.db.insert("users", tombstone)
    }
    return null
  },
})
