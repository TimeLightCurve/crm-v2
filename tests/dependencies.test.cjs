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
const { createInitialCrm, blankRecord } = require("../lib/records/seed.ts"),
  { saveRecord } = require("../lib/records/model.ts");
test("explicit dependencies reject self, foreign workspace and cyclic links", () => {
  let state = createInitialCrm();
  state = saveRecord(state, {
    ...blankRecord("tasks", state.activeWorkspaceId),
    name: "First",
    ownerId: state.currentMemberId,
  });
  const a = state.records.at(-1);
  state = saveRecord(state, {
    ...blankRecord("tasks", state.activeWorkspaceId),
    name: "Second",
    ownerId: state.currentMemberId,
    dependencyIds: [a.id],
  });
  const b = state.records.at(-1);
  assert.throws(
    () => saveRecord(state, { ...a, dependencyIds: [a.id] }),
    /depend|itself/i,
  );
  assert.throws(
    () => saveRecord(state, { ...a, dependencyIds: [b.id] }),
    /cycle|cyclic/i,
  );
  assert.throws(
    () => saveRecord(state, { ...a, dependencyIds: ["outside"] }),
    /not found|dependency/i,
  );
});
