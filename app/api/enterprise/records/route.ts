import { sameOrigin } from "@/lib/backend-server";
import { actor, create, errorResponse, list } from "@/lib/enterprise/server";
import { kinds, type Kind } from "@/lib/enterprise/domain";
export async function GET(request: Request) {
  try {
    const kind = new URL(request.url).searchParams.get("kind") || undefined;
    if (kind && !kinds.includes(kind as Kind)) throw Error("Invalid kind");
    return Response.json(await list(await actor(request), kind as Kind | undefined), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 20000) return Response.json({ error: "Request too large" }, { status: 413 });
    const body = await request.json();
    if (!kinds.includes(body.kind)) throw Error("Invalid kind");
    return Response.json(await create(await actor(request), body.kind, body.data), { status: 201 });
  } catch (error) { return errorResponse(error); }
}
