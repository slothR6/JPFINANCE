const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function safeInternalPath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://jpfinance.local");
    if (url.origin !== "https://jpfinance.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
