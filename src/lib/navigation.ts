/** Accept only same-site relative destinations for post-auth redirects. */
export function sanitizeInternalPath(candidate: string | null | undefined): string | null {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return null
  try {
    const target = new URL(candidate, "https://loqmart.invalid")
    if (target.origin !== "https://loqmart.invalid") return null
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return null
  }
}
