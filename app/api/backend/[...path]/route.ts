import { backendURL, sameOrigin, sessionCookie } from "@/lib/backend-server";
async function proxy(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const route = path.join("/");
  if (
    !/^(auth\/(me|login|logout|password|options)|forma\/(crm|schedule|calls)|agents(?:\/(?:command|history))?|staff|deals(?:\/[a-f0-9-]+(?:\/history)?)?|tasks(?:\/[a-f0-9-]+)?)$/.test(
      route,
    )
  )
    return Response.json({ error: "Not found" }, { status: 404 });
  if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request))
    return Response.json(
      { error: "Cross-origin request rejected" },
      { status: 403 },
    );
  try {
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.text();
    if (body && body.length > 6_000_000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const upstream = await fetch(
      `${backendURL()}/api/${route}${new URL(request.url).search}`,
      {
        method: request.method,
        body,
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(
          route === "agents/command" ? 100000 : 20000,
        ),
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie(request),
          "X-Forwarded-Proto": new URL(request.url).protocol.slice(0, -1),
        },
      },
    );
    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    for (const cookie of upstream.headers.getSetCookie())
      headers.append("Set-Cookie", cookie);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return Response.json(
      {
        error:
          "Nabz backend is unavailable. Start the Forma API container and retry.",
      },
      { status: 503 },
    );
  }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
