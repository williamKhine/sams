type GetToken = (options?: { template?: string }) => Promise<string | null>

// Match ConvexProviderWithClerk: the direct integration adds the Convex
// audience to the session token; older setups use a named JWT template.
export function getConvexToken(getToken: GetToken, sessionClaims: unknown) {
  const usesIntegration =
    sessionClaims !== null &&
    typeof sessionClaims === "object" &&
    "aud" in sessionClaims &&
    sessionClaims.aud === "convex"
  return usesIntegration ? getToken() : getToken({ template: "convex" })
}
