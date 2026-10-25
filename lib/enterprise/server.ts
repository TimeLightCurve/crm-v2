import "server-only";
import { readFileSync } from "node:fs";
import { Pool, type PoolClient } from "pg";
import { backendURL, sessionCookie } from "@/lib/backend-server";
import { canApprove, canRead, canWrite, type EnterpriseRecord, type Kind, kinds, validateInput } from "./domain";

type Actor = { id: string; tenant_id: string; name: string; role: string; permissions: string[] };
let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;
function db() {
  const connectionString = process.env.ENTERPRISE_DATABASE_URL || (process.env.ENTERPRISE_DATABASE_URL_FILE ? readFileSync(process.env.ENTERPRISE_DATABASE_URL_FILE, "utf8").trim() : "");
  if (!connectionString) throw Error("Enterprise database is not configured");
  return pool ??= new Pool({ connectionString, max: 8 });
}
async function schema() {
  schemaReady ??= (async () => {
    await db().query(`CREATE TABLE IF NOT EXISTS enterprise_records (
      tenant_id text NOT NULL, id uuid NOT NULL, kind text NOT NULL, data jsonb NOT NULL,
      revision integer NOT NULL DEFAULT 1, created_by text NOT NULL, updated_by text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (tenant_id, id), CHECK (kind IN ('decision','case','meeting','action','knowledge','risk'))
    )`);
    await db().query(`CREATE INDEX IF NOT EXISTS enterprise_records_tenant_kind ON enterprise_records (tenant_id, kind, updated_at DESC)`);
    await db().query(`CREATE TABLE IF NOT EXISTS enterprise_events (
      id bigserial PRIMARY KEY, tenant_id text NOT NULL, record_id uuid NOT NULL,
      actor_id text NOT NULL, event_type text NOT NULL, revision integer NOT NULL,
      changed_at timestamptz NOT NULL DEFAULT now(), detail jsonb NOT NULL
    )`);
    await db().query(`CREATE INDEX IF NOT EXISTS enterprise_events_record ON enterprise_events (tenant_id, record_id, id DESC)`);
  })().catch((error) => { schemaReady = undefined; throw error; });
  await schemaReady;
}
export async function actor(request: Request): Promise<Actor> {
  const cookie = sessionCookie(request);
  if (!cookie) throw Object.assign(Error("Sign in to Nabz CRM"), { status: 401 });
  const response = await fetch(`${backendURL()}/api/auth/me`, { headers: { Cookie: cookie }, cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw Object.assign(Error("Nabz session is unavailable"), { status: response.status === 401 ? 401 : 503 });
  const user = await response.json() as Actor;
  if (!user.id || !user.tenant_id || !Array.isArray(user.permissions)) throw Object.assign(Error("Invalid Nabz identity"), { status: 503 });
  return user;
}
export function authorize(user: Actor, operation: "read" | "write" | "approve") {
  const allowed = operation === "read" ? canRead(user.permissions) : operation === "write" ? canWrite(user.permissions) : canApprove(user.role, user.permissions);
  if (!allowed) throw Object.assign(Error("Insufficient permission"), { status: 403 });
}
function row(record: { id: string; kind: Kind; data: Omit<EnterpriseRecord, "id" | "kind" | "revision" | "createdAt" | "updatedAt">; revision: number; created_at: Date; updated_at: Date }): EnterpriseRecord {
  return { ...record.data, id: record.id, kind: record.kind, revision: record.revision, createdAt: record.created_at.toISOString(), updatedAt: record.updated_at.toISOString() };
}
export async function list(user: Actor, kind?: Kind) {
  authorize(user, "read"); await schema();
  const result = kind
    ? await db().query("SELECT * FROM enterprise_records WHERE tenant_id=$1 AND kind=$2 ORDER BY updated_at DESC LIMIT 500", [user.tenant_id, kind])
    : await db().query("SELECT * FROM enterprise_records WHERE tenant_id=$1 ORDER BY updated_at DESC LIMIT 500", [user.tenant_id]);
  return result.rows.map(row);
}
export async function get(user: Actor, id: string) {
  authorize(user, "read"); await schema();
  const result = await db().query("SELECT * FROM enterprise_records WHERE tenant_id=$1 AND id=$2", [user.tenant_id, id]);
  if (!result.rows.length) throw Object.assign(Error("Record not found"), { status: 404 });
  return row(result.rows[0]);
}
async function tx<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try { await client.query("BEGIN"); const result = await run(client); await client.query("COMMIT"); return result; }
  catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
async function validateLinks(client: PoolClient, tenantId: string, ids: unknown) {
  const links = ids as string[];
  if (!links.length) return;
  if (links.some((id) => !/^[0-9a-f-]{36}$/.test(id)) || new Set(links).size !== links.length) throw Error("Linked records must have distinct valid IDs");
  const found = await client.query("SELECT id::text FROM enterprise_records WHERE tenant_id=$1 AND id = ANY($2::uuid[])", [tenantId, links]);
  if (found.rows.length !== links.length) throw Error("Linked record is unavailable in this organization");
}
export async function create(user: Actor, kind: Kind, input: unknown) {
  authorize(user, "write"); await schema();
  if (!kinds.includes(kind)) throw Error("Invalid kind");
  const data = validateInput(input, kind);
  const id = crypto.randomUUID();
  return tx(async (client) => {
    await validateLinks(client, user.tenant_id, data.sourceIds);
    const result = await client.query("INSERT INTO enterprise_records (tenant_id,id,kind,data,created_by,updated_by) VALUES ($1,$2,$3,$4,$5,$5) RETURNING *", [user.tenant_id, id, kind, data, user.id]);
    await client.query("INSERT INTO enterprise_events (tenant_id,record_id,actor_id,event_type,revision,detail) VALUES ($1,$2,$3,'created',1,$4)", [user.tenant_id, id, user.id, { title: data.title }]);
    return row(result.rows[0]);
  });
}
export async function change(user: Actor, id: string, revision: number, input: unknown, approve = false) {
  authorize(user, approve ? "approve" : "write"); await schema();
  if (!Number.isSafeInteger(revision) || revision < 1) throw Error("Invalid revision");
  return tx(async (client) => {
    const found = await client.query("SELECT * FROM enterprise_records WHERE tenant_id=$1 AND id=$2 FOR UPDATE", [user.tenant_id, id]);
    if (!found.rows.length) throw Object.assign(Error("Record not found"), { status: 404 });
    const current = row(found.rows[0]);
    if (current.revision !== revision) throw Object.assign(Error("Record changed; reload before saving"), { status: 409 });
    if (approve && (current.kind !== "decision" || current.stage !== "ready" || current.approvedAt)) throw Error("Only a ready, unapproved decision can be approved");
    const data = approve
      ? { ...found.rows[0].data, approvedAt: new Date().toISOString(), approvedBy: user.id }
      : { ...validateInput(input, current.kind, current), approvedAt: current.approvedAt, approvedBy: current.approvedBy };
    if (!approve) await validateLinks(client, user.tenant_id, data.sourceIds);
    const updated = await client.query("UPDATE enterprise_records SET data=$3, revision=revision+1, updated_by=$4, updated_at=now() WHERE tenant_id=$1 AND id=$2 RETURNING *", [user.tenant_id, id, data, user.id]);
    await client.query("INSERT INTO enterprise_events (tenant_id,record_id,actor_id,event_type,revision,detail) VALUES ($1,$2,$3,$4,$5,$6)", [user.tenant_id, id, user.id, approve ? "approved" : "updated", revision + 1, approve ? { stage: current.stage } : { fields: Object.keys(input as object) }]);
    return row(updated.rows[0]);
  });
}
export async function history(user: Actor, id: string) {
  await get(user, id);
  const result = await db().query("SELECT id, actor_id, event_type, revision, changed_at, detail FROM enterprise_events WHERE tenant_id=$1 AND record_id=$2 ORDER BY id DESC LIMIT 100", [user.tenant_id, id]);
  return result.rows;
}
export function errorResponse(error: unknown) {
  const cause = error as Error & { status?: number; code?: string };
  const status = cause.status || (cause.message === "Enterprise database is not configured" ? 503 : cause.code ? 503 : 400);
  return Response.json({ error: cause.message || "Request failed" }, { status, headers: { "Cache-Control": "no-store" } });
}
