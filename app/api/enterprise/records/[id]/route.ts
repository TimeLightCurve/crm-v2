import { sameOrigin } from "@/lib/backend-server";
import { actor, change, errorResponse, get, history } from "@/lib/enterprise/server";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/.test(id)) throw Error("Invalid ID");
    const user = await actor(request);
    return Response.json({ record: await get(user, id), history: await history(user, id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request, context: Context) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/.test(id)) throw Error("Invalid ID");
    if (Number(request.headers.get("content-length") || 0) > 20000) return Response.json({ error: "Request too large" }, { status: 413 });
    const body = await request.json();
    return Response.json(await change(await actor(request), id, body.revision, body.data, body.action === "approve"));
  } catch (error) { return errorResponse(error); }
}
