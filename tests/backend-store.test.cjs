const fs = require("node:fs"),
  ts = require("typescript");
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    file,
  );
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const api = require("../lib/backend.ts");
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));
const user = {
  id: "u",
  tenant_id: "tenant",
  name: "QA",
  username: "qa",
  department: "sales",
  role: "manager",
  permissions: ["sales:read", "sales:write"],
};
function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}
test("queued saves serialize revisions and preserve edits made during a request", async () => {
  let revision = 0,
    stored = [],
    release;
  const puts = [];
  global.fetch = async (path, options) => {
    if (path.endsWith("auth/me")) return response(user);
    if (options?.method === "PUT") {
      const doc = JSON.parse(options.body);
      puts.push(doc);
      if (puts.length === 1)
        await new Promise((resolve) => (release = resolve));
      assert.equal(doc.revision, revision);
      revision++;
      stored = doc.data;
      return response({ revision, data: stored });
    }
    return response({ revision: 0, data: path.endsWith("schedule") ? [] : {} });
  };
  await api.loadSession();
  api.updateDocument("schedule", () => ["first"]);
  api.updateDocument("schedule", (s) => [...s, "second"]);
  release();
  await tick();
  assert.equal(puts.length, 2);
  assert.equal(puts[1].revision, 1);
  assert.deepEqual(stored, ["first", "second"]);
  assert.deepEqual(api.getDocument("schedule"), stored);
});
test("failed save rolls back to confirmed data even when the subsequent read is offline", async () => {
  let offline = false;
  global.fetch = async (path, options) => {
    if (path.endsWith("auth/me")) return response(user);
    if (options?.method === "PUT") {
      offline = true;
      return response({ error: "Conflict" }, 409);
    }
    if (offline) throw Error("Offline");
    return response({
      revision: 1,
      data: path.endsWith("schedule") ? ["confirmed"] : {},
    });
  };
  await api.loadSession();
  api.updateDocument("schedule", () => ["unsaved"]);
  await tick();
  assert.deepEqual(api.getDocument("schedule"), ["confirmed"]);
});
test("late responses from an invalidated session cannot replace another tenant state", async () => {
  let identity = { ...user, tenant_id: "A" },
    invalid = false,
    release;
  global.fetch = async (path, options) => {
    if (path.endsWith("auth/me"))
      return invalid ? response({ error: "Expired" }, 401) : response(identity);
    if (options?.method === "PUT") {
      const sent = JSON.parse(options.body);
      if (sent.data[0] === "A edit")
        return await new Promise(
          (resolve) =>
            (release = () =>
              resolve(response({ revision: 2, data: sent.data }))),
        );
      return response({ revision: 2, data: sent.data });
    }
    return response({
      revision: 1,
      data: path.endsWith("schedule") ? [identity.tenant_id] : {},
    });
  };
  await api.loadSession();
  api.updateDocument("schedule", () => ["A edit"]);
  invalid = true;
  await assert.rejects(api.backend("auth/me"));
  identity = { ...user, id: "b", tenant_id: "B" };
  invalid = false;
  await api.loadSession();
  release();
  await tick();
  assert.deepEqual(api.getDocument("schedule"), ["B"]);
});
test("an edit after a failed save drains normally instead of being stranded by recovery", async () => {
  let puts = 0,
    recoveryRelease,
    failed = false;
  global.fetch = async (path, options) => {
    if (path.endsWith("auth/me")) return response(user);
    if (options?.method === "PUT") {
      puts++;
      if (puts === 1) {
        failed = true;
        return response({ error: "Conflict" }, 409);
      }
      return response({ revision: 3, data: JSON.parse(options.body).data });
    }
    if (failed && path.endsWith("schedule"))
      return await new Promise(
        (resolve) =>
          (recoveryRelease = () =>
            resolve(response({ revision: 2, data: ["latest"] }))),
      );
    return response({
      revision: 1,
      data: path.endsWith("schedule") ? ["confirmed"] : {},
    });
  };
  await api.loadSession();
  api.updateDocument("schedule", () => ["failed"]);
  await tick();
  api.updateDocument("schedule", () => ["new edit"]);
  if (recoveryRelease) recoveryRelease();
  await tick();
  assert.equal(puts, 2);
  assert.deepEqual(api.getDocument("schedule"), ["new edit"]);
});
test('a session refresh cannot overwrite edits that began while its reads were in flight',async()=>{
 let hold=false,release;
 global.fetch=async(path,options)=>{
  if(path.endsWith('auth/me'))return response(user);
  if(options?.method==='PUT')return response({revision:2,data:JSON.parse(options.body).data});
  if(hold&&path.endsWith('schedule'))return await new Promise(resolve=>release=()=>resolve(response({revision:1,data:['old']})));
  return response({revision:1,data:path.endsWith('schedule')?['old']:{}});
 };
 await api.loadSession();hold=true;const refresh=api.loadSession();await tick();api.updateDocument('schedule',()=>['new user edit']);await tick();release();await assert.rejects(refresh,/sav|chang|refresh/i);assert.deepEqual(api.getDocument('schedule'),['new user edit']);
});
