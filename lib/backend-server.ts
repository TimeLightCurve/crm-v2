import "server-only";
export function backendURL() {
  return (process.env.NABZ_API_URL || "http://127.0.0.1:8081").replace(
    /\/$/,
    "",
  );
}
export function sessionCookie(request: Request) {
  return (
    (request.headers.get("cookie") || "")
      .split(";")
      .map((v) => v.trim())
      .find((v) => /^nabz_session=[A-Za-z0-9_-]+$/.test(v)) || ""
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}
