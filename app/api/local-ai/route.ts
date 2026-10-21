import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const { backendURL, sameOrigin, sessionCookie } = await import(
    "@/lib/backend-server"
  );
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Cross-origin request rejected" },
      { status: 403 },
    );
  try {
    const auth = await fetch(`${backendURL()}/api/auth/me`, {
      headers: { Cookie: sessionCookie(request) },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!auth.ok)
      return NextResponse.json(
        { error: "Sign in to use the assistant" },
        { status: 401 },
      );
  } catch {
    return NextResponse.json(
      { error: "Identity service unavailable" },
      { status: 503 },
    );
  }
  if (process.env.LM_STUDIO_ENABLED !== "true")
    return NextResponse.json(
      {
        error:
          "LM Studio is disabled. Set LM_STUDIO_ENABLED=true and start your local model server when ready.",
      },
      { status: 503 },
    );
  try {
    const body = await request.json();
    if (
      !Array.isArray(body.messages) ||
      body.messages.length > 24 ||
      typeof body.model !== "string" ||
      body.model.length > 160
    )
      return NextResponse.json(
        { error: "Invalid chat request." },
        { status: 400 },
      );
    const messages = body.messages.map((message: unknown) => {
      if (!message || typeof message !== "object")
        throw Error("Invalid message.");
      const value = message as Record<string, unknown>;
      if (
        !["system", "user", "assistant"].includes(String(value.role)) ||
        typeof value.content !== "string" ||
        value.content.length > 24000
      )
        throw Error("Invalid message.");
      return { role: value.role, content: value.content };
    });
    const url = new URL(
      process.env.LM_STUDIO_BASE_URL ?? "http://127.0.0.1:1234/v1/",
    );
    if (
      !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
      url.protocol !== "http:"
    )
      return NextResponse.json(
        {
          error:
            "LM Studio must use a local HTTP endpoint configured on the server.",
        },
        { status: 500 },
      );
    const response = await fetch(
      `${url.href.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.LM_STUDIO_API_KEY
            ? { Authorization: `Bearer ${process.env.LM_STUDIO_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({
          model: body.model,
          messages,
          temperature: 0.3,
          max_tokens: 1000,
          stream: false,
        }),
        signal: AbortSignal.timeout(45000),
        cache: "no-store",
      },
    );
    if (!response.ok)
      return NextResponse.json(
        {
          error: `Local model server returned ${response.status}. Check its model and server settings.`,
        },
        { status: 502 },
      );
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    if (typeof answer !== "string")
      return NextResponse.json(
        { error: "Local model returned an unsupported response." },
        { status: 502 },
      );
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not reach LM Studio. Check that the local server is running and the selected Qwen model is loaded.",
      },
      { status: 502 },
    );
  }
}
